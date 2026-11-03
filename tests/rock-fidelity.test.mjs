import test from 'node:test';
import assert from 'node:assert/strict';
import {matchRockHolds,rockMoves,compareRockMovements,sourceGroups,removeRockPoint} from '../dist/rock-matching.js';
import {rockTargets} from '../dist/rock-scale.js';
import {searchBetas} from '../dist/beta-search.js';
import {calibration as C} from '../dist/generation-config.js';
const face={width:3,height:3,angle:0};
const points=()=>[[.25,.8],[.45,.8],[.3,.55],[.55,.45],[.35,.2],[.55,.2]].map(([x,y],i)=>({x,y,type:'Batente',quality:'good',hand:i%2?'R':'L'}));
const holds=p=>p.map((v,i)=>({...v,id:'h'+i,name:'A'+i,match:false}));
test('translated pattern keeps measured vectors without forcing it into the center',()=>{
 const p=points(),h=holds(p).map(v=>({...v,x:v.x+.2,y:v.y-.05}));
 const result=matchRockHolds(p,h,face)[0],comparison=compareRockMovements(p,result.chosen,face);
 assert.deepEqual(result.chosen.map(h=>h.id),h.map(h=>h.id));assert.ok(comparison.maxVectorErrorMeters<1e-10);
});
test('movement distance follows the same hand, including two successive left-hand moves',()=>{
 const p=points();p[3].hand='L';const h=holds(p),r=compareRockMovements(p,h,face);
 assert.equal(r.moves[0].fromPoint,1);assert.equal(r.moves[0].toPoint,3);
 assert.equal(r.moves[1].fromPoint,3);assert.equal(r.moves[1].hand,'E');
 assert.equal(r.moves.at(-1).fromPoint,2);assert.ok(r.moves.every(m=>m.vectorErrorMeters===0));
 assert.deepEqual(rockMoves(p,h).map(m=>m.limb),['LH','LH','LH','RH']);
});
test('pull direction distinguishes otherwise identical mappings',()=>{
 const p=points().map(p=>({...p,direction:90})),h=holds(p).map(p=>({...p,direction:90,directionKnown:true,directionTolerance:60}));
 const wrong=h.map(p=>({...p,id:p.id+'wrong',direction:270}));
 const result=matchRockHolds(p,[...wrong,...h],face)[0];
 assert.ok(result.chosen.every(h=>!h.id.endsWith('wrong')));
});
test('explicit repeated grips allow matched hands, only on matchable destination holds',()=>{
 const p=[{x:.3,y:.8},{x:.3,y:.8,sameAs:0},{x:.5,y:.2},{x:.5,y:.2,sameAs:2}],h=[{id:'s',x:.3,y:.8,match:true},{id:'f',x:.5,y:.2,match:true}];
 assert.deepEqual(matchRockHolds(p,h,face)[0].chosen.map(h=>h.id),['s','s','f','f']);
 assert.throws(()=>matchRockHolds(p,h.map(h=>({...h,match:false})),face),/duas mãos/);
});
test('removing a repeated source grip repairs references without merging other holds',()=>{
 const p=[{x:0},{x:0,sameAs:0},{x:1},{x:0,sameAs:1},{x:1,sameAs:2}],result=removeRockPoint(p,0);
 assert.deepEqual(sourceGroups(result),[0,1,0,1]);assert.throws(()=>sourceGroups([{sameAs:0}]),/inválida/);
});
test('photo zoom and crop preserve measured movement lengths after recalibration',()=>{
 const p=points(),a={x:.1,y:.1},b={x:.5,y:.1},cal={a,b,meters:1.2};
 const original=rockTargets(p,1,face,cal),zoom=q=>({x:q.x*.7+.1,y:q.y*.7+.1});
 const changed=rockTargets(p.map(p=>({...p,...zoom(p)})),1,face,{a:zoom(a),b:zoom(b),meters:1.2});
 original.forEach((p,i)=>{assert.ok(Math.abs(p.x-changed[i].x)<1e-10);assert.ok(Math.abs(p.y-changed[i].y)<1e-10);});
 const crop=q=>({x:(q.x-.1)/.8,y:(q.y-.05)/.9});
 const cropped=rockTargets(p.map(p=>({...p,...crop(p)})),.8/.9,face,{a:crop(a),b:crop(b),meters:1.2});
 original.forEach((p,i)=>{assert.ok(Math.abs(p.x-cropped[i].x)<1e-10);assert.ok(Math.abs(p.y-cropped[i].y)<1e-10);});
});
function route(){
 const h=[['A',1.2,1.2],['B',1.8,1.2],['P',1.2,.25],['Q',1.8,.25],['T',1.3,2.5],['Z',3,3]].map(([id,x,y])=>({id,faceId:'f',x:x/3,y:1-y/3,quality:'good',type:'Batente',match:id==='T'}));
 return {snapshot:{faces:[{id:'f',...face}],holds:h},feet:'follow',assignments:{A:['startL'],B:['startR'],P:['foot'],Q:['foot'],T:['hand','finishL','finishR'],Z:['hand']}};
}
test('prescribed sequence preserves the moving hand and cannot skip an impossible rock move',()=>{
 const r=route(),moves=[{limb:'RH',targetHold:'T'},{limb:'LH',targetHold:'T'}];
 const result=searchBetas(r,C.profiles[1],{prescribedMoves:moves});assert.ok(result.betas.length);
 for(const beta of result.betas)assert.deepEqual(beta.moves.filter(m=>m.movingLimb.endsWith('H')).map(m=>({limb:m.movingLimb,targetHold:m.targetHold})),moves);
 assert.equal(searchBetas(r,C.profiles[1],{prescribedMoves:[{limb:'LH',targetHold:'Z'},...moves]}).betas.length,0);
});
