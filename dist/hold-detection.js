import {pixelContour,backgroundSamples} from './geometry.js';
// Color-background subtraction produces candidates, never semantic labels.
export function detectHolds({data,width,height,samples,automatic=false,splitColors=false,tolerance=35,minDiameter=1.2}) {
  if(!Number.isInteger(width)||!Number.isInteger(height)||width<1||height<1||width*height>1200000||data?.length!==width*height*4) throw Error('Imagem inválida.');
  if(automatic)samples=backgroundSamples(data);
  if(!Array.isArray(samples)||!samples.length||samples.length>12||samples.some(s=>!Array.isArray(s)||s.length!==3||s.some(v=>!Number.isFinite(v)||v<0||v>255))) throw Error('Marque de 1 a 12 cores da parede.');
  if(!Number.isFinite(tolerance)||tolerance<8||tolerance>100||!Number.isFinite(minDiameter)||minDiameter<.5||minDiameter>8) throw Error('Ajustes inválidos.');
  const n=width*height,raw=new Uint8Array(n),mask=new Uint8Array(n),limit=tolerance*tolerance*3;
  for(let p=0;p<n;p++) {
    const i=p*4;
    if(data[i+3]<128)continue;
    raw[p]=samples.every(s=>(data[i]-s[0])**2+(data[i+1]-s[1])**2+(data[i+2]-s[2])**2>limit)?1:0;
  }
  // Local majority removes single-pixel noise without joining distant holds.
  for(let y=1;y<height-1;y++)for(let x=1;x<width-1;x++) {
    const p=y*width+x;let count=0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)count+=raw[p+dy*width+dx];
    mask[p]=count>=5?1:0;
  }
  const queue=new Int32Array(n),candidates=[];
  const minimum=Math.max(5,Math.PI*(width*minDiameter/200)**2);
  let rejected=0;
  for(let p=0;p<n;p++) {
    if(!mask[p])continue;
    let head=0,tail=1,minX=width,maxX=0,minY=height,maxY=0,sumX=0,sumY=0;
    queue[0]=p;mask[p]=0;
    while(head<tail) {
      const q=queue[head++],x=q%width,y=Math.floor(q/width);
      minX=Math.min(minX,x);maxX=Math.max(maxX,x);minY=Math.min(minY,y);maxY=Math.max(maxY,y);sumX+=x;sumY+=y;
      for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
        const nx=x+dx,ny=y+dy;
        if(nx<0||nx>=width||ny<0||ny>=height)continue;
        const next=ny*width+nx;if(mask[next]){if(splitColors&&((data[q*4]-data[next*4])**2+(data[q*4+1]-data[next*4+1])**2+(data[q*4+2]-data[next*4+2])**2)>3*85**2)continue;mask[next]=0;queue[tail++]=next;}
      }
    }
    const bw=maxX-minX+1,bh=maxY-minY+1,diameter=Math.max(bw,bh);
    if(tail<minimum||diameter>width*.2||Math.max(bw/bh,bh/bw)>5||tail/(bw*bh)<.18){rejected++;continue;}
    candidates.push({x:sumX/tail/width,y:sumY/tail/height,radius:Math.max(.008,Math.min(.1,diameter/width/2)),area:tail,contour:pixelContour(queue.slice(0,tail),width,height)});
  }
  candidates.sort((a,b)=>a.y-b.y||a.x-b.x);
  return {candidates:candidates.slice(0,1000),rejected,truncated:candidates.length>1000};
}
export function withoutExisting(candidates,existing,aspect) {
  return candidates.filter(c=>!existing.some(h=>Math.hypot(c.x-h.x,(c.y-h.y)/aspect)<Math.max(.012,Math.min(c.radius,h.radius))));
}
