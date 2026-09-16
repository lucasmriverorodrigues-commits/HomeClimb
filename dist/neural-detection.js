// HomeClimb inference adapter. No photo or prediction is sent to a server.
export function detectionTiles(width,height){
 const side=Math.round(Math.min(width,height)*.7),tiles=[{x:0,y:0,w:width,h:height,full:true}];
 if(side<100)return tiles;
 const positions=length=>{const count=Math.min(5,Math.max(2,Math.ceil(length/(side*.8))));return Array.from({length:count},(_,i)=>Math.round(i*(length-side)/(count-1)));};
 for(const y of positions(height))for(const x of positions(width))tiles.push({x,y,w:side,h:side,full:false});
 return tiles;
}
export function letterbox(image,tile,size=640){
 const scale=size/Math.max(tile.w,tile.h),rw=Math.round(tile.w*scale),rh=Math.round(tile.h*scale),dx=Math.floor((size-rw)/2),dy=Math.floor((size-rh)/2),plane=size*size;
 const values=new Float32Array(3*plane);values.fill(114/255);
 for(let y=0;y<rh;y++)for(let x=0;x<rw;x++){
  const sx=Math.max(0,Math.min(tile.w-1,(x+.5)*tile.w/rw-.5)),sy=Math.max(0,Math.min(tile.h-1,(y+.5)*tile.h/rh-.5));
  const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0,x1=Math.min(tile.w-1,x0+1),y1=Math.min(tile.h-1,y0+1);
  const a=((y0+tile.y)*image.width+x0+tile.x)*4,b=((y0+tile.y)*image.width+x1+tile.x)*4,c=((y1+tile.y)*image.width+x0+tile.x)*4,d=((y1+tile.y)*image.width+x1+tile.x)*4;
  for(let k=0;k<3;k++)values[k*plane+(y+dy)*size+x+dx]=((image.data[a+k]*(1-fx)+image.data[b+k]*fx)*(1-fy)+(image.data[c+k]*(1-fx)+image.data[d+k]*fx)*fy)/255;
 }
 return {values,scale,dx,dy};
}
export function decodeBoxes(data,count,transform,tile,width,height,threshold=.3){
 const boxes=[];const {scale,dx,dy}=transform;
 for(let i=0;i<count;i++){
  const score=data[4*count+i];if(!Number.isFinite(score)||score<threshold)continue;
  const cx=data[i],cy=data[count+i],w=data[2*count+i],h=data[3*count+i];
  const x1=(cx-w/2-dx)/scale,y1=(cy-h/2-dy)/scale,x2=(cx+w/2-dx)/scale,y2=(cy+h/2-dy)/scale;
  if(!tile.full&&((tile.x>0&&x1<4)||(tile.y>0&&y1<4)||(tile.x+tile.w<width&&x2>tile.w-4)||(tile.y+tile.h<height&&y2>tile.h-4)))continue;
  const box=[Math.max(0,(tile.x+x1)/width),Math.max(0,(tile.y+y1)/height),Math.min(1,(tile.x+x2)/width),Math.min(1,(tile.y+y2)/height)];
  if(box.every(Number.isFinite)&&box[2]>box[0]&&box[3]>box[1])boxes.push({box,score});
 }
 return boxes;
}
export function suppressDuplicates(predictions){
 const kept=[];
 for(const item of predictions.sort((a,b)=>b.score-a.score)){
  const a=item.box,area=(a[2]-a[0])*(a[3]-a[1]);
  if(kept.some(({box:b})=>{const other=(b[2]-b[0])*(b[3]-b[1]),intersection=Math.max(0,Math.min(a[2],b[2])-Math.max(a[0],b[0]))*Math.max(0,Math.min(a[3],b[3])-Math.max(a[1],b[1]));return intersection/(area+other-intersection)>.4||intersection/Math.min(area,other)>.85;}))continue;
  kept.push(item);if(kept.length>=1000)break;
 }
 return kept;
}
export async function neuralDetect(ort,session,image,progress=()=>{}){
 if(image.width*image.height>4000000||image.data.length!==image.width*image.height*4)throw Error('Imagem inválida.');
 const tiles=detectionTiles(image.width,image.height),all=[],threshold=({careful:.5,balanced:.3,detailed:.2}[image.preset]||.3);
 for(let i=0;i<tiles.length;i++){
  progress(`Localizando agarras: parte ${i+1} de ${tiles.length}`);
  const transform=letterbox(image,tiles[i]),input=new ort.Tensor('float32',transform.values,[1,3,640,640]);let output;
  try{output=await session.run({[session.inputNames[0]]:input});const tensor=output[session.outputNames[0]];if(tensor.dims.length!==3||tensor.dims[1]!==5)throw Error('Modelo de agarras incompatível.');all.push(...decodeBoxes(tensor.data,tensor.dims[2],transform,tiles[i],image.width,image.height,threshold));}
  finally{input.dispose?.();if(output)Object.values(output).forEach(t=>t.dispose?.());}
 }
 return suppressDuplicates(all).map(({box:[x1,y1,x2,y2],score})=>({x:(x1+x2)/2,y:(y1+y2)/2,radius:Math.max(.008,Math.min(.1,Math.max(x2-x1,(y2-y1)*image.height/image.width)/2)),area:(x2-x1)*(y2-y1)*image.width*image.height,contour:[[x1,y1],[x2,y1],[x2,y2],[x1,y2]],score,neural:true}));
}
