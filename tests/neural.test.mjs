import test from 'node:test';
import assert from 'node:assert/strict';
import {detectionTiles,letterbox,decodeBoxes,suppressDuplicates,neuralDetect} from '../dist/neural-detection.js';

test('overlapping tiles cover the dense wall without leaving image bounds',()=>{
 for(const [width,height] of [[735,1000],[1600,400],[200,200]]){
  const tiles=detectionTiles(width,height);
  for(const t of tiles)assert.ok(t.x>=0&&t.y>=0&&t.x+t.w<=width&&t.y+t.h<=height);
  for(let y=0;y<height;y+=7)for(let x=0;x<width;x+=7)assert.ok(tiles.some(t=>x>=t.x&&x<t.x+t.w&&y>=t.y&&y<t.y+t.h));
 }
});
test('letterboxing preserves channel order and neutral padding',()=>{
 const image={width:2,height:1,data:new Uint8ClampedArray([255,0,0,255,0,0,255,255])};
 const result=letterbox(image,{x:0,y:0,w:2,h:1},4);
 assert.equal(result.dy,1);assert.equal(result.values[0],Math.fround(114/255));
 assert.equal(result.values[4],1);assert.equal(result.values[16+4],0);assert.equal(result.values[32+7],1);
});
test('box decoding removes padding and rejects clipped overlapping-tile proposals',()=>{
 const raw=new Float32Array([320,320,160,160,.9]);
 const boxes=decodeBoxes(raw,1,{scale:2,dx:0,dy:0},{x:100,y:100,w:320,h:320,full:false},1000,1000);
 assert.deepEqual(boxes[0].box,[.22,.22,.3,.3]);
 raw[0]=0;assert.equal(decodeBoxes(raw,1,{scale:2,dx:0,dy:0},{x:100,y:100,w:320,h:320,full:false},1000,1000).length,0);
});
test('duplicate suppression keeps adjacent separate holds and highest confidence',()=>{
 const result=suppressDuplicates([{box:[.1,.1,.2,.2],score:.8},{box:[.11,.11,.19,.19],score:.7},{box:[.21,.1,.31,.2],score:.9}]);
 assert.equal(result.length,2);assert.equal(result[0].score,.9);
});
test('failed inference releases input tensor',async()=>{
 let disposed=0;
 class Tensor{dispose(){disposed++;}}
 await assert.rejects(neuralDetect({Tensor},{inputNames:['image'],run:async()=>{throw Error('failure');}},{width:2,height:2,data:new Uint8ClampedArray(16)}),/failure/);
 assert.equal(disposed,1);
});

