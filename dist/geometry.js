export function holdPath(h,w=1000,height=1000){
 if(h.contour?.length>=3)return h.contour.map(([x,y],i)=>`${i?'L':'M'}${x*w},${y*height}`).join(' ')+' Z';
 const x=h.x*w,y=h.y*height,r=h.radius*w;
 return `M${x-r},${y} a${r},${r} 0 1,0 ${2*r},0 a${r},${r} 0 1,0 ${-2*r},0`;
}
export function nextHoldName(holds,faceId){let n=1;const names=new Set(holds.filter(h=>h.faceId===faceId).map(h=>h.name));while(names.has('A'+n))n++;return 'A'+n;}
export function removeFace(wall,faceId){wall.faces=wall.faces.filter(f=>f.id!==faceId);wall.holds=wall.holds.filter(h=>h.faceId!==faceId);}
// Trace the outside edges of the connected pixel region, preserving concavities.
export function pixelContour(pixels,width,height){
 const set=new Set(pixels),edges=new Map(),stride=width+1;
 const edge=(x,y,a,b)=>{const key=y*stride+x;if(!edges.has(key))edges.set(key,[]);edges.get(key).push(b*stride+a);};
 for(const p of pixels){const x=p%width,y=Math.floor(p/width);
  if(y===0||!set.has(p-width))edge(x,y,x+1,y);
  if(x===width-1||!set.has(p+1))edge(x+1,y,x+1,y+1);
  if(y===height-1||!set.has(p+width))edge(x+1,y+1,x,y+1);
  if(x===0||!set.has(p-1))edge(x,y+1,x,y);
 }
 let best=[];
 while(edges.size){const start=edges.keys().next().value;let key=start,loop=[];
  do{loop.push([key%stride/width,Math.floor(key/stride)/height]);const list=edges.get(key);if(!list)break;const next=list.pop();if(!list.length)edges.delete(key);key=next;}while(key!==start);
  if(loop.length>best.length)best=loop;
 }
 const step=Math.max(1,Math.ceil(best.length/192));return best.filter((_,i)=>i%step===0);
}
export function backgroundSamples(data){
 const bins=new Map();for(let i=0;i<data.length;i+=16){if(data[i+3]<128)continue;const key=[0,1,2].map(k=>data[i+k]>>5).join(',');const b=bins.get(key)||{n:0,sum:[0,0,0]};b.n++;for(let k=0;k<3;k++)b.sum[k]+=data[i+k];bins.set(key,b);}
 const sorted=[...bins.values()].sort((a,b)=>b.n-a.n),top=sorted[0]?.n||0;
 return sorted.filter(b=>b.n>=top*.3).slice(0,4).map(b=>b.sum.map(v=>Math.round(v/b.n)));
}
