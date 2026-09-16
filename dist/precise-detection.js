import {detectHolds} from './hold-detection.js';
import {pixelContour} from './geometry.js';

export function insideContour(x,y,points){
 let inside=false;
 for(let i=0,j=points.length-1;i<points.length;j=i++){
  const [ax,ay]=points[i],[bx,by]=points[j];
  if((ay>y)!==(by>y)&&x<(bx-ax)*(y-ay)/(by-ay)+ax)inside=!inside;
 }
 return inside;
}

// Refinement is limited to a local crop, so other holds cannot absorb the mask.
export function refineHold(cv,image,candidate){
 const {width,height,data}=image,points=candidate.contour;
 if(!points?.length)return {...candidate,refined:false};
 const xs=points.map(p=>p[0]*width),ys=points.map(p=>p[1]*height);
 const pad=Math.max(4,Math.ceil(Math.max(Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*.25));
 const left=Math.max(0,Math.floor(Math.min(...xs))-pad),top=Math.max(0,Math.floor(Math.min(...ys))-pad);
 const right=Math.min(width,Math.ceil(Math.max(...xs))+pad),bottom=Math.min(height,Math.ceil(Math.max(...ys))+pad);
 const w=right-left,h=bottom-top;if(w<7||h<7||w*h>160000)return {...candidate,refined:false};
 let rgb,mask,bgd,fgd;try{
  rgb=new cv.Mat(h,w,cv.CV_8UC3);mask=new cv.Mat(h,w,cv.CV_8UC1);bgd=new cv.Mat();fgd=new cv.Mat();
  let foreground=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const p=y*w+x,source=((y+top)*width+x+left)*4;
   rgb.data[p*3]=data[source];rgb.data[p*3+1]=data[source+1];rgb.data[p*3+2]=data[source+2];
   const inHold=insideContour((x+left+.5)/width,(y+top+.5)/height,points);
   mask.data[p]=(x===0||y===0||x===w-1||y===h-1||(candidate.neural&&!inHold))?cv.GC_BGD:inHold?cv.GC_PR_FGD:cv.GC_PR_BGD;
   if(inHold)foreground++;
  }
  if(foreground<6||foreground>w*h-6)return {...candidate,refined:false};
  cv.grabCut(rgb,mask,new cv.Rect(),bgd,fgd,2,cv.GC_INIT_WITH_MASK);
  // Keep only the component having the greatest overlap with the proposal.
  const visited=new Uint8Array(w*h),queue=new Int32Array(w*h);let best=[],bestOverlap=0;
  for(let p=0;p<w*h;p++){
   if(visited[p]||!(mask.data[p]&1))continue;
   let head=0,tail=1,overlap=0;queue[0]=p;visited[p]=1;
   while(head<tail){const q=queue[head++],x=q%w,y=Math.floor(q/w);
    if(insideContour((x+left+.5)/width,(y+top+.5)/height,points))overlap++;
    for(const [dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const xx=x+dx,yy=y+dy,n=yy*w+xx;if(xx<0||yy<0||xx>=w||yy>=h||visited[n]||!(mask.data[n]&1))continue;visited[n]=1;queue[tail++]=n;}
   }
   if(overlap>bestOverlap){bestOverlap=overlap;best=Array.from(queue.slice(0,tail));}
  }
  // Reject runaway cuts rather than quietly expanding across adjacent holds.
  if(best.length<6||best.length>foreground*1.8||best.length<foreground*(candidate.neural ? .15 : .4)||bestOverlap<foreground*(candidate.neural ? .15 : .35))return {...candidate,refined:false};
  const contour=pixelContour(best,w,h).map(([x,y])=>[(x*w+left)/width,(y*h+top)/height]);
  if(contour.length<3)return {...candidate,refined:false};
  const x=best.reduce((s,p)=>s+p%w+left+.5,0)/best.length/width,y=best.reduce((s,p)=>s+Math.floor(p/w)+top+.5,0)/best.length/height;
  const ring=[0,0,0],center=[0,0,0];let count=0;
  for(let p=0;p<w*h;p++){if(p<w||p>=(h-1)*w||p%w===0||p%w===w-1){for(let k=0;k<3;k++)ring[k]+=rgb.data[p*3+k];count++;}}
  for(const p of best)for(let k=0;k<3;k++)center[k]+=rgb.data[p*3+k];
  const contrast=Math.hypot(...center.map((v,k)=>v/best.length-ring[k]/count))/Math.sqrt(3);
  const darkNeutral=Math.max(...center.map(v=>v/best.length))-Math.min(...center.map(v=>v/best.length))<22&&Math.max(...center.map(v=>v/best.length))<75;
  const confidence=contrast>=35&&!darkNeutral&&best.length>=12?'strong':'review';
  return {...candidate,x,y,contour,area:best.length,refined:true,confidence};
 }finally{rgb?.delete();mask?.delete();bgd?.delete();fgd?.delete();}
}

export function preciseDetection(cv,input,onProgress=()=>{}){
 const preset=input.preset||'balanced';
 const minDiameter=input.minDiameter??({careful:1.8,balanced:1.2,detailed:.65}[preset]||1.2);
 const result=detectHolds({...input,minDiameter,splitColors:true});
 const start=Date.now();let refined=0;
 result.candidates=result.candidates.map((c,i)=>{
  if(Date.now()-start>18000)return {...c,refined:false,confidence:'review'};
  let next;
  try{next=refineHold(cv,input,c);}catch{next={...c,refined:false};}
  if(next.refined)refined++;
  if(i%10===0||i===result.candidates.length-1)onProgress(i+1,result.candidates.length);
  return {...next,confidence:next.confidence||'review'};
 });
 return {...result,refined,pending:result.candidates.length-refined};
}
