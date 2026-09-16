import {holdPath} from './geometry.js';
export function orderedHolds(holds,faceId){return holds.filter(h=>h.faceId===faceId).sort((a,b)=>a.y-b.y||a.x-b.x);}
export function nextPending(holds,current){const list=orderedHolds(holds,current.faceId),i=list.findIndex(h=>h.id===current.id);return [...list.slice(i+1),...list.slice(0,i)].find(h=>h.quality==='unknown');}
export function holdPreview(host,face,hold){
 const w=1000,h=w/face.aspect,p=hold.contour||[[hold.x-hold.radius,hold.y-hold.radius*face.aspect],[hold.x+hold.radius,hold.y+hold.radius*face.aspect]];
 const xs=p.map(p=>p[0]*w),ys=p.map(p=>p[1]*h),size=Math.max(100,Math.max(...xs)-Math.min(...xs),Math.max(...ys)-Math.min(...ys))*1.8;
 const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox',`${hold.x*w-size/2} ${hold.y*h-size/2} ${size} ${size}`);svg.setAttribute('role','img');svg.setAttribute('aria-label',`Detalhe da agarra ${hold.name}`);
 const image=document.createElementNS(svg.namespaceURI,'image');image.setAttribute('href',face.photo);image.setAttribute('width',w);image.setAttribute('height',h);svg.append(image);
 const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',holdPath(hold,w,h));path.setAttribute('fill','none');path.setAttribute('stroke','#fff36a');path.setAttribute('stroke-width','3');path.setAttribute('vector-effect','non-scaling-stroke');svg.append(path);host.replaceChildren(svg);
}
