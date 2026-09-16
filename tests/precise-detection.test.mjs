import test from 'node:test';import assert from 'node:assert/strict';
import {createRequire} from 'node:module';import {copyFileSync} from 'node:fs';import {join} from 'node:path';import {tmpdir} from 'node:os';
import {preciseDetection,insideContour,refineHold} from '../dist/precise-detection.js';import {detectHolds} from '../dist/hold-detection.js';
const runtime=join(tmpdir(),'homeclimb-opencv-precise.cjs');copyFileSync(new URL('../dist/vendor/opencv.js',import.meta.url),runtime);const cv=createRequire(import.meta.url)(runtime);if(!cv.Mat)await new Promise(r=>cv.onRuntimeInitialized=r);
function fixture(width=300,height=200){const data=new Uint8ClampedArray(width*height*4);for(let y=0;y<height;y++)for(let x=0;x<width;x++){const v=150+Math.round(x/width*12);data.set([v,v-10,v-25,255],(y*width+x)*4);}return {width,height,data,automatic:true};}
function paint(f,predicate,color){for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++)if(predicate(x,y))f.data.set([...color,255],(y*f.width+x)*4);}
function overlap(f,contour,predicate){let union=0,intersection=0;for(let y=0;y<f.height;y++)for(let x=0;x<f.width;x++){const a=insideContour((x+.5)/f.width,(y+.5)/f.height,contour),b=predicate(x,y);if(a||b)union++;if(a&&b)intersection++;}return intersection/union;}
test('refined concave contour preserves the actual cutout on controlled image',()=>{
 const f=fixture(),shape=(x,y)=>x>=60&&x<92&&y>=60&&y<92&&!(x>=75&&y>=75);paint(f,shape,[230,45,30]);
 const result=preciseDetection(cv,f);assert.equal(result.candidates.length,1);assert.equal(result.candidates[0].refined,true);const iou=overlap(f,result.candidates[0].contour,shape);assert.ok(iou>.93,`IoU ${iou}`);
});
test('dense fixture finds colored holds but does not select small bolt holes',()=>{
 const f=fixture(600,400);let expected=0;
 for(let y=45;y<370;y+=65)for(let x=45;x<570;x+=65){expected++;paint(f,(xx,yy)=>(xx-x)**2/12**2+(yy-y)**2/9**2<=1,expected%2?[230,35,35]:[20,70,230]);paint(f,(xx,yy)=>(xx-x-23)**2+(yy-y-18)**2<=2**2,[30,30,30]);}
 const result=preciseDetection(cv,f);assert.equal(result.candidates.filter(c=>c.confidence==='strong').length,expected);assert.ok(result.candidates.every(c=>c.refined));
});
test('touching different-colored holds are segmented separately',()=>{
 const f=fixture();paint(f,(x,y)=>x>=60&&x<80&&y>=60&&y<85,[230,30,30]);paint(f,(x,y)=>x>=80&&x<100&&y>=60&&y<85,[20,30,230]);const result=preciseDetection(cv,f);assert.equal(result.candidates.length,2);assert.ok(result.candidates.every(c=>c.contour.length>=3));
});
test('dark neutral objects require review rather than being selected automatically',()=>{
 const f=fixture();paint(f,(x,y)=>x>=80&&x<100&&y>=60&&y<80,[25,25,25]);const result=preciseDetection(cv,f);assert.equal(result.candidates.length,1);assert.equal(result.candidates[0].confidence,'review');
});
test('detailed preset includes smaller holds without changing saved data',()=>{
 const f=fixture(600,300);paint(f,(x,y)=>x>=90&&x<96&&y>=90&&y<96,[240,20,30]);const original=f.data.slice();const coarse=preciseDetection(cv,{...f,preset:'careful'}),fine=preciseDetection(cv,{...f,preset:'detailed'});assert.equal(coarse.candidates.length,0);assert.equal(fine.candidates.length,1);assert.deepEqual(f.data,original);
});
test('background-only texture does not become a set of holds',()=>{const result=preciseDetection(cv,fixture());assert.equal(result.candidates.length,0);});
test('unrefinable proposal is returned explicitly instead of labelled precise',()=>{const f=fixture();const result=refineHold(cv,f,{x:.5,y:.5,radius:.02});assert.equal(result.refined,false);});
test('exact polygon hit test excludes empty areas inside the bounding circle',()=>{const p=[[.1,.1],[.5,.1],[.5,.2],[.2,.2],[.2,.5],[.1,.5]];assert.equal(insideContour(.15,.4,p),true);assert.equal(insideContour(.4,.4,p),false);});
