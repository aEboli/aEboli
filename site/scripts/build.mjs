import {mkdir,readFile,writeFile,copyFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const output=path.resolve(root,process.argv[2]||'dist');
await mkdir(output,{recursive:true});
const html=(await readFile(path.join(root,'index.html'),'utf8')).replaceAll('./node_modules/three/','./vendor/three/');
await writeFile(path.join(output,'index.html'),html);
for(const name of ['style.css','scene.js','daylight.js','reference.vrm','MODEL-LICENSE.json','preview.py','start-preview.cmd','README.md'])await copyFile(path.join(root,name),path.join(output,name));
await writeFile(path.join(output,'.nojekyll'),'');

// 只复制浏览器实际引用的 Three.js 模块及其相对依赖。
const copied=new Set();
async function copyModule(relative){
  const normalized=relative.replaceAll('\\','/');
  if(copied.has(normalized))return;
  copied.add(normalized);
  const source=path.join(root,'node_modules/three',normalized),dest=path.join(output,'vendor/three',normalized);
  await mkdir(path.dirname(dest),{recursive:true});await copyFile(source,dest);
  if(!normalized.endsWith('.js'))return;
  const code=await readFile(source,'utf8');
  for(const match of code.matchAll(/(?:from\s*|import\s*\(\s*)['"]([^'"]+)['"]/g)){
    const dependency=match[1];
    if(dependency.startsWith('.'))await copyModule(path.posix.normalize(path.posix.join(path.posix.dirname(normalized),dependency)));
  }
}
for(const name of ['build/three.module.js','examples/jsm/loaders/GLTFLoader.js','examples/jsm/controls/OrbitControls.js','examples/jsm/environments/RoomEnvironment.js','LICENSE'])await copyModule(name);
console.log(`已构建独立网页：${path.relative(root,output)}（${copied.size} 个依赖文件）`);
