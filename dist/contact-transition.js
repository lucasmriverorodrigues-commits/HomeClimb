import {calibration as C} from './generation-config.js';
import {bodyPosition,moveDifficulty} from './movement-model.js';

function orders(items){
 if(items.length<2)return [items];
 return items.flatMap((item,i)=>orders(items.filter((_,j)=>j!==i)).map(rest=>[item,...rest]));
}

// A single hand move may need one foot before it and the other afterwards.
// Every intermediate contact state is checked; never move two limbs at once.
export function contactTransition(from,to,hand,ctx){
 const actions=['LF','RF',hand].filter(limb=>from[limb]!==to[limb]);
 let best=null;
 for(const order of orders(actions)){
  let state=from,moves=[],valid=true;
  for(const limb of order){
   const next={LH:state.LH,RH:state.RH,LF:state.LF,RF:state.RF,[limb]:to[limb]};
   let move;
   if(!next[limb]){
    const before=state.hip?state:bodyPosition(state,ctx),pose=before&&bodyPosition(next,ctx,before.hip);
    if(pose)move={movingLimb:limb,targetHold:null,difficulty:C.move.footMove,features:{release:true},fromState:state,toState:{...next,...pose}};
   }else move=moveDifficulty(state,next,limb,ctx);
   if(!move){valid=false;break;}
   moves.push(move);state=move.toState;
  }
  if(!valid)continue;
  const cost=moves.reduce((sum,move)=>sum+move.difficulty,0);
  if(!best||cost<best.cost)best={moves,cost};
 }
 return best;
}
