import {calibration as C} from './generation-config.js';
import {contextFor,bodyPosition,metric,distance} from './movement-model.js';
import {gradeBoulder} from './boulder-grader.js';

const valid=p=>p.feasible&&!p.morphologySensitivity.high;
const role=(route,name)=>Object.keys(route.assignments).find(id=>route.assignments[id].includes(name));
const available=(route,face)=>route.snapshot.holds.filter(h=>h.faceId===face.id&&!route.assignments[h.id]&&(h.footOnly||(h.quality!=='unknown'&&h.quality in C.handQuality)));
const withFeet=(route,ids)=>({...route,assignments:{...route.assignments,...Object.fromEntries(ids.map(id=>[id,['foot']]))}});

// Two supports in the lowest quarter of the mapped face. This is the user's
// composition preference, not a biomechanical rule or a grade conversion.
export function startingSupportPlans(route,face){
 const cfg=C.startingSupports,all=route.snapshot.holds.filter(h=>h.faceId===face.id),ys=all.map(h=>h.y);
 const lowest=Math.max(...ys),top=Math.min(...ys),baseY=lowest-(lowest-top)*cfg.baseBand;
 const hands={LH:role(route,'startL'),RH:role(route,'startR')};
 const starts=all.filter(h=>h.id===hands.LH||h.id===hands.RH);
 const center={x:starts.reduce((s,h)=>s+h.x,0)/starts.length,y:Math.max(...starts.map(h=>h.y))};
 const rank=h=>Math.abs(h.x-center.x)*face.width+(lowest-h.y)*face.height+(C.footQuality[h.quality]??1.8)*.12;
 const pool=available(route,face).filter(h=>h.y>=baseY-1e-9&&(face.angle>=C.body.roofAngle||h.y>=center.y-C.body.handFootClearance/face.height)).sort((a,b)=>rank(a)-rank(b)).slice(0,cfg.basePool);
 const contexts=C.profiles.map(p=>contextFor(route,p)),plans=[];
 for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
  const [a,b]=pool[i].x<=pool[j].x?[pool[i],pool[j]]:[pool[j],pool[i]];
  if(distance(metric(a,face),metric(b,face))<cfg.minFootSeparation)continue;
  if(!contexts.every(ctx=>bodyPosition({...hands,LF:a.id,RF:b.id},ctx)))continue;
  plans.push({baseFeet:[a.id,b.id],baseY,rank:rank(a)+rank(b),route:withFeet(route,[a.id,b.id])});
 }
 return plans.sort((a,b)=>a.rank-b.rank).slice(0,cfg.basePairs);
}

// Middle supports are a last resort, considered only after all shortlisted
// hand paths have failed with the two base supports. Never add them for grade.
export function rescueMiddleSupports(plan,face,sharedCache=null){
 const cfg=C.startingSupports,route=plan.route,analysisCache=sharedCache||{snapshot:route.snapshot,bodies:new Map()};
 const evaluate=r=>gradeBoulder(r,{analysisCache});
 const basePrediction=evaluate(route);
 if(valid(basePrediction))return {assignments:route.assignments,prediction:basePrediction,baseFeet:plan.baseFeet,middleFeet:[],baseY:plan.baseY};
 const hands=route.snapshot.holds.filter(h=>route.assignments[h.id]?.some(r=>r!=='foot'));
 const finish=hands.filter(h=>route.assignments[h.id].some(r=>r.startsWith('finish')));
 const topY=Math.min(...route.snapshot.holds.filter(h=>h.faceId===face.id).map(h=>h.y));
 const upper=face.angle>=C.body.roofAngle?topY+(plan.baseY-topY)*.2:Math.max(...finish.map(h=>h.y))+cfg.finishClearance/face.height;
 const rank=h=>Math.min(...hands.map(hand=>Math.abs(distance(metric(h,face),metric(hand,face))-.8)))+(C.footQuality[h.quality]??1.8)*.12;
 const pool=available(route,face).filter(h=>h.y<plan.baseY&&h.y>upper).sort((a,b)=>rank(a)-rank(b)).slice(0,cfg.middlePool);
 const result=(ids,prediction)=>({assignments:withFeet(route,ids).assignments,prediction,baseFeet:plan.baseFeet,middleFeet:ids,baseY:plan.baseY});
 for(const h of pool){const p=evaluate(withFeet(route,[h.id]));if(valid(p))return result([h.id],p);}
 for(let i=0;i<pool.length;i++)for(let j=i+1;j<pool.length;j++){
  const ids=[pool[i].id,pool[j].id],p=evaluate(withFeet(route,ids));
  // Each singleton has already failed: both additions are necessary within
  // this bounded beta search. If none succeeds, return no route, not more P's.
  if(valid(p))return result(ids,p);
 }
 return null;
}
