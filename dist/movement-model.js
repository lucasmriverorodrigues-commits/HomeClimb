import {calibration as C,clamp} from './generation-config.js';
import {directionKnown,directionFit} from './hold-direction.js';
export const metric=(hold,face)=>({x:hold.x*face.width,y:(1-hold.y)*face.height});
export const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
export function deriveHold(h){return {hand:C.handQuality[h.quality]??C.handQuality.unknown,foot:(C.footQuality[h.quality]??C.footQuality.unknown)+(C.footType[h.type]??C.footType.Outro),type:C.handType[h.type]??C.handType.Outro,orientationKnown:directionKnown(h),confidence:h.quality==='unknown'?.25:.65};}
export function contextFor(route,profile){
 const used=Object.keys(route.assignments),faceIds=new Set(route.snapshot.holds.filter(h=>used.includes(h.id)).map(h=>h.faceId));
 if(faceIds.size!==1)throw Error('A análise de movimentos usa uma face por vez.');
 const face=route.snapshot.faces.find(f=>faceIds.has(f.id));
 const holds=new Map(route.snapshot.holds.filter(h=>h.faceId===face.id).map(h=>[h.id,{...h,...metric(h,face),features:deriveHold(h)}]));
 const hands=[...holds.values()].filter(h=>!h.footOnly&&route.assignments[h.id]?.some(r=>r!=='foot'));
 const feet=[...holds.values()].filter(h=>route.feet==='free'||route.assignments[h.id]?.includes('foot')||(route.feet==='follow'&&route.assignments[h.id]?.length));
 return {face,holds,hands,feet,profile,movementStyle:route.movementStyle||null,bodyCache:new Map()};
}
const limbs=['LH','RH','LF','RF'];
export function bodyPosition(state,ctx,reference=null){
 const key=limbs.map(l=>state[l]||'').join('|');
 let result=ctx.bodyCache?.get(key);
 if(result===undefined){result=calculateBody(state,ctx)||[];if(ctx.bodyCache&&ctx.bodyCache.size<C.search.bodyCacheLimit)ctx.bodyCache.set(key,result);}
 if(!reference)return result[0]||null;
 let best=null,score=Infinity;
 for(const pose of result){const shift=distance(reference,pose.hip)/ctx.profile.height;if(shift>C.body.hipShift)continue;const value=pose.cost+shift*2;if(value<score){best=pose;score=value;}}
 return best;
}
function calculateBody(state,ctx){
 const {holds,profile:p,face}=ctx,b=C.body;
 const contacts=limbs.map(k=>state[k]?holds.get(state[k]):null);
 const [lh,rh,lf,rf]=contacts;
 if(!lh||!rh||lh.footOnly||rh.footOnly||(!lf&&!rf))return null;
 if(lh.id===rh.id&&!lh.match)return null;
 if(lf&&rf&&lf.id===rf.id)return null;
 for(const foot of [lf,rf].filter(Boolean))if([lh,rh].some(h=>h.id===foot.id)&&!foot.handFootCompatible)return null;
 if(distance(lh,rh)>p.armSpan*b.maxHandSpan)return null;
 const hs={x:(lh.x+rh.x)/2,y:(lh.y+rh.y)/2},fs=lf&&rf?{x:(lf.x+rf.x)/2,y:(lf.y+rf.y)/2}:lf||rf;
 // On a roof the body axis follows the contacts, rather than image vertical.
 let up={x:0,y:1};if(face.angle>=b.roofAngle){const d=distance(hs,fs);if(d<.01)return null;up={x:(hs.x-fs.x)/d,y:(hs.y-fs.y)/d};}
 const side={x:up.y,y:-up.x};
 const center={x:(hs.x-up.x*p.height*b.handHipDrop+fs.x+up.x*p.height*b.footHipRise)/2,y:(hs.y-up.y*p.height*b.handHipDrop+fs.y+up.y*p.height*b.footHipRise)/2};
 const poses=[];
 for(const dx of b.hipOffsets)for(const dy of b.hipVerticalOffsets){
  const hip={x:center.x+(side.x*dx+up.x*dy)*p.height,y:center.y+(side.y*dx+up.y*dy)*p.height};
  const shoulders=[-1,1].map(sign=>({x:hip.x+up.x*p.torsoLength+side.x*sign*p.height*b.shoulderWidth/2,y:hip.y+up.y*p.torsoLength+side.y*sign*p.height*b.shoulderWidth/2}));
  const arm=[distance(lh,shoulders[0]),distance(rh,shoulders[1])].map(d=>d/(p.armSpan*b.armFraction));
  const pulls=[directionFit(lh,shoulders[0]),directionFit(rh,shoulders[1])];
  if(pulls.some(pull=>!pull.allowed))continue;
  const legs=[lf,rf].filter(Boolean).map(f=>distance(f,hip)/p.legLength);
  const rise=Math.max(0,...[lf,rf].filter(Boolean).map(f=>((f.x-hip.x)*up.x+(f.y-hip.y)*up.y)/p.legLength));
  if(Math.max(...arm)>b.armSlack||Math.max(...legs)>b.legSlack||rise>Math.min(b.maxFootRise,p.hipMobilityRange))continue;
  const compression=Math.max(0,b.compressionRatio-Math.min(...legs))/b.compressionRatio;
  const extension=Math.max(0,Math.max(...legs,...arm)-b.extensionRatio);
  const balance=Math.abs((hip.x-fs.x)*side.x+(hip.y-fs.y)*side.y)/p.height;
  const orientationCost=pulls.reduce((sum,pull)=>sum+pull.penalty,0)/2;
  const cost=compression+extension+rise+balance+orientationCost*C.move.orientation;
  poses.push({hip,shoulders,up,orientationCost,estimatedCenterOfMass:{x:hip.x+up.x*p.torsoLength/2,y:hip.y+up.y*p.torsoLength/2},compression,extension,highStep:rise,balance,cost,contacts:contacts.filter(Boolean).length});
 }
 return poses.sort((a,b)=>a.cost-b.cost);
}
export function moveDifficulty(from,to,limb,ctx){
 const before=from.hip&&from.shoulders?from:bodyPosition(from,ctx);if(!before)return null;
 const posture=bodyPosition(to,ctx,before.hip);if(!posture)return null;
 const {profile:p,holds,face}=ctx,w=C.move,source=holds.get(from[limb]),target=holds.get(to[limb]);if(!target)return null;
 const foot=limb==='LF'||limb==='RF';
 const travel=source?distance(source,target):0,limit=C.movementStyles[ctx.movementStyle]?.maxTravel;
 if(!foot&&limit&&travel>p.armSpan*limit+1e-9)return null;
 const hipShift=distance(before.hip,posture.hip)/p.height;
 if(hipShift>C.body.hipShift)return null;
 if(foot&&distance(target,before.hip)>p.legLength*C.search.footTravel)return null;
 const feet=['LF','RF'].map(k=>holds.get(to[k])).filter(Boolean),footCost=feet.reduce((sum,h)=>sum+h.features.foot,0)/feet.length;
 const stationary=holds.get(from[limb==='LH'?'RH':'LH']);
 const normalizedReach=source?distance(source,target)/p.armSpan:distance(target,before.hip)/p.height;
 const angle=Math.max(0,Math.sin((face.angle||0)*Math.PI/180));
 const cross=limb==='LH'?Math.max(0,(target.x-holds.get(to.RH).x)/p.height):limb==='RH'?Math.max(0,(holds.get(to.LH).x-target.x)/p.height):0;
 const dynamic=Math.max(0,distance(target,before.hip)/(p.torsoLength+p.armSpan*C.body.armFraction)-1);
 // Check support geometry while a limb is airborne, not only at its endpoints.
 for(const t of [.33,.66]){
  const hip={x:before.hip.x+(posture.hip.x-before.hip.x)*t,y:before.hip.y+(posture.hip.y-before.hip.y)*t};
  for(const [i,key] of ['LH','RH'].entries())if(key!==limb){
   const h=holds.get(from[key]),a=before.shoulders[i],z=posture.shoulders[i],shoulder={x:a.x+(z.x-a.x)*t,y:a.y+(z.y-a.y)*t};
   if(distance(h,shoulder)>p.armSpan*C.body.armFraction*C.body.armSlack||!directionFit(h,shoulder).allowed)return null;
  }
  for(const key of ['LF','RF'])if(key!==limb&&from[key]&&distance(holds.get(from[key]),hip)>p.legLength*C.body.legSlack)return null;
 }
 const orientation=posture.orientationCost;
 const features={sourceHandQuality:source?.features.hand??0,targetHandQuality:target.features.hand,bestLeftFootQuality:holds.get(to.LF)?.features.foot??null,bestRightFootQuality:holds.get(to.RF)?.features.foot??null,numberOfUsableFeet:feet.length,normalizedReach,wallAngle:face.angle,bodyCompression:posture.compression,bodyExtension:posture.extension,highStepCost:posture.highStep,balanceCost:posture.balance,tensionCost:angle*(1+footCost),crossRequired:cross>0,dynamicRequirement:dynamic,matchRequired:to.LH===to.RH,stableContactsBeforeMove:before.contacts-1,stableContactsAfterMove:posture.contacts,hipShift,orientationKnown:target.features.orientationKnown};
 Object.assign(features,{handTravelMeters:foot?null:travel,orientationCost:orientation,movementStyle:ctx.movementStyle});
 const difficulty=foot?w.footMove*(1+target.features.foot)+posture.highStep*w.highStep+posture.compression*w.compression:
  (stationary.features.hand+stationary.features.type)*w.source+(target.features.hand+target.features.type)*w.target+footCost*w.feet+normalizedReach**2*w.reach+angle*w.angle+angle*footCost*w.tension+posture.compression*w.compression+posture.extension*w.extension+posture.highStep*w.highStep+posture.balance*w.balance+cross*w.cross+dynamic*w.dynamic+(2-feet.length)*w.missingContact+orientation*w.orientation;
 return {movingLimb:limb,targetHold:target.id,features,difficulty:Math.max(0,difficulty),fromState:{...from,...before},toState:{...to,...posture}};
}
