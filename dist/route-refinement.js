import {calibration as C} from './generation-config.js';
import {distance,metric} from './movement-model.js';
import {gradeBoulder} from './boulder-grader.js';

// These are composition preferences, not grade boundaries or human reach limits.
export function handSpacing(path,face,reach){
 const g=C.composition,span=Math.min(...C.profiles.map(p=>p.armSpan));
 const minimum=Math.min(span*g.minSeparation,reach*g.minReachFraction);
 const preferred=Math.min(span*g.preferredSeparation,reach*g.preferredReachFraction);
 let penalty=0,closePairs=0,minDistance=Infinity;
 for(let i=0;i<path.length;i++)for(let j=i+1;j<path.length;j++){
  // Separate start/finish holds can form an intentionally close two-hand stance.
  if(i===0&&j===1&&!path[0].match||i===path.length-2&&j===path.length-1&&!path.at(-1).match)continue;
  const d=distance(metric(path[i],face),metric(path[j],face));minDistance=Math.min(minDistance,d);
  if(d<minimum)closePairs++;
  penalty+=Math.max(0,1-d/preferred)**2;
 }
 return {minimum,preferred,minDistance,closePairs,penalty};
}
export const extraFeet=assignments=>Object.keys(assignments).filter(id=>assignments[id].length===1&&assignments[id][0]==='foot');
const valid=p=>p.feasible&&!p.morphologySensitivity.high;

// Keep a coherent beta for each morphology, rather than the union of every
// alternative. Removing a support always triggers an independent body search.
export function simplifySupports(route,prediction,{target,intended}={}){
 const g=C.composition,initial=extraFeet(route.assignments).length;
 let assignments=route.assignments,current=prediction,evaluations=0;
 const gradeCeiling=Math.max(Number.isFinite(target)?target:prediction.score,prediction.score)+g.removalGradeSlack;
 const contacts=state=>['LF','RF'].filter(limb=>state?.[limb]).length;
 // Don't manufacture difficulty by stripping a balanced two-foot start down to one foot.
 const preservesStart=p=>p.profiles.every(profile=>contacts(profile.beta?.states[0])>=contacts(prediction.profiles.find(old=>old.profile===profile.profile)?.beta?.states[0]));
 // Prefer a coherent simpler route even if its honest grade is below the target.
 // Do not keep redundant feet just to steer the estimator towards a requested grade.
 const acceptable=p=>valid(p)&&preservesStart(p)&&p.score<=gradeCeiling;
 const analysisCache={snapshot:route.snapshot,bodies:new Map()};
 const evaluate=a=>{evaluations++;return gradeBoulder({...route,assignments:a},{analysisCache});};
 const withoutExcept=ids=>Object.fromEntries(Object.entries(assignments).filter(([id,r])=>!extraFeet(assignments).includes(id)||ids.has(id)));
 // Start with the holds already selected for hands. Additions are exceptions,
 // not a required number of blue P markers.
 const handsOnly=withoutExcept(new Set());
 let p=evaluate(handsOnly);
 if(acceptable(p)){assignments=handsOnly;current=p;}
 else {
  const startFeet=new Set(prediction.profiles.flatMap(profile=>[profile.beta?.states[0]?.LF,profile.beta?.states[0]?.RF]));
  const startOnly=withoutExcept(startFeet);
  if(extraFeet(startOnly).length<initial){p=evaluate(startOnly);if(acceptable(p)){assignments=startOnly;current=p;}}
 }
 const usedByPrimary=new Set(current.profiles.flatMap(profile=>profile.beta?.states.flatMap(s=>[s.LF,s.RF])||[]));
 const primary=withoutExcept(usedByPrimary);
 if(extraFeet(primary).length<extraFeet(assignments).length){p=evaluate(primary);if(acceptable(p)){assignments=primary;current=p;}}
 const tried=new Set();
 while(evaluations<g.removalTrials&&extraFeet(assignments).length){
  const uses=new Map(extraFeet(assignments).map(id=>[id,0]));
  for(const profile of current.profiles)for(const s of profile.beta?.states||[])for(const limb of ['LF','RF'])if(uses.has(s[limb]))uses.set(s[limb],uses.get(s[limb])+1);
  const startFeet=new Set(current.profiles.flatMap(profile=>[profile.beta?.states[0]?.LF,profile.beta?.states[0]?.RF]));
  const candidates=extraFeet(assignments).filter(id=>!tried.has(id)).sort((a,b)=>Number(startFeet.has(a))-Number(startFeet.has(b))||uses.get(a)-uses.get(b)||a.localeCompare(b));
  if(!candidates.length)break;
  const id=candidates[0];tried.add(id);
  const reduced=Object.fromEntries(Object.entries(assignments).filter(([key])=>key!==id));
  const p=evaluate(reduced);
  if(acceptable(p)){assignments=reduced;current=p;tried.clear();}
 }
 // Grade/shortcut diagnostics belong to exactly the assignments we return.
 const verified=gradeBoulder({...route,assignments},{intended,analysisCache});
 if(!valid(verified))return {assignments:route.assignments,prediction,initial,remaining:initial,evaluations};
 return {assignments,prediction:verified,initial,remaining:extraFeet(assignments).length,evaluations,complete:extraFeet(assignments).every(id=>tried.has(id))};
}
