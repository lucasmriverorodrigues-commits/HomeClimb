import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateBoulder} from '../dist/generator.js';
import {validateRoute} from '../dist/core.js';
import {cases,metrics} from './generator-density-cases.mjs';
const report=[];
for(const c of cases()){
 const start=performance.now(),r=generateBoulder(c.wall,c.options),composition=r.route.generationAnalysis.composition;
 assert.equal(validateRoute(r.route),'');
 assert.equal(composition.baseFeet.length,2);
 assert.ok(composition.middleFeet.length<=2);
 assert.equal(composition.extraFeet,2+composition.middleFeet.length);
 assert.ok(composition.baseFeet.every(id=>c.wall.holds.find(h=>h.id===id).y>=composition.baseBandY-1e-9));
 assert.ok(composition.middleFeet.every(id=>c.wall.holds.find(h=>h.id===id).y<composition.baseBandY));
 assert.ok(r.analysis.profiles.every(p=>p.feasible));
 assert.ok(!r.analysis.morphologySensitivity.high);
 assert.ok(composition.handsUsedAsFeet.length>0);
 const m=metrics(r,c.wall);assert.equal(m.closePairs,0);
 const row={id:c.id,split:c.split,...m,baseFeet:composition.baseFeet,middleFeet:composition.middleFeet,handsUsedAsFeet:composition.handsUsedAsFeet,elapsedMs:Math.round(performance.now()-start)};
 report.push(row);console.log(JSON.stringify(row));
}
fs.writeFileSync(new URL('./base-feet-regression-report.json',import.meta.url),JSON.stringify({version:'0.19',note:'Synthetic fixtures; not physically validated or the measured walls in the screenshots.',cases:report},null,2));
