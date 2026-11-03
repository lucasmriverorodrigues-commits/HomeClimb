import fs from 'node:fs';
import assert from 'node:assert/strict';
import {generateBoulder} from '../dist/generator.js';
import {cases} from './generator-density-cases.mjs';
import {calibration as C} from '../dist/generation-config.js';
import {directionFit} from '../dist/hold-direction.js';
import {contextFor} from '../dist/movement-model.js';
const results=[];
for(const kind of ['down','mixed'])for(const movementStyle of ['compact','balanced','wide']){
 const c=structuredClone(cases().find(c=>c.id==='vertical-dev'));
 // Hands start above two rows reserved for feet, like a mapped home wall.
 for(const [i,h] of c.wall.holds.entries())Object.assign(h,{footOnly:h.y>.79,directionKnown:true,direction:kind==='mixed'&&i%5===1?90:kind==='mixed'&&i%7===2?0:180,directionTolerance:100});
 const started=performance.now();
 try{
  const r=generateBoulder(c.wall,{...c.options,movementStyle,count:8,reach:1.1,debugGeneration:true});
  const ctx=contextFor(r.route,C.profiles[1]);
  for(const s of r.beta.states)for(const [i,limb]of ['LH','RH'].entries())assert.ok(directionFit(ctx.holds.get(s[limb]),s.shoulders[i]).allowed);
  for(const m of r.beta.moves.filter(m=>m.movingLimb.endsWith('H')))assert.ok(m.features.handTravelMeters<=C.profiles[1].armSpan*C.movementStyles[movementStyle].maxTravel+1e-9);
  results.push({kind,movementStyle,feasible:true,feet:r.route.generationAnalysis.composition.extraFeet,maxHandTravel:r.analysis.movement.maxHandTravelMeters,oriented:r.analysis.movement.orientedHolds,elapsedMs:Math.round(performance.now()-started)});
 }catch(e){results.push({kind,movementStyle,error:e.message,elapsedMs:Math.round(performance.now()-started)});}
 console.log(results.at(-1));
}
fs.writeFileSync(new URL('./oriented-generation-report.json',import.meta.url),JSON.stringify({note:'Synthetic walls, heuristic 2D posture model; no human grade validation.',cases:results},null,2));
assert.ok(results.every(r=>r.feasible));
