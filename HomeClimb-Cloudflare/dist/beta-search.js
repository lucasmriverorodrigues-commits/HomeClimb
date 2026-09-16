import {calibration as C} from './generation-config.js';
import {contextFor,bodyPosition,moveDifficulty,distance} from './movement-model.js';
const key=s=>[s.LH,s.RH,s.LF,s.RF].join('|');
const role=(route,name)=>Object.keys(route.assignments).find(id=>route.assignments[id].includes(name));
export function searchBetas(route,profile,{intended=null}={}){
 const ctx=contextFor(route,profile),cfg=C.search,poseCache=new Map();
 const start={LH:role(route,'startL'),RH:role(route,'startR')},finish={LH:role(route,'finishL'),RH:role(route,'finishR')};
 if(!start.LH||!start.RH||!finish.LH||!finish.RH)return {betas:[],expanded:0,truncated:false};
 const progress=s=>{const a=ctx.holds.get(s.LH),b=ctx.holds.get(s.RH),fa=ctx.holds.get(finish.LH),fb=ctx.holds.get(finish.RH);return (distance(a,fa)+distance(b,fb))/profile.height;};
 function poses(hands){
  const k=hands.LH+'|'+hands.RH;if(poseCache.has(k))return poseCache.get(k);
  const a=ctx.holds.get(hands.LH),b=ctx.holds.get(hands.RH);if(!a||!b||distance(a,b)>profile.armSpan*C.body.maxHandSpan||(a.id===b.id&&!a.match))return [];
  const mid={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
  const feet=ctx.feet.filter(f=>(f.id!==a.id&&f.id!==b.id)||f.handFootCompatible).sort((f,g)=>{
   const rank=h=>Math.abs(distance(h,mid)/profile.height-C.body.handHipDrop-C.body.footHipRise)+h.features.foot*cfg.footRank;
   return rank(f)-rank(g);
  }).slice(0,cfg.footPool);
  const result=[];
  for(let i=0;i<feet.length;i++)for(let j=i+1;j<feet.length;j++){
   const [lf,rf]=feet[i].x<=feet[j].x?[feet[i],feet[j]]:[feet[j],feet[i]];
   const state={...hands,LF:lf.id,RF:rf.id},pose=bodyPosition(state,ctx);
   if(pose)result.push({...state,...pose,climberProfile:profile.id,rank:pose.cost+(lf.features.foot+rf.features.foot)*C.move.feet/2});
  }
  // One-foot postures are possible, but carry a missing-contact cost.
  for(const f of feet){const state={...hands,LF:f.x<mid.x?f.id:null,RF:f.x>=mid.x?f.id:null},pose=bodyPosition(state,ctx);if(pose)result.push({...state,...pose,climberProfile:profile.id,rank:pose.cost+f.features.foot*C.move.feet+C.move.missingContact});}
  result.sort((a,b)=>a.rank-b.rank);const kept=result.slice(0,cfg.poses);poseCache.set(k,kept);return kept;
 }
 // Reposition one foot at a time while keeping both current hands; never teleport both feet.
 function transition(from,to,limb){
  let best=null;
  for(const order of [['LF','RF'],['RF','LF']]){
   let state=from,moves=[],valid=true;
   for(const foot of order){if(state[foot]===to[foot])continue;
    const next={LH:state.LH,RH:state.RH,LF:state.LF,RF:state.RF,[foot]:to[foot]};
    if(!to[foot]){const pose=bodyPosition(next,ctx);if(!pose){valid=false;break;}moves.push({movingLimb:foot,targetHold:null,difficulty:C.move.footMove,features:{release:true},fromState:state,toState:{...next,...pose}});state={...next,...pose};continue;}
    const move=moveDifficulty(state,next,foot,ctx);if(!move){valid=false;break;}moves.push(move);state=move.toState;
   }
   if(!valid)continue;
   const hand=moveDifficulty(state,to,limb,ctx);if(!hand)continue;moves.push(hand);
   const cost=moves.reduce((sum,m)=>sum+m.difficulty,0);if(!best||cost<best.cost)best={moves,cost};
  }
  // Also allow hand first, then feet: the released hand hold can become the next foothold.
  const handFirst={LH:from.LH,RH:from.RH,LF:from.LF,RF:from.RF,[limb]:to[limb]};
  const hand=moveDifficulty(from,handFirst,limb,ctx);
  if(hand){for(const order of [['LF','RF'],['RF','LF']]){let state=hand.toState,moves=[hand],valid=true;for(const foot of order){if(state[foot]===to[foot])continue;const next={...state,[foot]:to[foot]};if(!to[foot]){const pose=bodyPosition(next,ctx);if(!pose){valid=false;break;}moves.push({movingLimb:foot,targetHold:null,difficulty:C.move.footMove,features:{release:true},fromState:state,toState:{...next,...pose}});state={...next,...pose};}else{const move=moveDifficulty(state,next,foot,ctx);if(!move){valid=false;break;}moves.push(move);state=move.toState;}}if(valid){const cost=moves.reduce((s,m)=>s+m.difficulty,0);if(!best||cost<best.cost)best={moves,cost};}}}
  return best;
 }
 const initialIndex=intended?Math.max(intended.indexOf(start.LH),intended.indexOf(start.RH))+1:0;
 let beam=poses(start).map(state=>({state,states:[state],moves:[],crux:0,total:0,index:initialIndex})),expanded=0;
 const seen=new Map(),completed=[];
 for(let depth=0;depth<cfg.maxSteps&&beam.length;depth++){
  const next=[];
  for(const node of beam){
   if(node.state.LH===finish.LH&&node.state.RH===finish.RH&&(!intended||node.index>=intended.length)){completed.push(node);continue;}
   for(const limb of ['LH','RH'])for(const target of ctx.hands){
    if(node.state[limb]===target.id)continue;
    if(intended&&node.index<intended.length&&target.id!==intended[node.index])continue;
    if(intended&&node.index>=intended.length&&target.id!==finish[limb])continue;
    const hands={LH:node.state.LH,RH:node.state.RH,[limb]:target.id};
    if(progress(hands)>progress(node.state)+cfg.backtrack)continue;
    for(const pose of poses(hands)){
     expanded++;const t=transition(node.state,pose,limb);if(!t)continue;
     const crux=Math.max(node.crux,...t.moves.map(m=>m.difficulty)),total=node.total+t.cost,index=intended?Math.min(intended.length,node.index+1):0;
     const k=key(pose)+'|'+index,score=crux+total*cfg.costWeight;
     if((seen.get(k)??Infinity)<=score)continue;seen.set(k,score);
     next.push({state:pose,states:[...node.states,...t.moves.map(m=>({...m.toState,climberProfile:profile.id}))],moves:[...node.moves,...t.moves],crux,total,index,score:score+progress(pose)*cfg.progressWeight});
    }
   }
  }
  next.sort((a,b)=>a.score-b.score);beam=next.slice(0,cfg.beam);
  if(completed.length>=cfg.completions)break;
 }
 for(const node of beam)if(node.state.LH===finish.LH&&node.state.RH===finish.RH&&(!intended||node.index>=intended.length))completed.push(node);
 completed.sort((a,b)=>(a.crux+a.total*cfg.costWeight)-(b.crux+b.total*cfg.costWeight));
 return {betas:completed.slice(0,cfg.completions),expanded,truncated:true};
}
