import test from 'node:test';
import assert from 'node:assert/strict';
import {startingSupportPlans,rescueMiddleSupports} from '../dist/starting-supports.js';
import {gradeBoulder} from '../dist/boulder-grader.js';

function fixture(height=1.65,shift=0){
 const positions=[['A',1.2,1.2],['B',1.8,1.2],['C',1.3+shift,height],['D',1.7+shift,height+.05],['E',1.3+shift,height+.45],['F',1.7+shift,height+.45],['P',1.2,.25],['Q',1.8,.3],['R',1.25+shift,.9],['S',1.75+shift,1.1]];
 const holds=positions.map(([id,x,y])=>({id,x:x/4,y:1-y/3,faceId:'f',name:id,quality:'good',type:'Batente',match:false,footOnly:['P','Q','R','S'].includes(id)}));
 const face={id:'f',width:4,height:3,angle:20},route={snapshot:{faces:[face],holds},feet:'follow',assignments:{A:['startL'],B:['startR'],C:['hand'],D:['hand'],E:['finishL'],F:['finishR']}};
 return {route,face};
}
test('two low starting feet are retained and hand holds replace middle feet',()=>{
 const {route,face}=fixture(2.3),before=JSON.stringify(route),plan=startingSupportPlans(route,face)[0];
 assert.deepEqual(plan.baseFeet,['P','Q']);
 const result=rescueMiddleSupports(plan,face);
 assert.equal(result.prediction.feasible,true);assert.deepEqual(result.middleFeet,[]);
 assert.equal(Object.values(result.assignments).filter(r=>r.includes('foot')).length,2);
 assert.ok(result.prediction.profiles.every(p=>p.beta.states.some(s=>['A','B','C','D','E','F'].includes(s.LF)||['A','B','C','D','E','F'].includes(s.RF))));
 assert.equal(JSON.stringify(route),before);
});
test('a middle foothold is added only when base feet alone fail the beta search',()=>{
 const {route,face}=fixture(2.5),plan=startingSupportPlans(route,face)[0];
 const base=gradeBoulder(plan.route);assert.ok(!base.feasible||base.morphologySensitivity.high);
 const result=rescueMiddleSupports(plan,face);
 assert.ok(result.prediction.feasible&&!result.prediction.morphologySensitivity.high);
 assert.deepEqual(result.baseFeet,['P','Q']);assert.deepEqual(result.middleFeet,['S']);
 assert.ok(route.snapshot.holds.find(h=>h.id==='S').y<plan.baseY);
});
test('an impossible hand gap does not produce an unlimited list of extra feet',()=>{
 const {route,face}=fixture(2.5,1.5),plan=startingSupportPlans(route,face)[0];
 assert.equal(rescueMiddleSupports(plan,face),null);
});
test('missing base feet do not turn high, unclassified or foreign holds into starting feet',()=>{
 const {route,face}=fixture();
 route.snapshot.holds.find(h=>h.id==='P').faceId='other';
 Object.assign(route.snapshot.holds.find(h=>h.id==='Q'),{footOnly:false,quality:'unknown'});
 assert.deepEqual(startingSupportPlans(route,face),[]);
});
