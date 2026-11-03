import {calibration as C} from './generation-config.js';
import {contextFor,bodyPosition,distance} from './movement-model.js';
import {contactTransition} from './contact-transition.js';
const key=s=>[s.LH,s.RH,s.LF,s.RF].join('|');
const role=(route,name)=>Object.keys(route.assignments).find(id=>route.assignments[id].includes(name));
export function searchBetas(route,profile,{intended=null,prescribedMoves=null,bodyCache=null}={}){
 const ctx=contextFor(route,profile),cfg=C.search,poseCache=new Map();
 if(bodyCache)ctx.bodyCache=bodyCache;
 const start={LH:role(route,'startL'),RH:role(route,'startR')},finish={LH:role(route,'finishL'),RH:role(route,'finishR')};
 if(!start.LH||!start.RH||!finish.LH||!finish.RH)return {betas:[],expanded:0,truncated:false};
 const progress=s=>{const a=ctx.holds.get(s.LH),b=ctx.holds.get(s.RH),fa=ctx.holds.get(finish.LH),fb=ctx.holds.get(finish.RH);return (distance(a,fa)+distance(b,fb))/profile.height;};
 function poses(hands,starting=false){
  const k=hands.LH+'|'+hands.RH+'|'+starting;if(poseCache.has(k))return poseCache.get(k);
  const a=ctx.holds.get(hands.LH),b=ctx.holds.get(hands.RH);if(!a||!b||distance(a,b)>profile.armSpan*C.body.maxHandSpan||(a.id===b.id&&!a.match))return [];
  const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const feet=ctx.feet.filter(f=>(f.id!==a.id&&f.id!==b.id)||f.handFootCompatible).sort((f,g)=>{
   const rank=h=>{
    const drop=profile.height*(C.body.handHipDrop+C.body.footHipRise);
    // On upright/sloping faces a support below the hands is not equivalent
    // to a hold the same radial distance above them. High steps remain legal.
    const geometry=ctx.face.angle>=C.body.roofAngle?Math.abs(distance(h,mid)-drop):distance(h,{x:mid.x,y:mid.y-drop});
    return geometry/profile.height+h.features.foot*cfg.footRank;
   };
   return rank(f)-rank(g);
  }).slice(0,cfg.footPool);
  const result=[];
  // Default starts on non-roof faces retain at least one support below the
  // starting hands. This is a start-composition rule, not a ban on high steps
  // during climbing. Roofs use their contact-based body axis instead.
  const supportedStart=(...feet)=>!starting||ctx.face.angle>=C.body.roofAngle||feet.some(f=>f&&f.y<=Math.min(a.y,b.y)+C.body.handFootClearance);
  for(let i=0;i<feet.length;i++)for(let j=i+1;j<feet.length;j++){
   const [lf,rf]=feet[i].x<=feet[j].x?[feet[i],feet[j]]:[feet[j],feet[i]];
   if(!supportedStart(lf,rf))continue;
   const state={...hands,LF:lf.id,RF:rf.id},pose=bodyPosition(state,ctx);
   if(pose)result.push({...state,...pose,climberProfile:profile.id,rank:pose.cost+(lf.features.foot+rf.features.foot)*C.move.feet/2});
  }
  // One-foot postures are possible, but carry a missing-contact cost.
  if(!starting||!result.length)for(const f of feet){if(!supportedStart(f))continue;const state={...hands,LF:f.x<mid.x?f.id:null,RF:f.x>=mid.x?f.id:null},pose=bodyPosition(state,ctx);if(pose)result.push({...state,...pose,climberProfile:profile.id,rank:pose.cost+f.features.foot*C.move.feet+C.move.missingContact});}
  result.sort((a,b)=>a.rank-b.rank);const kept=result.slice(0,cfg.poses);poseCache.set(k,kept);return kept;
 }
 const initialIndex=prescribedMoves?0:intended?Math.max(intended.indexOf(start.LH),intended.indexOf(start.RH))+1:0;
 let beam=poses(start,true).map(state=>({state,states:[state],moves:[],crux:0,total:0,index:initialIndex})),expanded=0;
 const seen=new Map(),completed=[];
 for(let depth=0;depth<Math.max(cfg.maxSteps,prescribedMoves?.length||0)&&beam.length;depth++){
  const next=[];
  for(const node of beam){
   if(node.state.LH===finish.LH&&node.state.RH===finish.RH&&(!intended||node.index>=intended.length)&&(!prescribedMoves||node.index>=prescribedMoves.length)){completed.push(node);continue;}
   const prescribed=prescribedMoves?.[node.index];
   if(prescribedMoves&&!prescribed)continue;
   for(const limb of prescribed?[prescribed.limb]:['LH','RH'])for(const target of prescribed?ctx.hands.filter(h=>h.id===prescribed.targetHold):ctx.hands){
    if(node.state[limb]===target.id)continue;
    if(intended&&node.index<intended.length&&target.id!==intended[node.index])continue;
    if(intended&&node.index>=intended.length&&target.id!==finish[limb])continue;
    const hands={LH:node.state.LH,RH:node.state.RH,[limb]:target.id};
    if(!prescribedMoves&&progress(hands)>progress(node.state)+cfg.backtrack)continue;
    // Retain current feet when the next hand can move without changing them.
    const choices=[...poses(hands)],sameFeet={...hands,LF:node.state.LF,RF:node.state.RF},stable=bodyPosition(sameFeet,ctx);
    if(stable&&!choices.some(p=>p.LF===sameFeet.LF&&p.RF===sameFeet.RF))choices.push({...sameFeet,...stable,climberProfile:profile.id});
    for(const pose of choices){
     expanded++;const t=contactTransition(node.state,pose,limb,ctx);if(!t)continue;
     const crux=Math.max(node.crux,...t.moves.map(m=>m.difficulty)),total=node.total+t.cost,index=prescribedMoves?node.index+1:intended?Math.min(intended.length,node.index+1):0;
     const k=key(pose)+'|'+index,score=crux+total*cfg.costWeight;
     if((seen.get(k)??Infinity)<=score)continue;seen.set(k,score);
     const reached={...t.moves.at(-1).toState,climberProfile:profile.id};
     next.push({state:reached,states:[...node.states,...t.moves.map(m=>({...m.toState,climberProfile:profile.id}))],moves:[...node.moves,...t.moves],crux,total,index,score:score+progress(reached)*cfg.progressWeight});
    }
   }
  }
  next.sort((a,b)=>a.score-b.score);beam=next.slice(0,cfg.beam);
  if(completed.length>=cfg.completions)break;
 }
 for(const node of beam)if(node.state.LH===finish.LH&&node.state.RH===finish.RH&&(!intended||node.index>=intended.length)&&(!prescribedMoves||node.index>=prescribedMoves.length))completed.push(node);
 completed.sort((a,b)=>(a.crux+a.total*cfg.costWeight)-(b.crux+b.total*cfg.costWeight));
 return {betas:completed.slice(0,cfg.completions),expanded,truncated:true};
}
