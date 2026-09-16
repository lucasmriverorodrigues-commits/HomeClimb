import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('./dist/',import.meta.url));
const failures=[];
function walk(dir){return fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);}
function exists(p){if(!fs.existsSync(p))failures.push('Arquivo ausente: '+path.relative(root,p));}
const files=walk(root);
for(const file of files){
 if(fs.statSync(file).size>25*1024*1024)failures.push('Acima de 25 MiB: '+file);
 if(/\.(js|mjs|html)$/.test(file)&&!file.includes(path.sep+'vendor'+path.sep)){
  const text=fs.readFileSync(file,'utf8');
  for(const match of text.matchAll(/(?:from\s*|import\s*\(\s*|(?:src|href)=)["'](\.\.?\/[^"']+)["']/g)){
   const relative=match[1].split(/[?#]/)[0];
   exists(path.resolve(path.dirname(file),relative));
  }
 }
}
const sw=fs.readFileSync(path.join(root,'sw.js'),'utf8');
const precache=sw.match(/const ASSETS=\[([^\]]+)\]/)?.[1];
if(!precache)failures.push('Lista offline não encontrada');
else for(const m of precache.matchAll(/'([^']+)'/g))exists(path.resolve(root,m[1]));
for(const p of ['index.html','_headers','camera.js','tracking.js','generator.js','on-rock.js','models/holds-640.onnx','vendor/opencv.js','vendor/ort/ort-wasm-simd-threaded.wasm','homeclimb-source.zip','LICENSE.txt','models/LICENSE.txt'])exists(path.join(root,p));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8'));
for(const icon of manifest.icons)exists(path.resolve(root,icon.src));
if(process.argv.includes('--original')){
 const originals=JSON.parse(fs.readFileSync(new URL('./arquivos-originais.json',import.meta.url),'utf8'));
 for(const [name,expected] of Object.entries(originals)){
  const p=path.join(root,name);exists(p);
  if(fs.existsSync(p)&&crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')!==expected)failures.push('Alterado em relação à versão original: '+name);
 }
}
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
console.log('OK: '+files.length+' arquivos; módulos, modelos, licenças, cache offline e limite do Cloudflare verificados.');
console.log('Versão do cache: '+sw.match(/const CACHE='([^']+)'/)[1]);
