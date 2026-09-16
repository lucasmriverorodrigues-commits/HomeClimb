import {calibration as C} from './generation-config.js';
import {distance,metric} from './movement-model.js';
export function proposeSupports(wall,face,path,assignments){
 const supports=wall.holds.filter(h=>h.faceId===face.id&&(h.quality!=='unknown'||h.footOnly)),feet=new Set(),g=C.generator;
 for(const hand of path){const origin=metric(hand,face),rank=f=>Math.abs(distance(metric(f,face),origin)-g.footDistance)+(C.footQuality[f.quality]??C.footQuality.unknown)*g.footQualityRank+(face.angle<C.body.roofAngle&&f.y<hand.y?g.footAbovePenalty:0);
  const pool=supports.filter(h=>!assignments[h.id]).sort((a,b)=>rank(a)-rank(b));
  for(const f of pool.slice(0,g.footPerHand))feet.add(f.id);
 }
 return {...assignments,...Object.fromEntries([...feet].slice(0,g.footProposal).map(id=>[id,['foot']]))};
}
export function pruneSupports(assignments,prediction){
 const used=new Set(prediction.profiles.flatMap(r=>[r.beta,...r.alternatives]).concat(prediction.intendedBeta).filter(Boolean).flatMap(b=>b.states.flatMap(s=>[s.LF,s.RF]).filter(Boolean)));
 return Object.fromEntries(Object.entries(assignments).filter(([id,roles])=>roles[0]!=='foot'||used.has(id)));
}
