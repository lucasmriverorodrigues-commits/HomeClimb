import test from 'node:test';
import assert from 'node:assert/strict';
import {pullVector,directionFit,directionKnown,directionDistance} from '../dist/hold-direction.js';
import {contextFor,bodyPosition,moveDifficulty} from '../dist/movement-model.js';
import {calibration as C} from '../dist/generation-config.js';
import {nextDirection} from '../dist/classification.js';
import {validateState,freshState} from '../dist/core.js';
import {searchBetas} from '../dist/beta-search.js';

function fixture(y=1.8,feet=.25){
 const holds=[['A',1.2,y],['B',1.8,y],['P',1.2,feet],['Q',1.8,feet],['T',1.3,2.5]].map(([id,x,y])=>({id,name:id,x:x/3,y:1-y/3,radius:.02,faceId:'f',quality:'good',color:'',type:'Batente',direction:180,directionKnown:true,directionTolerance:60,match:false}));
 return {snapshot:{id:'w',name:'Teste',revision:1,faces:[{id:'f',name:'Face',width:3,height:3,angle:0,aspect:1,photo:'data:image/jpeg;base64,YQ=='}],holds},feet:'follow',assignments:{A:['startL'],B:['startR'],P:['foot'],Q:['foot'],T:['hand']}};
}
const state={LH:'A',RH:'B',LF:'P',RF:'Q'},profile=C.profiles[1];
test('photo pull angles use the same convention as metric body coordinates',()=>{
 const v=pullVector(90);assert.ok(Math.abs(v.x-1)<1e-9&&Math.abs(v.y)<1e-9);
 assert.equal(directionKnown({direction:0}),false);assert.equal(directionKnown({direction:180}),false);
 assert.equal(directionKnown({direction:0,directionKnown:true}),true);
});
test('sidepull direction is evaluated against the shoulder, not assigned a fixed difficulty',()=>{
 const hold={x:1,y:1,direction:90,directionKnown:true,directionTolerance:60};
 assert.ok(directionFit(hold,{x:1.5,y:1}).allowed);
 assert.equal(directionFit(hold,{x:.5,y:1}).allowed,false);
 assert.equal(directionFit({...hold,direction:270},{x:1.5,y:1}).allowed,false);
 assert.ok(directionFit({...hold,directionTolerance:180},{x:.5,y:1}).allowed);
});
test('an overhead undercling is rejected where a downward pull is supported',()=>{
 const r=fixture();assert.ok(bodyPosition(state,contextFor(r,profile)));
 r.snapshot.holds.slice(0,2).forEach(h=>h.direction=0);
 assert.equal(bodyPosition(state,contextFor(r,profile)),null);
});
test('an undercling becomes available when the feet raise the body above the hold',()=>{
 const r=fixture(.9,.8);r.snapshot.holds.slice(0,2).forEach(h=>h.direction=0);
 assert.ok(bodyPosition(state,contextFor(r,profile)));
 r.snapshot.holds.slice(0,2).forEach(h=>h.direction=180);
 assert.equal(bodyPosition(state,contextFor(r,profile)),null);
});
test('compact amplitude limits the moving hand itself, even when the final posture fits',()=>{
 const r=fixture(1.2,.25);r.snapshot.holds.forEach(h=>h.directionKnown=false);
 r.movementStyle='compact';assert.ok(bodyPosition({...state,LH:'T'},contextFor(r,profile)));
 assert.equal(moveDifficulty(state,{...state,LH:'T'},'LH',contextFor(r,profile)),null);
 r.movementStyle='wide';const move=moveDifficulty(state,{...state,LH:'T'},'LH',contextFor(r,profile));
 assert.ok(move);assert.ok(move.features.handTravelMeters>profile.armSpan*C.movementStyles.compact.maxTravel);
});
test('unknown directions are not interpreted as inverted grips in rock matching',()=>{
 assert.equal(directionDistance(0,{direction:0}),null);
 assert.equal(directionDistance(0,{direction:0,directionKnown:true}),0);
 assert.ok(directionDistance(0,{direction:180,directionKnown:true})>.5);
});
test('next direction wraps in the same face and skips foot-only and confirmed holds',()=>{
 const holds=[{id:'a',faceId:'f',x:.2,y:.2},{id:'b',faceId:'f',x:.2,y:.3,footOnly:true},{id:'c',faceId:'f',x:.2,y:.4,direction:0,directionKnown:true},{id:'d',faceId:'other',x:.2,y:.5}];
 assert.equal(nextDirection(holds,holds[2]).id,'a');
 assert.equal(nextDirection(holds,holds[0]),undefined);
});
test('direction fields round-trip and invalid backup values are rejected',()=>{
 const r=fixture(),s=freshState();s.wall=r.snapshot;assert.deepEqual(validateState(structuredClone(s)),s);
 s.wall.holds[0].directionKnown='true';assert.throws(()=>validateState(s),/Direção/);
 s.wall.holds[0].directionKnown=true;s.wall.holds[0].directionTolerance=200;assert.throws(()=>validateState(s),/Amplitude/);
});
test('consecutive moves keep the reached posture instead of teleporting back to a static optimum',()=>{
 const r=fixture(1.2,.25);r.snapshot.holds.forEach(h=>h.directionKnown=false);
 r.snapshot.holds.find(h=>h.id==='T').match=true;r.assignments.T=['hand','finishL','finishR'];
 const result=searchBetas(r,profile);assert.ok(result.betas.length);
 for(const beta of result.betas)for(let i=1;i<beta.moves.length;i++){
  assert.deepEqual(beta.moves[i].fromState.hip,beta.moves[i-1].toState.hip);
  assert.deepEqual(beta.moves[i].fromState.shoulders,beta.moves[i-1].toState.shoulders);
 }
});
