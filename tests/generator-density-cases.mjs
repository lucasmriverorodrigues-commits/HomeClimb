import fs from 'node:fs';
const root=new URL('./golden_dataset/',import.meta.url);
export function cases(){
 const samples=fs.readdirSync(root).filter(p=>p.endsWith('.json')).map(p=>{const r=JSON.parse(fs.readFileSync(new URL(p,root)));return {id:r.id,split:r.split,wall:r.wall,options:r.options};});
 // Dense neighbours model a spray wall: tiny hand substitutions must not fill the route.
 for(const [id,split,seed] of [['dense-dev','development',37],['dense-validation','validation',391]]){
  const r=structuredClone(samples.find(s=>s.id==='vertical-dev'));r.id=id;r.split=split;r.options.seed=seed;r.options.count=8;r.options.target=3;
  const original=[...r.wall.holds];for(const h of original)r.wall.holds.push({...h,id:h.id+'near',x:h.x+.025,y:h.y+.015,match:false});
  samples.push(r);
 }
 const compact=structuredClone(samples.find(s=>s.id==='dense-dev'));
 compact.id='compact-dev';compact.wall.faces[0].width=1.8;compact.wall.faces[0].height=2.2;compact.options.count=10;compact.options.reach=.85;
 samples.push(compact);
 return samples;
}
export function metrics(result,wall){
 const hands=wall.holds.filter(h=>result.route.assignments[h.id]?.some(r=>r!=='foot')),face=wall.faces.find(f=>f.id===hands[0].faceId);
 const pairs=[];for(let i=0;i<hands.length;i++)for(let j=i+1;j<hands.length;j++){
  const a=hands[i],b=hands[j],ra=result.route.assignments[a.id],rb=result.route.assignments[b.id];
  const endpoint=['start','finish'].some(prefix=>ra.some(r=>r.startsWith(prefix))&&rb.some(r=>r.startsWith(prefix)));if(endpoint)continue;
  pairs.push(Math.hypot((a.x-b.x)*face.width,(a.y-b.y)*face.height));
 }
 return {feet:Object.values(result.route.assignments).filter(r=>r.length===1&&r[0]==='foot').length,handCount:hands.length,closePairs:pairs.filter(d=>d<.23).length,minHandSeparation:Math.min(...pairs),grade:result.estimated,morphology:result.analysis.morphologySensitivity.high,shortcut:result.analysis.shortcut.detected};
}
