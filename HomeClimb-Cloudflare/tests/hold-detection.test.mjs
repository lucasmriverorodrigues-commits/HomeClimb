import test from 'node:test';
import assert from 'node:assert/strict';
import {detectHolds,withoutExisting} from '../dist/hold-detection.js';
const fixture=()=>{const width=200,height=160,data=new Uint8ClampedArray(width*height*4);for(let i=0;i<data.length;i+=4)data.set([150,140,125,255],i);return {width,height,data,samples:[[150,140,125]]};};
function rect(f,x,y,w,h,color){for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)f.data.set([...color,255],(yy*f.width+xx)*4);}
test('finds separate contrasting holds and normalized centers',()=>{const f=fixture();rect(f,30,30,12,10,[220,30,30]);rect(f,120,90,16,14,[30,60,230]);const {candidates}=detectHolds(f);assert.equal(candidates.length,2);assert.ok(Math.abs(candidates[0].x-.1775)<.01);assert.ok(Math.abs(candidates[1].y-.603)<.01);assert.ok(candidates.every(c=>c.radius>=.008&&c.radius<=.1));});
test('multiple sampled background colors suppress wall patches',()=>{const f=fixture();rect(f,30,30,20,20,[50,60,70]);assert.equal(detectHolds(f).candidates.length,1);f.samples.push([50,60,70]);assert.equal(detectHolds(f).candidates.length,0);});
test('small bolts, seams and large background regions are filtered',()=>{const f=fixture();rect(f,10,10,2,2,[0,0,0]);rect(f,40,40,3,70,[0,0,0]);rect(f,100,50,70,70,[0,0,0]);assert.equal(detectHolds(f).candidates.length,0);});
test('wall-colored holds cannot be inferred; empty photo has no candidates',()=>{assert.equal(detectHolds(fixture()).candidates.length,0);});
test('tolerance and minimum size change candidate filtering',()=>{const f=fixture();rect(f,30,30,10,10,[190,180,165]);assert.equal(detectHolds({...f,tolerance:20}).candidates.length,1);assert.equal(detectHolds({...f,tolerance:60}).candidates.length,0);assert.equal(detectHolds({...f,tolerance:20,minDiameter:8}).candidates.length,0);});
test('existing hold centers are excluded, nearby separate holds remain',()=>{const a={x:.5,y:.5,radius:.02},b={x:.55,y:.5,radius:.02};assert.deepEqual(withoutExisting([a,b],[a],1.25),[b]);});
test('invalid inputs are rejected before image processing',()=>{assert.throws(()=>detectHolds({...fixture(),samples:[]}));assert.throws(()=>detectHolds({...fixture(),width:2000}));assert.throws(()=>detectHolds({...fixture(),tolerance:NaN}));});
