import test from 'node:test';
import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {copyFileSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {FaceTracker,project,validQuad} from '../dist/tracking.js';
const runtime=join(tmpdir(),'homeclimb-opencv-4.13.cjs');copyFileSync(new URL('../dist/vendor/opencv.js',import.meta.url),runtime);const cv=createRequire(import.meta.url)(runtime);if(!cv.Mat)await new Promise(resolve=>cv.onRuntimeInitialized=resolve);
function texture(seed=33){const m=new cv.Mat(480,640,cv.CV_8UC1);m.data.fill(210);let s=seed;const rand=()=>{s=(s*1664525+1013904223)>>>0;return s/4294967296};for(let i=0;i<350;i++){const x=15+Math.floor(rand()*605),y=15+Math.floor(rand()*445),size=3+Math.floor(rand()*14);cv.rectangle(m,new cv.Point(x,y),new cv.Point(x+size,y+size),new cv.Scalar(Math.floor(rand()*170)), -1);}return m;}
test('projeção e rejeição de quadrilátero degenerado',()=>{assert.deepEqual(project([1,0,10,0,1,20,0,0,1],5,5),[15,25]);assert.equal(validQuad([[0,0],[1,1],[2,2],[3,3]],640,480),false);});
test('OpenCV reconhece face deslocada e recupera posição de agarra',()=>{const reference=texture(),frame=new cv.Mat(),H=cv.matFromArray(3,3,cv.CV_64F,[.95,.025,18,-.02,.96,15,.000015,.00002,1]),tracker=new FaceTracker(cv);try{assert.ok(tracker.add('face1',reference)>50);cv.warpPerspective(reference,frame,H,new cv.Size(640,480));const result=tracker.locate(frame);assert.equal(result.length,1);const expected=project(Array.from(H.data64F),300,200),actual=project(result[0].H,300,200);assert.ok(Math.hypot(actual[0]-expected[0],actual[1]-expected[1])<4);}finally{tracker.dispose();reference.delete();frame.delete();H.delete();}});
test('sem referência reconhecível não mantém marcações antigas',()=>{const reference=texture(),blank=cv.Mat.zeros(480,640,cv.CV_8UC1),tracker=new FaceTracker(cv);try{tracker.add('face1',reference);assert.equal(tracker.locate(reference).length,1);assert.deepEqual(tracker.locate(blank),[]);}finally{tracker.dispose();reference.delete();blank.delete();}});
test('faces têm registros independentes e imagem alheia é rejeitada',()=>{const a=texture(33),b=texture(982),other=texture(9999),tracker=new FaceTracker(cv);try{tracker.add('vertical',a);tracker.add('teto',b);assert.deepEqual(tracker.locate(a).map(r=>r.id),['vertical']);assert.deepEqual(tracker.locate(b).map(r=>r.id),['teto']);assert.deepEqual(tracker.locate(other),[]);}finally{tracker.dispose();a.delete();b.delete();other.delete();}});
