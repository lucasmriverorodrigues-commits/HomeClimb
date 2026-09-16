export function routeFace(route,preferred){
 const holds=route.snapshot.holds,assignments=route.assignments||{};
 const start=holds.find(h=>assignments[h.id]?.some(r=>r.startsWith('start')));
 const used=start||holds.find(h=>assignments[h.id]?.length);
 return used?.faceId||(route.snapshot.faces.some(f=>f.id===preferred)?preferred:route.snapshot.faces[0]?.id);
}
