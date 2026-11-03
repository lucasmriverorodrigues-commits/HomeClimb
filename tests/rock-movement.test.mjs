import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {adaptRock} from '../dist/on-rock.js';import {gradeBoulder} from '../dist/boulder-grader.js';import {validateRoute} from '../dist/core.js';
const wall=()=>JSON.parse(fs.readFileSync(new URL('generator-fixture.json',import.meta.url))).wall;
test('rock adaptation retains scale comparison and records destination analysis',()=>{
 const w=wall(),points=['h7_0','h7_3','h5_1','h3_2','h0_0','h0_2'].map(id=>w.holds.find(h=>h.id===id));
 const route=adaptRock(w,'face',points,.8,{a:{x:0,y:0},b:{x:1,y:0},meters:2.4});
 assert.equal(validateRoute(route),'');assert.equal(route.name,'On the Rock');assert.equal(route.scale,'Sem grau');
 assert.match(route.notes,/referência .*m \/ muro/);assert.equal(route.generationAnalysis.profiles.length,3);
 const independent=gradeBoulder(route,{prescribedMoves:route.rockAnalysis.prescribedMoves});assert.equal(route.generationAnalysis.predictedGrade,independent.predictedGrade);
 assert.deepEqual(route.generationAnalysis.profiles,independent.profiles.map(p=>({profile:p.profile,feasible:p.feasible,score:p.score})));
 for(const h of w.holds)if(h.footOnly)assert.ok(!route.assignments[h.id]?.some(role=>role!=='foot'));
});
test('geometric fit without supported beta is explicitly marked for review',()=>{
 const w=wall();w.holds=w.holds.filter(h=>['h7_0','h7_3','h0_0','h0_3'].includes(h.id));
 const route=adaptRock(w,'face',w.holds.map(h=>({...h})),.8);
 assert.match(route.notes,/ATENÇÃO: encaixe geométrico/);assert.ok(route.generationAnalysis.profiles.some(p=>!p.feasible));
});
