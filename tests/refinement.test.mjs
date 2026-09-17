import test from 'node:test';
import assert from 'node:assert/strict';
import {handSpacing,simplifySupports,extraFeet} from '../dist/route-refinement.js';
import {gradeBoulder,predictionSummary} from '../dist/boulder-grader.js';

function route(){
 const entries=[['A',1.2,1.2],['B',1.8,1.2],['C',1.3,1.65],['D',1.7,1.7],['E',1.3,2.05],['F',1.7,2.05],['P',1.2,.25],['Q',1.8,.3],['R',1.25,.8],['S',1.75,.8],['T',1.26,.81],['U',1.76,.81]];
 const holds=entries.map(([id,x,y])=>({id,x:x/3,y:1-y/3,faceId:'f',name:id,quality:'good',type:'Batente',match:false,radius:.02,direction:0,color:''}));
 return {snapshot:{faces:[{id:'f',width:3,height:3,angle:0}],holds},feet:'follow',assignments:{A:['startL'],B:['startR'],C:['hand'],D:['hand'],E:['finishL'],F:['finishR'],P:['foot'],Q:['foot'],R:['foot'],S:['foot'],T:['foot'],U:['foot']}};
}
test('composition distinguishes crowded intermediate holds from close start and finish pairs',()=>{
 const face={width:3,height:3};
 const path=[{id:'A',x:.2,y:.8,match:false},{id:'B',x:.22,y:.8},{id:'C',x:.3,y:.5},{id:'D',x:.31,y:.5},{id:'E',x:.4,y:.1},{id:'F',x:.42,y:.1,match:false}];
 assert.equal(handSpacing(path,face,.85).closePairs,1);
 path[3].x=.5;assert.equal(handSpacing(path,face,.85).closePairs,0);
});
test('sparse supports are regraded for every morphology without losing a two-foot start or mutating a saved route',()=>{
 const r=route(),original=JSON.stringify(r),intended=['A','B','C','D','E','F'],initial=gradeBoulder(r,{intended});assert.ok(initial.feasible);
 const result=simplifySupports(r,initial,{target:initial.score,intended});
 assert.ok(extraFeet(result.assignments).length<extraFeet(r.assignments).length);
 assert.ok(result.prediction.feasible);assert.equal(result.prediction.morphologySensitivity.high,false);
 for(const p of result.prediction.profiles){const start=p.beta.states[0];assert.ok(start.LF&&start.RF);for(const s of p.beta.states)for(const limb of ['LH','RH','LF','RF'])if(s[limb])assert.ok(result.assignments[s[limb]]);}
 assert.deepEqual(predictionSummary(gradeBoulder({...r,assignments:result.assignments},{intended})),predictionSummary(result.prediction));
 assert.equal(JSON.stringify(r),original);
});
