import {directionDistance,directionKnown} from './hold-direction.js';

export const rockHand=(points,i)=>i===0||i===points.length-2?'LH':i===1||i===points.length-1?'RH':points[i].hand==='R'?'RH':points[i].hand==='L'?'LH':i%2?'RH':'LH';
export function sourceGroups(points){
 const groups=[];
 for(const [i,p] of points.entries()){
  if(p.sameAs!==undefined&&(!Number.isInteger(p.sameAs)||p.sameAs<0||p.sameAs>=i))throw Error('Referência de pegada repetida inválida.');
  groups.push(p.sameAs===undefined?i:groups[p.sameAs]);
 }
 return groups;
}
export function removeRockPoint(points,index){
 const groups=sourceGroups(points),first=new Map(),kept=[];
 for(let i=0;i<points.length;i++)if(i!==index){const p={...points[i]},group=groups[i];delete p.sameAs;if(first.has(group))p.sameAs=first.get(group);else first.set(group,kept.length);kept.push(p);}
 return kept;
}
const delta=(a,b,face)=>({x:(b.x-a.x)*face.width,y:(a.y-b.y)*face.height});
const length=v=>Math.hypot(v.x,v.y);
const difference=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const referencePullKnown=p=>p.directionKnown!==false&&Number.isFinite(p.direction)&&p.directionTolerance!==180;
function gripCost(p,h){return (p.quality&&p.quality!=='unknown'&&p.quality!==h.quality?.25:0)+(p.type&&p.type!=='Não informado'&&p.type!==h.type?.35:0)+(referencePullKnown(p)?(directionDistance(p.direction,h)??.5)*.8:0);}
// Search a translation of the measured pattern. Never stretch, mirror or rotate
// the photo implicitly: those operations would change movement and pull vectors.
export function matchRockHolds(targets,holds,face){
 const groups=sourceGroups(targets),xs=targets.map(p=>p.x),ys=targets.map(p=>p.y),margin=.015;
 let beam=[];
 for(let i=0;i<targets.length;i++){
  const p=targets[i],hand=rockHand(targets,i),next=[];
  if(i===0){
   for(const h of holds){
    const offset={x:h.x-p.x,y:h.y-p.y};
    const outside=Math.max(0,margin-Math.min(...xs)-offset.x,Math.max(...xs)+offset.x-(1-margin),margin-Math.min(...ys)-offset.y,Math.max(...ys)+offset.y-(1-margin));
    next.push({chosen:[h],offset,cost:gripCost(p,h)+outside*8,last:{LH:0}});
   }
  }else for(const partial of beam){
   const repeated=groups[i]!==i,pool=repeated?[partial.chosen[groups[i]]]:holds;
   for(const h of pool){
    if(!repeated&&partial.chosen.some(v=>v.id===h.id))continue;
    const other=partial.last[hand==='LH'?'RH':'LH'];
    if(other!==undefined&&partial.chosen[other].id===h.id&&!h.match)continue;
    const desired={x:p.x+partial.offset.x,y:p.y+partial.offset.y};
    const position=length(delta(desired,h,face)),from=partial.last[hand];
    const movement=from===undefined?0:difference(delta(targets[from],p,face),delta(partial.chosen[from],h,face));
    next.push({chosen:[...partial.chosen,h],offset:partial.offset,cost:partial.cost+position+movement*2+gripCost(p,h),last:{...partial.last,[hand]:i}});
   }
  }
  // Keep first anchors diverse; later steps compare their actual displacement.
  beam=next.sort((a,b)=>a.cost-b.cost).slice(0,i===0?80:32);
  if(!beam.length)throw Error('Não encontrei agarras compatíveis. Para repetir uma pegada com as duas mãos, cadastre uma agarra onde caiba juntar mãos.');
 }
 return beam;
}
export function rockMoves(points,chosen){
 const last={LH:chosen[0].id,RH:chosen[1].id},moves=[];
 for(let i=2;i<points.length;i++){
  const limb=rockHand(points,i),targetHold=chosen[i].id;
  if(last[limb]!==targetHold)moves.push({limb,targetHold});
  last[limb]=targetHold;
 }
 return moves;
}
export function compareRockMovements(targets,chosen,face){
 const last={LH:0,RH:1},moves=[];
 for(let i=2;i<targets.length;i++){
  const limb=rockHand(targets,i),from=last[limb],reference=delta(targets[from],targets[i],face),actual=delta(chosen[from],chosen[i],face),expectedMeters=length(reference),actualMeters=length(actual);
  const cosine=expectedMeters>1e-6&&actualMeters>1e-6?Math.max(-1,Math.min(1,(reference.x*actual.x+reference.y*actual.y)/(expectedMeters*actualMeters))):null;
  const vectorErrorMeters=difference(reference,actual),angleErrorDegrees=cosine===null?null:Math.acos(cosine)*180/Math.PI;
  moves.push({hand:limb==='LH'?'E':'D',fromPoint:from+1,toPoint:i+1,fromHold:chosen[from].id,toHold:chosen[i].id,expectedMeters,actualMeters,vectorErrorMeters,angleErrorDegrees,close:vectorErrorMeters<=Math.max(.12,expectedMeters*.25)});
  last[limb]=i;
 }
 const grips=targets.map((p,i)=>({point:i+1,holdId:chosen[i].id,sourceQuality:p.quality||'unknown',targetQuality:chosen[i].quality||'unknown',sourceType:p.type||'Não informado',targetType:chosen[i].type||'Não informado',typeMatch:!p.type||p.type==='Não informado'?null:p.type===chosen[i].type,sourceDirection:referencePullKnown(p)?p.direction:null,sourceFree:p.directionKnown!==false&&Number.isFinite(p.direction)&&p.directionTolerance===180,sourceTolerance:p.directionTolerance??100,targetTolerance:chosen[i].directionTolerance??100,targetDirection:directionKnown(chosen[i])?chosen[i].direction:null,pullMismatch:referencePullKnown(p)?directionDistance(p.direction,chosen[i]):null}));
 return {moves,grips,meanVectorErrorMeters:moves.reduce((s,m)=>s+m.vectorErrorMeters,0)/(moves.length||1),maxVectorErrorMeters:Math.max(0,...moves.map(m=>m.vectorErrorMeters)),closeMoves:moves.filter(m=>m.close).length};
}
