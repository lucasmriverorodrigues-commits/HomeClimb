import {calibration as C,clamp} from './generation-config.js';
import {searchBetas} from './beta-search.js';
export function betaFeatures(beta){
 const values=beta.moves.map(m=>m.difficulty).sort((a,b)=>b-a),mean=values.reduce((a,b)=>a+b,0)/(values.length||1),crux=values[0]||0,top3=values.slice(0,3).reduce((a,b)=>a+b,0)/Math.min(3,values.length||1);
 const hardMoveCount=values.filter(v=>v>=crux*.8).length,recoveryQuality=beta.moves.filter(m=>m.movingLimb.endsWith('H')&&m.features.targetHandQuality===0&&m.features.numberOfUsableFeet===2).length;
 const continuity=Math.max(0,hardMoveCount-recoveryQuality),score=clamp(crux*C.grade.crux+top3*C.grade.top3+mean*C.grade.mean+Math.log1p(continuity)*C.grade.continuity+C.grade.offset,C.grade.min,C.grade.max);
 return {crux,top3Mean:top3,meanMoveDifficulty:mean,hardMoveCount,continuity,movementCount:values.length,recoveryQuality,score};
}
export function detectShortcut(easiest,intended,handIds=[]){
 if(!easiest)return {detected:false,skipped:[],drop:0};
 const visited=new Set(easiest.states.flatMap(s=>[s.LH,s.RH])),skipped=handIds.filter(id=>!visited.has(id));
 const drop=intended?Math.max(0,betaFeatures(intended).score-betaFeatures(easiest).score):0;
 const handHistory=new Set();let handAsFoot=false;for(const s of easiest.states){if(handHistory.has(s.LF)||handHistory.has(s.RF))handAsFoot=true;handHistory.add(s.LH);handHistory.add(s.RH);}
 return {detected:skipped.length>=C.grade.shortcutSkipped&&drop>=C.grade.shortcutDrop,skipped,drop,types:[...(skipped.length?['skipHold']:[]),...(easiest.moves.some(m=>m.features.matchRequired)?['unexpectedMatch']:[]),...(handAsFoot?['handAsFootShortcut']:[]),...(easiest.moves.some(m=>m.features.dynamicRequirement>0)?['dynamicSkip']:[])]};
}
// No target grade is accepted here. The saved grade/name are deliberately never read.
export function gradeBoulder(route,{intended=null,profiles=C.profiles}={}){
 const results=profiles.map(profile=>{
  const search=searchBetas(route,profile),ranked=search.betas.map(beta=>({beta,features:betaFeatures(beta)})).sort((a,b)=>a.features.score-b.features.score),best=ranked[0];
  return {profile:profile.id,feasible:!!best,score:best?.features.score??null,beta:best?.beta??null,features:best?.features??null,alternatives:ranked.slice(1).map(v=>v.beta),expanded:search.expanded};
 });
 const feasible=results.filter(r=>r.feasible),scores=feasible.map(r=>r.score),spread=scores.length?Math.max(...scores)-Math.min(...scores):0;
 const warnings=['Estimativa heurística sem calibração com graus de escaladores. Busca limitada: pode haver outra beta.'];
 if(feasible.length!==results.length)warnings.push('Não foi encontrada beta para: '+results.filter(r=>!r.feasible).map(r=>r.profile).join(', ')+'.');
 if(spread>C.grade.spreadWarning)warnings.push('Dependência elevada do tamanho do escalador.');
 const average=results.find(r=>r.profile==='AVERAGE')||feasible[0];
 let intendedBeta=null;if(intended&&average?.feasible){const profile=profiles.find(p=>p.id===average.profile);const found=searchBetas(route,profile,{intended}).betas;intendedBeta=found.sort((a,b)=>betaFeatures(a).score-betaFeatures(b).score)[0]||null;}
 const shortcut=detectShortcut(average?.beta,intendedBeta,intended||[]);
 if(shortcut.detected)warnings.push('Uma beta alternativa reduz a dificuldade da sequência proposta.');
 const selected=route.snapshot.holds.filter(h=>route.assignments[h.id]?.length),known=selected.filter(h=>h.quality!=='unknown').length/(selected.length||1),orientation=selected.filter(h=>h.directionKnown===true).length/(selected.length||1);
 const confidence=feasible.length?C.grade.confidenceCap*known*(.8+.2*orientation)*(feasible.length/results.length)/(1+spread*.15):0;
 return {engine:C.version,feasible:feasible.length===results.length,predictedGrade:average?.score!=null?Math.round(average.score):null,score:average?.score??null,confidence,confidenceMeaning:'uncalibrated-data-completeness',features:average?.features??null,hardestMoves:average?.beta?.moves.slice().sort((a,b)=>b.difficulty-a.difficulty).slice(0,3)||[],easiestBeta:average?.beta??null,alternativeBetas:average?.alternatives||[],profiles:results,morphologySensitivity:{spread,missing:results.length-feasible.length,high:feasible.length!==results.length||spread>C.grade.spreadWarning},shortcut,intendedBeta,warnings};
}
export function predictionSummary(result){return {engine:result.engine,predictedGrade:result.predictedGrade,confidence:result.confidence,confidenceMeaning:result.confidenceMeaning,morphologySensitivity:result.morphologySensitivity,shortcut:{detected:result.shortcut.detected,drop:result.shortcut.drop,skipped:result.shortcut.skipped},profiles:result.profiles.map(r=>({profile:r.profile,feasible:r.feasible,score:r.score})),warnings:result.warnings};}
