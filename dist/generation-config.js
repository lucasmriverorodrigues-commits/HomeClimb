// Engineering priors, NOT measured grade boundaries or a validated biomechanical model.
// Keep these versioned so a future fitted model can replace them without changing data entry.
export const calibration = {
 version:'movement-2.3', style:'DEFAULT_BALANCED',
 profiles:[{id:'SHORT',height:1.55,armSpan:1.55,legLength:.78,torsoLength:.43,hipMobilityRange:.65},{id:'AVERAGE',height:1.72,armSpan:1.74,legLength:.87,torsoLength:.48,hipMobilityRange:.65},{id:'TALL',height:1.9,armSpan:1.94,legLength:.96,torsoLength:.53,hipMobilityRange:.65}],
 handQuality:{good:0,medium:2.2,bad:4.5,unknown:3},
 footQuality:{good:0,medium:1,bad:2.4,unknown:1.8},
 handType:{Batente:0,Reglete:.65,Abaulado:.6,'Pinça':.45,Pinch:.45,Buraco:.55,Outro:.2,'Não informado':.2},
 footType:{Batente:0,Reglete:.1,Abaulado:.55,'Pinça':.2,Pinch:.2,Buraco:.25,Outro:.3,'Não informado':.3},
 body:{shoulderWidth:.18,armFraction:.5,armSlack:1.12,legSlack:1.12,hipOffsets:[-.12,0,.12],handHipDrop:.39,footHipRise:.42,roofAngle:65,maxHandSpan:1.15,maxFootRise:.65,compressionRatio:.33,extensionRatio:.83,hipShift:.44,handFootClearance:.04},
 move:{source:.24,target:.62,feet:.72,reach:1.1,angle:1.5,tension:.8,compression:.7,extension:.8,highStep:.9,balance:.5,cross:.45,dynamic:1.1,missingContact:1.2,orientation:.2,footMove:.18,recovery:.1},
 grade:{crux:.52,top3:.28,mean:.2,continuity:.12,offset:-.7,min:0,max:12,spreadWarning:2,shortcutDrop:.8,shortcutSkipped:2,confidenceCap:.48},
 search:{beam:6,poses:2,footPool:8,maxSteps:16,completions:3,backtrack:.22,progressWeight:1.3,costWeight:.06,footTravel:1.35,footRank:.13,bodyCacheLimit:25000},
 generator:{attempts:900,shortlist:6,rankPool:8,neighborMin:.07,otherReach:1.3,progressBacktrack:.08,coverage:.6,extentCoverage:.8,gap:.5,extentGap:.65,matchSpread:.75,qualityTarget:.55,progressRank:4,footProposal:14,footPerHand:3,footDistance:.8,footQualityRank:.12,footAbovePenalty:.8,morphologyWeight:.25,shortcutWeight:.6,tolerance:1},
 // Tunable route-composition preferences. None of these distances determine a V grade.
 composition:{minSeparation:.15,preferredSeparation:.24,minReachFraction:.5,preferredReachFraction:.7,spacingWeight:3,footWeight:.4,removalTrials:18,removalGradeSlack:.75,finalists:2},
 startingSupports:{baseBand:.25,basePool:8,basePairs:2,minFootSeparation:.12,middlePool:4,rescuePaths:2,finishClearance:.35},
 rock:{candidates:3,bodyPenalty:.7,morphologyPenalty:.4,unsupportedPenalty:12}
};
export const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
