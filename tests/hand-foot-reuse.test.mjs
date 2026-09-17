import test from 'node:test';
import assert from 'node:assert/strict';
import {gradeBoulder} from '../dist/boulder-grader.js';
import {simplifySupports,extraFeet} from '../dist/route-refinement.js';
import {contactTransition} from '../dist/contact-transition.js';
import {contextFor} from '../dist/movement-model.js';
import {calibration as C} from '../dist/generation-config.js';

function makeRoute(){
 const positions=[['A',1.2,1.2],['B',1.8,1.2],['C',1.3,1.65],['D',1.7,1.7],['E',1.3,2.05],['F',1.7,2.05],['P',1.2,.25],['Q',1.8,.3],['R',1.25,.8],['S',1.75,.8]];
 const holds=positions.map(([id,x,y])=>({id,x:x/3,y:1-y/3,faceId:'f',name:id,quality:'good',type:'Batente',match:false,radius:.02,direction:0,color:''}));
 return {snapshot:{faces:[{id:'f',width:3,height:3,angle:0}],holds},feet:'follow',assignments:{A:['startL'],B:['startR'],C:['hand'],D:['hand'],E:['finishL'],F:['finishR'],P:['foot'],Q:['foot'],R:['foot'],S:['foot']}};
}

test('removal continues below the old three-foot quota and uses hand holds as feet',()=>{
 const route=makeRoute(),original=JSON.stringify(route),initial=gradeBoulder(route);
 assert.ok(initial.feasible);
 const result=simplifySupports(route,initial,{target:3,intended:['A','B','C','D','E','F']});
 assert.ok(result.prediction.feasible);
 assert.ok(extraFeet(result.assignments).length<3,JSON.stringify(result.assignments));
 // Feet-follow permits all selected hand holds, including hands skipped by a
 // particular morphology. The release-then-step sequence is tested separately.
 const hands=new Set(['A','B','C','D','E','F']);
 assert.ok(result.prediction.profiles.every(profile=>profile.beta.states.some(s=>hands.has(s.LF)||hands.has(s.RF))));
 assert.equal(JSON.stringify(route),original);
});

test('an extra P is removed even when no other P is left and hands alone are feasible',()=>{
 const route=makeRoute();route.assignments.P=['hand'];route.assignments.Q=['hand'];delete route.assignments.R;
 const initial=gradeBoulder(route),result=simplifySupports(route,initial,{target:3});
 assert.ok(initial.feasible);assert.ok(result.prediction.feasible);
 assert.equal(extraFeet(result.assignments).length,0);
 assert.ok(!result.assignments.S);
});

test('hands-only must not be accepted by putting both starting feet above the starting hands',()=>{
 const route=makeRoute();for(const id of ['P','Q','R','S'])delete route.assignments[id];
 assert.equal(gradeBoulder(route).feasible,false);
 route.assignments.P=['foot'];route.assignments.Q=['foot'];
 const result=gradeBoulder(route);assert.ok(result.feasible);
 for(const p of result.profiles){
  const s=p.beta.states[0],holds=new Map(route.snapshot.holds.map(h=>[h.id,h]));
  assert.ok([s.LF,s.RF].some(id=>id&&holds.get(id).y>Math.max(holds.get(s.LH).y,holds.get(s.RH).y)));
 }
});

test('a foot can vacate the next hand hold before the other foot uses the released hand',()=>{
 // LF occupies C, RH occupies B. The only legal ordering is LF -> RH -> RF:
 // C must be vacated before RH goes there, and B is available only after RH leaves.
 const route=makeRoute(),ctx=contextFor(route,C.profiles[1]);
 const from={LH:'A',RH:'B',LF:'C',RF:'Q'},to={LH:'A',RH:'C',LF:'P',RF:'B'};
 const transition=contactTransition(from,to,'RH',ctx);
 assert.ok(transition,'The mixed foot/hand/foot sequence must be reachable');
 assert.deepEqual(transition.moves.map(m=>m.movingLimb),['LF','RH','RF']);
 for(const move of transition.moves){
  assert.equal(['LH','RH','LF','RF'].filter(l=>move.fromState[l]!==move.toState[l]).length,1);
 }
});
