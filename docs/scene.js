import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {beijingTime,lightingAtHour} from './daylight.js';

const params = new URLSearchParams(location.search);
const capture = params.has('capture');
if(capture)document.body.classList.add('capture');
const previewHour = params.has('hour') && Number.isFinite(Number(params.get('hour'))) ? Number(params.get('hour')) : null;
const renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, preserveDrawingBuffer:capture});
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.setClearColor(0,0);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = .94;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
const viewport = document.querySelector('#scene');
viewport.appendChild(renderer.domElement);
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(29,1,.1,80);
const controls = new OrbitControls(camera,renderer.domElement);
controls.enableDamping = true;controls.dampingFactor = .08;
controls.enablePan = false;controls.enableZoom = false;
controls.minAzimuthAngle = -.45;controls.maxAzimuthAngle = 1.15;
controls.minPolarAngle = 1.02;controls.maxPolarAngle = 1.55;
function resetView(){controls.enableDamping=false;controls.update();camera.position.set(4.2,2.85,7.4);controls.target.set(0,1.35,0);controls.update();controls.enableDamping=true;}
resetView();
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.setViewOffset(w,h,w<680?0:-w*.205,w<680?-h*.18:0,w,h);camera.fov=w<680?39:27;camera.updateProjectionMatrix();}
new ResizeObserver(resize).observe(viewport);
resize();
const pmrem = new THREE.PMREMGenerator(renderer), room = new RoomEnvironment();
scene.environment = pmrem.fromScene(room,.04).texture;
room.dispose();pmrem.dispose();
const ambient = new THREE.HemisphereLight('#d5efff','#b4b5a7',.9);scene.add(ambient);
const key = new THREE.DirectionalLight(0xfff1d8,3.1);key.position.set(-3,6,4);key.castShadow=true;
key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-4;key.shadow.camera.right=4;key.shadow.camera.top=4;key.shadow.camera.bottom=-3;key.shadow.camera.near=.1;key.shadow.camera.far=20;
key.shadow.bias=-.0003;key.shadow.normalBias=.025;key.shadow.radius=3;key.target.position.set(0,1,0);scene.add(key,key.target);
const fill = new THREE.DirectionalLight(0xc6eaff,.65);fill.position.set(3,3,-4);scene.add(fill);
const fabricCanvas=document.createElement('canvas');fabricCanvas.width=fabricCanvas.height=128;const fabricCtx=fabricCanvas.getContext('2d');const grain=fabricCtx.createImageData(128,128);
for(let i=0;i<grain.data.length;i+=4){const shade=155+Math.sin(i*78.233)*Math.cos(i*12.9898)*26;grain.data[i]=grain.data[i+1]=grain.data[i+2]=shade;grain.data[i+3]=255;}fabricCtx.putImageData(grain,0,0);
const fabric=new THREE.CanvasTexture(fabricCanvas);fabric.wrapS=fabric.wrapT=THREE.RepeatWrapping;fabric.repeat.set(4,4);
const mat = (color,extra={}) => new THREE.MeshPhysicalMaterial({color,roughness:.78,metalness:0,...extra});
const colors = {blue:mat('#65acd2'),pale:mat('#f5eada'),cream:mat('#ffeed3'),navy:mat('#264f72'),mint:mat('#469e9a'),steel:mat('#a4b9c7'),rubber:mat('#243747'),skin:mat('#f4baa4'),pink:mat('#db8cae')};
for(const material of [colors.blue,colors.pale]){material.sheen=.65;material.sheenColor.set('#daefff');material.sheenRoughness=.8;material.bumpMap=fabric;material.bumpScale=.007;}
colors.mint.roughness=.3;colors.mint.metalness=.3;colors.mint.clearcoat=.65;
colors.steel.roughness=.25;colors.steel.metalness=.8;colors.rubber.roughness=.95;colors.skin.roughness=.7;
const model = new THREE.Group(); scene.add(model);
const sphere = new THREE.SphereGeometry(1,40,28);
function ellipsoid(parent,material,position,scale){const m=new THREE.Mesh(sphere,material);m.position.set(...position);m.scale.set(...scale);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function tube(parent,points,radius,material,closed=false){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),closed);const m=new THREE.Mesh(new THREE.TubeGeometry(curve,Math.max(16,points.length*12),radius,10,closed),material);m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
function rod(parent,a,b,r,material){const v1=new THREE.Vector3(...a),v2=new THREE.Vector3(...b);const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,v1.distanceTo(v2),16),material);m.position.copy(v1).add(v2).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),v2.sub(v1).normalize());m.castShadow=m.receiveShadow=true;parent.add(m);return m;}
const animatedWheels=[];
for(const x of [-.92,.92]){
 const g=new THREE.Group();g.position.set(x,.49,0);model.add(g);
 const tyre=new THREE.Mesh(new THREE.TorusGeometry(.44,.046,16,100),colors.rubber);g.add(tyre);
 const wall=new THREE.Mesh(new THREE.TorusGeometry(.425,.018,10,100),colors.cream);wall.position.z=.034;g.add(wall);
 const rim=new THREE.Mesh(new THREE.TorusGeometry(.395,.013,8,96),colors.steel);g.add(rim);
 const spin=new THREE.Group();g.add(spin);animatedWheels.push(spin);
 // 每轮 12 根轮辐，避免 25fps 导出时产生车轮倒转的频闪错觉。
 for(let i=0;i<12;i++){const a=i*Math.PI/6;rod(spin,[0,0,.006],[Math.sin(a)*.395,Math.cos(a)*.395,0],.004,colors.steel);}
 ellipsoid(spin,colors.cream,[.32,.18,.025],[.032,.014,.012]);
 rod(g,[0,0,-.075],[0,0,.075],.035,colors.steel);
 const fender=[];for(let i=0;i<=20;i++){const a=Math.PI*.08+Math.PI*.84*i/20;fender.push([Math.cos(a)*.5,Math.sin(a)*.5,0]);}tube(g,fender,.022,colors.mint);
}
const rear=[-.92,.49,0],crank=[-.08,.6,0],seat=[-.4,1.25,0],stem=[.64,1.28,0],front=[.92,.49,0];
for(const [a,b] of [[rear,crank],[rear,seat],[seat,crank],[crank,stem],[stem,front]])rod(model,a,b,.029,colors.mint);
tube(model,[seat,[-.12,.99,0],[.21,1.06,0],stem],.032,colors.mint);
rod(model,[-.4,1.20,0],[-.45,1.43,0],.021,colors.steel);
ellipsoid(model,mat('#9b7a72'),[-.45,1.41,0],[.19,.045,.105]);
rod(model,stem,[.53,1.52,0],.024,colors.steel);
tube(model,[[.53,1.52,0],[.67,1.53,.16],[.80,1.47,.24],[.80,1.47,.46]],.021,colors.steel);
tube(model,[[.53,1.52,0],[.67,1.53,-.16],[.80,1.47,-.24],[.80,1.47,-.46]],.021,colors.steel);
const gripMaterial=mat('#36566a',{roughness:.9});
for(const side of [-1,1]){
 rod(model,[.8,1.47,side*.23],[.8,1.47,side*.45],.024,gripMaterial);
 ellipsoid(model,colors.steel,[.8,1.47,side*.46],[.026,.026,.012]);
 const anchor=new THREE.Object3D();anchor.name=`grip-center-${side}`;anchor.position.set(.8,1.47,side*.34);model.add(anchor);
 tube(model,[[.74,1.47,side*.23],[.74,1.43,side*.30],[.77,1.43,side*.39]],.010,colors.steel);
}
tube(model,[[.75,1.45,.15],[.90,1.12,.16],[.64,1.03,.08]],.007,colors.navy);
ellipsoid(model,mat('#e2c994'),[.70,1.57,.12],[.043,.025,.043]);
rod(model,[-1.13,1.05,0],[-.56,1.05,0],.018,colors.steel);
for(const z of [-.10,.10])rod(model,[-.95,.5,z],[-1.05,1.05,z],.012,colors.steel);
const chainMat=mat('#76a19f');
tube(model,[[-.92,.55,.075],[-.08,.72,.075],[.04,.6,.075],[-.08,.48,.075],[-.92,.43,.075],[-.99,.49,.075]],.012,chainMat,true);
rod(model,[-.08,.6,-.13],[-.08,.6,.13],.029,colors.steel);
const chainring=new THREE.Group();chainring.position.set(-.08,.6,.075);model.add(chainring);
chainring.add(new THREE.Mesh(new THREE.TorusGeometry(.104,.012,10,48),colors.steel));
for(let i=0;i<5;i++){const angle=i/5*Math.PI*2;rod(chainring,[0,0,0],[Math.cos(angle)*.097,Math.sin(angle)*.097,0],.011,colors.steel);}
const crankArms=[];
const pedalMaterial=mat('#29495d',{roughness:.63}),reflectorMaterial=mat('#e6ac55',{roughness:.35});
for(const side of [-1,1]){
 const arm=new THREE.Group();arm.position.set(...crank);model.add(arm);
 rod(arm,[0,0,side*.11],[.19,0,side*.11],.024,colors.steel);
 const axle=rod(arm,[.19,0,side*.11],[.19,0,side*.27],.018,colors.steel);axle.name=`pedal-axle-${side}`;
 const platform=new THREE.Group();platform.name=`pedal-${side}`;platform.position.set(.19,0,side*.27);arm.add(platform);
 const base=new THREE.Mesh(new THREE.BoxGeometry(.27,.04,.25),pedalMaterial);platform.add(base);
 for(let i=0;i<5;i++){const grip=new THREE.Mesh(new THREE.BoxGeometry(.016,.008,.23),colors.rubber);grip.position.set(-.10+i*.05,.020,0);platform.add(grip);}
 for(const x of [-.139,.139]){const reflector=new THREE.Mesh(new THREE.BoxGeometry(.012,.018,.16),reflectorMaterial);reflector.position.x=x;platform.add(reflector);}
 platform.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=mesh.receiveShadow=true;});
 crankArms.push({arm,platform,side});
}

const rider=new THREE.Group();model.add(rider);
const torso=ellipsoid(rider,colors.blue,[-.30,1.64,0],[.43,.43,.33]);torso.rotation.z=-.14;
ellipsoid(rider,colors.pale,[-.18,1.59,.268],[.31,.31,.10]);
tube(rider,[[-.34,1.54,.34],[-.30,1.45,.35],[-.16,1.42,.35],[-.04,1.46,.34]],.005,mat('#c3d9e1'));
for(const x of [-.26,-.08]){tube(rider,[[x,1.96,.21],[x-.01,1.86,.31],[x-.03,1.81,.33]],.009,colors.cream);ellipsoid(rider,colors.cream,[x-.03,1.79,.33],[.014,.027,.014]);}
const collar=new THREE.Mesh(new THREE.TorusGeometry(.20,.024,16,48),colors.blue);collar.rotation.x=Math.PI/2;collar.position.set(-.17,1.98,0);rider.add(collar);
const armRigs=[],handScale=1.55,handContact=new THREE.Vector3(.082,-.014,0);
for(const side of [-1,1]){
 const upper=new THREE.Mesh(new THREE.CylinderGeometry(.113,.145,1,24),colors.blue);
 const lower=new THREE.Mesh(new THREE.CylinderGeometry(.060,.113,1,24),colors.blue);model.add(upper,lower);
 const shoulder=ellipsoid(model,colors.blue,[0,0,0],[.145,.145,.145]);shoulder.name=`shoulder-${side}`;
 const elbow=ellipsoid(model,colors.blue,[0,0,0],[.114,.114,.114]);elbow.name=`elbow-${side}`;
 const wrist=new THREE.Group();wrist.name=`wrist-${side}`;wrist.position.set(.8,1.47,side*.34).addScaledVector(handContact,-handScale);wrist.scale.setScalar(handScale);model.add(wrist);
 const contact=new THREE.Object3D();contact.position.copy(handContact);contact.name=`hand-contact-${side}`;wrist.add(contact);
 const cuff=new THREE.Mesh(new THREE.CylinderGeometry(.056,.066,.068,24),colors.cream);model.add(cuff);
 armRigs.push({side,upper,lower,shoulder,elbow,wrist,cuff});
}

function updateArms(){
 for(const arm of armRigs){
  const shoulder=new THREE.Vector3(.015,1.85,arm.side*.255).applyMatrix4(rider.matrix),wrist=arm.wrist.position;
  const direction=wrist.clone().sub(shoulder),distance=direction.length();direction.normalize();
  const along=(.44**2-.42**2+distance**2)/(2*distance),height=Math.sqrt(Math.max(0,.44**2-along**2));
  const bend=new THREE.Vector3(-.15,-1,arm.side*.5);bend.addScaledVector(direction,-bend.dot(direction)).normalize();
  const elbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(bend,height);
  for(const [mesh,a,b] of [[arm.upper,shoulder,elbow],[arm.lower,elbow,wrist]]){
   mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());
  }
  arm.shoulder.position.copy(shoulder);arm.elbow.position.copy(elbow);
  const forearm=wrist.clone().sub(elbow).normalize();arm.cuff.position.copy(wrist).addScaledVector(forearm,-.023);arm.cuff.quaternion.setFromUnitVectors(up,forearm);
 }
}
const tail=new THREE.Group();tail.position.set(-.63,1.43,-.03);rider.add(tail);
tube(tail,[[0,0,0],[-.14,.015,0],[-.30,.11,0],[-.37,.13,0]],.085,colors.blue);
const flukeA=ellipsoid(tail,colors.blue,[-.43,.23,0],[.16,.09,.07]);flukeA.rotation.z=-.65;
const flukeB=ellipsoid(tail,colors.blue,[-.48,.09,0],[.15,.09,.07]);flukeB.rotation.z=.20;
const cuff=new THREE.Mesh(new THREE.TorusGeometry(.29,.032,12,48),colors.blue);cuff.rotation.x=Math.PI/2;cuff.scale.set(1.25,1,1);cuff.position.set(-.32,1.32,0);rider.add(cuff);
const legMat=mat('#b9cce4'),shoeMat=mat('#fdf6ef');
const legGeometry = new THREE.CylinderGeometry(.12,.14,1,24);
const shinGeometry = new THREE.CylinderGeometry(.085,.12,1,24);
function createLeg(side){
 const group=new THREE.Group();model.add(group);
 const upper=new THREE.Mesh(legGeometry,legMat),lower=new THREE.Mesh(shinGeometry,legMat);group.add(upper,lower);
 const hip=ellipsoid(group,legMat,[0,0,0],[.14,.14,.14]),knee=ellipsoid(group,legMat,[0,0,0],[.12,.12,.12]);
 const foot=new THREE.Group();group.add(foot);
 const shoe=ellipsoid(foot,shoeMat,[.065,-.018,.005],[.15,.066,.102]);shoe.name=`shoe-${side}`;
 ellipsoid(foot,colors.pink,[.07,.033,.045],[.042,.009,.043]);
 group.traverse(mesh=>{if(mesh.isMesh)mesh.castShadow=mesh.receiveShadow=true;});
 return {upper,lower,hip,knee,foot};
}
const legs=[createLeg(-1),createLeg(1)];
const up=new THREE.Vector3(0,1,0);
function updateLeg(leg,phase,z){
 const hip=new THREE.Vector3(-.36,1.34,z).applyMatrix4(rider.matrix),foot=new THREE.Vector3(-.08+.19*Math.cos(phase)-.035,.6+.19*Math.sin(phase)+.108,z);
 const delta=foot.clone().sub(hip),distance=delta.length(),len=.53;
 const middle=hip.clone().add(foot).multiplyScalar(.5);const bend=new THREE.Vector3(-delta.y,delta.x,0).normalize().multiplyScalar(Math.sqrt(Math.max(0,len*len-distance*distance/4)));const knee=middle.add(bend);
 for(const [mesh,a,b] of [[leg.upper,hip,knee],[leg.lower,knee,foot]]){mesh.position.copy(a).add(b).multiplyScalar(.5);mesh.scale.y=a.distanceTo(b);mesh.quaternion.setFromUnitVectors(up,b.clone().sub(a).normalize());}
 leg.hip.position.copy(hip);leg.knee.position.copy(knee);leg.foot.position.copy(foot);
}

function recolor(texture,kind){
 if(!texture)return null;const c=document.createElement('canvas');const image=texture.image;c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height);const d=pixels.data;
 for(let i=0;i<d.length;i+=4){const l=(d[i]*.25+d[i+1]*.55+d[i+2]*.2)/255;let t=kind==='hair'?Math.max(0,Math.min(1,(l-.16)/.34)):Math.min(1,Math.pow(l,.68)*1.23);const low=kind==='hair'?[28,60,114]:[16,38,86],high=kind==='hair'?[116,175,216]:[122,219,243];for(let k=0;k<3;k++)d[i+k]=low[k]+(high[k]-low[k])*t;}
 ctx.putImageData(pixels,0,0);const out=new THREE.CanvasTexture(c);out.flipY=texture.flipY;out.colorSpace=THREE.SRGBColorSpace;out.anisotropy=8;return out;
}
const head=new THREE.Group();head.position.set(-.08,2.27,.025);head.rotation.y=.65;rider.add(head);
const facialMeshes=[],hairMotion=[],hoodFlippers=[];
function loadHands(gltf){
 let body;gltf.scene.traverse(mesh=>{if(mesh.isSkinnedMesh&&mesh.material?.name==='Body_00_SKIN')body=mesh;});
 if(!body)throw new Error('参考模型缺少手部皮肤网格');
 const position=body.geometry.attributes.position,uv=body.geometry.attributes.uv,index=body.geometry.index;
 for(const arm of armRigs){
  const letter=arm.side===-1?'L':'R',forward=arm.side===-1?1:-1;
  const hand=gltf.scene.getObjectByName(`J_Bip_${letter}_Hand`),inverse=hand.matrixWorld.clone().invert();
  const keep=[];const point=new THREE.Vector3();
  for(let i=0;i<position.count;i++){
   point.fromBufferAttribute(position,i);body.applyBoneTransform(i,point);point.applyMatrix4(body.matrixWorld).applyMatrix4(inverse);
   keep.push(point.x*forward>-.018&&point.x*forward<.22&&Math.abs(point.y)<.1&&Math.abs(point.z)<.12);
  }
  for(const finger of ['Index','Middle','Ring','Little']){
   for(let joint=1;joint<=3;joint++)gltf.scene.getObjectByName(`J_Bip_${letter}_${finger}${joint}`).rotateZ(-forward*[.46,1.08,1.12][joint-1]);
  }
  gltf.scene.getObjectByName(`J_Bip_${letter}_Thumb1`).rotateY(-forward*.18);
  gltf.scene.getObjectByName(`J_Bip_${letter}_Thumb2`).rotateZ(-forward*.58);
  gltf.scene.getObjectByName(`J_Bip_${letter}_Thumb3`).rotateZ(-forward*.65);
  gltf.scene.updateMatrixWorld(true);body.skeleton.update();
  const vertices=[],textureCoordinates=[],vertexMap=new Map();let handIndices=[];
  for(let i=0;i<index.count;i+=3){
   const triangle=[index.getX(i),index.getX(i+1),index.getX(i+2)];if(!triangle.every(vertex=>keep[vertex]))continue;
   for(const vertex of triangle){
    if(!vertexMap.has(vertex)){
     vertexMap.set(vertex,vertices.length/3);point.fromBufferAttribute(position,vertex);body.applyBoneTransform(vertex,point);point.applyMatrix4(body.matrixWorld).applyMatrix4(inverse);
     point.x*=forward;point.z*=forward;
     vertices.push(point.x,point.y,point.z);textureCoordinates.push(uv.getX(vertex),uv.getY(vertex));
    }
    handIndices.push(vertexMap.get(vertex));
   }
  }
  // 细分关节表面后再贴合把套，避免低面数三角形的边穿入圆柱。
  for(let pass=0;pass<2;pass++){
   const edges=new Map(),refined=[];
   function middle(a,b){const key=a<b?`${a}:${b}`:`${b}:${a}`;if(edges.has(key))return edges.get(key);const next=vertices.length/3;for(let k=0;k<3;k++)vertices.push((vertices[a*3+k]+vertices[b*3+k])/2);for(let k=0;k<2;k++)textureCoordinates.push((textureCoordinates[a*2+k]+textureCoordinates[b*2+k])/2);edges.set(key,next);return next;}
   for(let i=0;i<handIndices.length;i+=3){const [a,b,c]=handIndices.slice(i,i+3),ab=middle(a,b),bc=middle(b,c),ca=middle(c,a);refined.push(a,ab,ca,ab,b,bc,ca,bc,c,ab,bc,ca);}
   handIndices=refined;
  }
  for(let i=0;i<vertices.length;i+=3){
   const dx=vertices[i]-handContact.x,dy=vertices[i+1]-handContact.y,distance=Math.hypot(dx,dy),clearance=.024/handScale+.0024;
   if(vertices[i]>.052&&distance<clearance&&distance>1e-7){vertices[i]=handContact.x+dx/distance*clearance;vertices[i+1]=handContact.y+dy/distance*clearance;}
  }
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geometry.setAttribute('uv',new THREE.Float32BufferAttribute(textureCoordinates,2));geometry.setIndex(handIndices);geometry.computeVertexNormals();
  const mesh=new THREE.Mesh(geometry,mat('#fff2e8',{map:body.material.map,roughness:.73}));mesh.name=`gripping-hand-${arm.side}`;mesh.castShadow=mesh.receiveShadow=true;arm.wrist.add(mesh);
 }
}
async function loadHead(){
 const gltf=await new GLTFLoader().loadAsync('./reference.vrm');gltf.scene.updateMatrixWorld(true);gltf.scene.traverse(m=>{if(m.isSkinnedMesh)m.skeleton.update();});
 const extracted=new THREE.Group();const sourceMeshes=[];gltf.scene.traverse(m=>{if(m.isMesh&&(/Face|Eye|Hair/.test(m.material?.name||'')))sourceMeshes.push(m);});
 let faceBounds;
 for(const mesh of sourceMeshes){
  const geometry=mesh.geometry.clone(),base=mesh.geometry.attributes.position;
  const positions=new Float32Array(base.count*3),v=new THREE.Vector3();
  const transform=(point,index)=>{if(mesh.isSkinnedMesh)mesh.applyBoneTransform(index,point);point.applyMatrix4(mesh.matrixWorld);if(/HAIR/.test(mesh.material.name)){if(point.y<1.36){point.z+=(1.36-point.y)*.26;point.y=1.36+(point.y-1.36)*.42;}}else{for(const x of [-.042,.042]){const dx=point.x-x,dy=point.y-1.445;const weight=Math.exp(-Math.pow(dx/.030,2)-Math.pow(dy/.028,2));point.x+=dx*.25*weight;point.y+=dy*.25*weight;}if(point.y<1.425){const t=Math.max(0,Math.min(1,(1.425-point.y)/.10));point.x*=1+.12*Math.sin(t*Math.PI);point.y=1.425+(point.y-1.425)*.90;}}return point;};
  for(let i=0;i<base.count;i++){transform(v.fromBufferAttribute(base,i),i);v.toArray(positions,i*3);}
  geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const morphs=[];const names=[];
  for(const suffix of ['Fcl_EYE_Close','Fcl_MTH_Fun','Fcl_BRW_Fun']){
   const targetName=Object.keys(mesh.morphTargetDictionary||{}).find(n=>n.endsWith(suffix));if(!targetName)continue;
   const target=mesh.geometry.morphAttributes.position[mesh.morphTargetDictionary[targetName]];const values=new Float32Array(positions.length);
   for(let i=0;i<base.count;i++){v.fromBufferAttribute(base,i);v.x+=target.getX(i);v.y+=target.getY(i);v.z+=target.getZ(i);transform(v,i);values[i*3]=v.x-positions[i*3];values[i*3+1]=v.y-positions[i*3+1];values[i*3+2]=v.z-positions[i*3+2];}
   morphs.push(new THREE.BufferAttribute(values,3));names.push(suffix);
  }
  geometry.morphAttributes=morphs.length?{position:morphs}:{};geometry.morphTargetsRelative=true;geometry.deleteAttribute('skinIndex');geometry.deleteAttribute('skinWeight');geometry.computeVertexNormals();geometry.computeBoundingBox();
  const original=mesh.material;const name=original.name;const faceSkin=/Face_00_SKIN/.test(name);const hair=/HAIR/.test(name);const iris=/EyeIris/.test(name);
  const texture=hair?recolor(original.map,'hair'):iris?recolor(original.map,'eye'):original.map;
  const options={map:texture,transparent:original.transparent,alphaTest:Math.max(original.alphaTest,.04),side:THREE.DoubleSide,depthWrite:!original.transparent};
  const material=hair?mat('#ffffff',{...options,roughness:.42,clearcoat:.2}):faceSkin?mat('#ffffff',{...options,roughness:.83}):new THREE.MeshBasicMaterial(options);
  if(/Eyeline|Highlight|Brow|White|Iris|Mouth/.test(name))material.userData.outlineParameters={visible:false};else material.userData.outlineParameters={thickness:.0008,color:[.25,.33,.47]};
  const baked=new THREE.Mesh(geometry,material);baked.name=name;baked.renderOrder=hair?2:faceSkin?0:1;baked.castShadow=hair||faceSkin;baked.receiveShadow=hair||faceSkin;
  if(names.length){baked.morphTargetDictionary=Object.fromEntries(names.map((n,i)=>[n,i]));baked.morphTargetInfluences=names.map(n=>n==='Fcl_MTH_Fun'?.65:n==='Fcl_BRW_Fun'?.25:0);facialMeshes.push(baked);}
  extracted.add(baked);if(hair)hairMotion.push({mesh:baked,base:Float32Array.from(positions)});if(faceSkin)faceBounds=new THREE.Box3().setFromObject(baked);
 }
 window.debug={scene,camera,head,rider,renderer,extracted,THREE};
 const center=faceBounds.getCenter(new THREE.Vector3()),size=faceBounds.getSize(new THREE.Vector3());
 const factor=.66/size.x;extracted.position.copy(center).multiplyScalar(-factor);extracted.scale.setScalar(factor);head.add(extracted);head.scale.set(1.10,.98,1);
 const blushCanvas=document.createElement('canvas');blushCanvas.width=128;blushCanvas.height=64;const blushCtx=blushCanvas.getContext('2d');const blushGradient=blushCtx.createRadialGradient(64,32,0,64,32,60);blushGradient.addColorStop(0,'rgba(235,125,156,.38)');blushGradient.addColorStop(1,'rgba(235,125,156,0)');blushCtx.fillStyle=blushGradient;blushCtx.fillRect(0,0,128,64);const blushMap=new THREE.CanvasTexture(blushCanvas);blushMap.colorSpace=THREE.SRGBColorSpace;for(const x of [-.058,.058]){const m=new THREE.Mesh(new THREE.PlaneGeometry(.058,.025),new THREE.MeshBasicMaterial({map:blushMap,transparent:true,depthWrite:false}));m.position.set(x,1.415,.081);m.material.userData.outlineParameters={visible:false};extracted.add(m);}
 const bow=new THREE.Group();bow.position.set(-.30,-.10,.24);head.add(bow);const bowLeft=ellipsoid(bow,colors.pink,[-.036,0,0],[.045,.025,.017]);bowLeft.rotation.z=-.35;const bowRight=ellipsoid(bow,colors.pink,[.036,0,0],[.045,.025,.017]);bowRight.rotation.z=.35;ellipsoid(bow,colors.cream,[0,0,.005],[.017,.022,.02]);
 window.headInfo={center:center.toArray(),size:size.toArray(),factor,parts:sourceMeshes.map(m=>m.material.name)};
 // 帽兜从脸侧留出开口，让眉眼与发束完整露出。
 const hood=new THREE.Group();head.add(hood);
 const pts=[],normals=[],indices=[];const rows=36,cols=64;
 for(let i=0;i<=rows;i++){const theta=1.05+(Math.PI-1.05)*i/rows;for(let j=0;j<=cols;j++){const phi=j/cols*Math.PI*2;const x=Math.sin(theta)*Math.cos(phi),y=Math.sin(theta)*Math.sin(phi),z=Math.cos(theta);pts.push(x*.49,y*.46+.035,z*.46-.13);normals.push(x,y,z);if(i<rows&&j<cols&&!(y<-.3&&z>.05)){const a=i*(cols+1)+j,b=a+cols+1;indices.push(a,b,a+1,b,b+1,a+1);}}}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(pts,3));geo.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));geo.setIndex(indices);hood.add(new THREE.Mesh(geo,colors.blue));
 // 帽顶是柔软的小鲸鱼，脸侧开口不再使用完整的圆环。
 ellipsoid(hood,colors.blue,[0,.34,.095],[.40,.22,.27]);
 ellipsoid(hood,colors.pale,[0,.22,.33],[.25,.048,.025]);
 tube(hood,[[-.055,.278,.358],[0,.263,.365],[.055,.278,.358]],.004,colors.navy);
 for(const side of [-1,1]){
  const flipper=ellipsoid(hood,colors.blue,[side*.45,-.015,-.06],[.075,.18,.07]);flipper.rotation.z=side*.32;hoodFlippers.push({flipper,side});
  ellipsoid(hood,colors.navy,[side*.29,.34,.275],[.029,.043,.018]);
  ellipsoid(hood,colors.cream,[side*.287,.353,.291],[.009,.012,.006]);
  ellipsoid(hood,colors.pink,[side*.32,.275,.263],[.041,.017,.008]);
 }
 tube(hood,[[0,.54,-.02],[-.02,.59,-.02],[-.06,.61,-.02]],.019,colors.blue);
 tube(hood,[[-.02,.59,-.02],[.035,.61,-.02],[.065,.59,-.02]],.019,colors.blue);
 loadHands(gltf);
}

// 真实地面、远处海面和物体投影提供前后层次。
const world=new THREE.Group();scene.add(world);
const roadMaterial=mat('#dfd6c4',{roughness:.96});
const road=new THREE.Mesh(new THREE.BoxGeometry(24,.20,2.5),roadMaterial);road.position.set(0,-.10,.04);road.receiveShadow=true;world.add(road);
const curbMaterial=mat('#c8c8b9',{roughness:.9});
for(const z of [-1.25,1.31]){const curb=new THREE.Mesh(new THREE.BoxGeometry(24,.12,.13),curbMaterial);curb.position.set(0,-.01,z);curb.receiveShadow=true;world.add(curb);}
const markerMaterial=mat('#f7f3dd',{roughness:1}),markers=[];
const markerSpacing=2*Math.PI*.44*4/10;
for(let i=0;i<21;i++){const marker=new THREE.Mesh(new THREE.PlaneGeometry(.43,.025),markerMaterial);marker.rotation.x=-Math.PI/2;marker.position.set((i-10)*markerSpacing,.004,.94);marker.receiveShadow=true;world.add(marker);markers.push(marker);}
const seaMaterial=mat('#85bac3',{roughness:.27,metalness:.28,transparent:true,opacity:.92});
const seaGeometry=new THREE.PlaneGeometry(70,28,80,35);seaGeometry.rotateX(-Math.PI/2);
const sea=new THREE.Mesh(seaGeometry,seaMaterial);sea.position.set(0,-.30,-15.4);world.add(sea);
const seaBase=Float32Array.from(seaGeometry.attributes.position.array);
const duneMaterial=mat('#a4b9a7');
for(let i=0;i<8;i++)ellipsoid(world,duneMaterial,[-8+i*2.3,-.25,-1.7],[1.8,.22,.75]);
const grassMaterial=mat('#83a99b',{roughness:.95});
for(let i=0;i<18;i++){
 const x=-7+i*.83,z=-1.55-(i%3)*.16;
 for(let blade=0;blade<3;blade++){
  const grass=new THREE.Mesh(new THREE.ConeGeometry(.035,.17+(i%4)*.025,5),grassMaterial);
  grass.position.set(x+blade*.045,.02,z);grass.rotation.z=(blade-1)*.26;world.add(grass);
 }
 if(i%4===0){rod(world,[x,.04,z],[x,.25,z],.009,grassMaterial);ellipsoid(world,colors.cream,[x,.26,z],[.055,.035,.055]);}
}
const cloudMaterial=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:1});
for(const [x,y,z,scale] of [[-11,2.3,-9,.85],[-7,2.8,-10,.7],[-3,2.25,-10,.6]]){
 const cloud=new THREE.Group();cloud.position.set(x,y,z);cloud.scale.setScalar(scale);world.add(cloud);
 for(const [dx,dy,sx,sy] of [[0,0,.65,.20],[-.3,.10,.32,.29],[.10,.22,.38,.38],[.5,.08,.34,.25]]){const puff=ellipsoid(cloud,cloudMaterial,[dx,dy,0],[sx,sy,.30]);puff.castShadow=false;}
}
const sunMaterial=new THREE.MeshBasicMaterial({color:'#fff0ce',transparent:true,toneMapped:false});
const sun=ellipsoid(world,sunMaterial,[-2,2.7,-8],[.40,.40,.40]);sun.castShadow=false;
const moonMaterial=new THREE.MeshBasicMaterial({color:'#e8f1ff',transparent:true,toneMapped:false});
const moon=ellipsoid(world,moonMaterial,[-2.1,2.9,-8],[.32,.32,.32]);moon.castShadow=false;moon.lookAt(camera.position);
const craterMaterial=new THREE.MeshBasicMaterial({color:'#c2d4e8',transparent:true});
for(const [x,y,r] of [[-.1,.06,.055],[.09,-.10,.08],[.1,.12,.035]]){const crater=ellipsoid(moon,craterMaterial,[x,y,.93],[r,r,.018]);crater.castShadow=false;}
const starCanvas=document.createElement('canvas');starCanvas.width=starCanvas.height=32;const starCtx=starCanvas.getContext('2d');const glow=starCtx.createRadialGradient(16,16,0,16,16,16);glow.addColorStop(0,'#fffef4');glow.addColorStop(.15,'#fffef4');glow.addColorStop(.4,'#c4daff80');glow.addColorStop(1,'#b7d5ff00');starCtx.fillStyle=glow;starCtx.fillRect(0,0,32,32);
const starMap=new THREE.CanvasTexture(starCanvas);starMap.colorSpace=THREE.SRGBColorSpace;
const starPositions=[];for(let i=0;i<85;i++){const a=Math.sin(i*127.1+2)*43758.5453,b=Math.sin(i*311.7+5)*24634.6345;starPositions.push((a-Math.floor(a))*24-20,1.9+(b-Math.floor(b))*3,-13-(i%4));}
const starGeometry=new THREE.BufferGeometry();starGeometry.setAttribute('position',new THREE.Float32BufferAttribute(starPositions,3));
const starMaterial=new THREE.PointsMaterial({map:starMap,color:'#edf4ff',size:.20,transparent:true,opacity:0,depthWrite:false,blending:THREE.AdditiveBlending});
const stars=new THREE.Points(starGeometry,starMaterial);world.add(stars);

// 前灯的照明、灯面及透明光束同时随夜色开启。
ellipsoid(model,colors.steel,[.79,1.30,.10],[.085,.07,.07]);
const lampMaterial=mat('#fff3c9',{emissive:'#ffdc95',emissiveIntensity:0,roughness:.3});
ellipsoid(model,lampMaterial,[.86,1.30,.10],[.025,.055,.055]);
const headlamp=new THREE.SpotLight('#ffdfae',0,6,.40,.75,1.3);headlamp.position.set(.89,1.30,.10);headlamp.target.position.set(3.1,.02,.10);model.add(headlamp,headlamp.target);
const beamGeometry=new THREE.ConeGeometry(.33,1.8,32,1,true);beamGeometry.rotateZ(Math.PI/2);beamGeometry.translate(.9,0,0);
const beamMaterial=new THREE.MeshBasicMaterial({color:'#ffe7b5',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide,blending:THREE.AdditiveBlending});
const beam=new THREE.Mesh(beamGeometry,beamMaterial);beam.position.copy(headlamp.position);beam.rotation.z=-.48;model.add(beam);
const rearLampMaterial=mat('#da909b',{emissive:'#ff475e',emissiveIntensity:0});ellipsoid(model,rearLampMaterial,[-1.18,1.04,.02],[.025,.04,.055]);
const lanternMaterial=mat('#e1d2ac',{emissive:'#ffd296',emissiveIntensity:0,roughness:.45});
for(const x of [-3.4,3.6]){
 rod(world,[x,0,-1.1],[x,1.15,-1.1],.035,colors.navy);
 ellipsoid(world,colors.navy,[x,1.2,-1.1],[.14,.06,.14]);ellipsoid(world,lanternMaterial,[x,1.12,-1.1],[.085,.09,.085]);
 const light=new THREE.PointLight('#ffd49b',0,3,2);light.position.set(x,1.11,-1.1);world.add(light);light.userData.lantern=true;
}
const petals=[];for(let i=0;i<6;i++){const material=new THREE.MeshStandardMaterial({color:i%2?'#f2c9d9':'#ffffff',roughness:.8});const m=ellipsoid(world,material,[-2+i*.84,1.1+(i%3)*.65,-.8],[.026,.014,.009]);m.castShadow=false;petals.push(m);}

let currentLighting;
function updateTime(date=new Date()){
 const time=beijingTime(date),state=lightingAtHour(previewHour??time.hour);currentLighting=state;
 const root=document.documentElement.style;
 for(const [property,value] of [['--sky-top',state.top],['--sky-bottom',state.bottom],['--ink',state.text],['--muted',state.muted],['--accent',state.accent]])root.setProperty(property,value);
 ambient.color.set(state.sky);ambient.groundColor.set(state.ground);ambient.intensity=state.ambient;
 key.color.set(state.sun);key.intensity=state.key;key.position.set(-3.6+state.day*1.3,3.1+state.day*2.3,3.9);
 fill.color.set(state.sky);fill.intensity=.45+(1-state.day)*.55;scene.environmentIntensity=state.environment;
 seaMaterial.color.set(state.sea);roadMaterial.color.set(state.road);curbMaterial.color.set(state.road).multiplyScalar(.88);
 sunMaterial.opacity=THREE.MathUtils.smoothstep(state.day,.2,.6);sunMaterial.color.set('#ffae79').lerp(new THREE.Color('#fff2c7'),state.day);sun.visible=sunMaterial.opacity>.01;sun.position.y=1.5+state.day*1.2;
 const moonOpacity=THREE.MathUtils.smoothstep(state.stars,.65,.95);moon.visible=moonOpacity>.01;moonMaterial.opacity=moonOpacity;craterMaterial.opacity=moonOpacity*.7;
 starMaterial.opacity=state.stars;cloudMaterial.color.set('#8092b3').lerp(new THREE.Color('#ffffff'),state.day);
 headlamp.intensity=state.lamp*6;lampMaterial.emissiveIntensity=state.lamp*2.8;beamMaterial.opacity=state.lamp*.045;rearLampMaterial.emissiveIntensity=state.lamp*3;
 lanternMaterial.emissiveIntensity=state.lamp*2.5;world.children.filter(obj=>obj.userData.lantern).forEach(light=>light.intensity=state.lamp*2);
 for(const mesh of facialMeshes)if(mesh.material.isMeshBasicMaterial)mesh.material.color.set(state.day<.2?'#bdcee5':'#ffffff');
 const display=previewHour===null?time.label:`${String(Math.floor(state.hour)).padStart(2,'0')}:${String(Math.floor(state.hour%1*60)).padStart(2,'0')}`;
 document.querySelector('#clock').textContent=display;document.querySelector('#clock').dateTime=time.iso;
 document.querySelector('#time-icon').textContent=state.phase==='night'?'☾':state.phase==='dusk'?'◒':'☀';
 document.querySelector('meta[name="theme-color"]').content=state.top;
 window.dayNightState={...state,timeZone:'Asia/Shanghai',mode:previewHour===null?'live':'preview',clock:display};
}
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)');
let paused=reducedMotion.matches,elapsed=0,lastFrame=null;
const pauseButton=document.querySelector('#pause');
function updatePauseButton(){pauseButton.textContent=paused?'播放':'暂停';pauseButton.setAttribute('aria-label',paused?'播放骑行动画':'暂停骑行动画');pauseButton.setAttribute('aria-pressed',String(paused));}
updatePauseButton();
pauseButton.addEventListener('click',()=>{paused=!paused;updatePauseButton();});
reducedMotion.addEventListener('change',event=>{paused=event.matches;updatePauseButton();});
document.querySelector('#reset').addEventListener('click',resetView);

const pelvisPivot=new THREE.Vector3(-.36,1.34,0);
function updateRidingPose(phase){
 const sway=Math.sin(phase),push=Math.cos(phase*2);
 rider.rotation.set(.065*sway,.014*sway,-.075+.028*push);
 rider.position.copy(pelvisPivot).sub(pelvisPivot.clone().applyQuaternion(rider.quaternion));
 rider.position.x+=.008*push;rider.position.y+=.006*(1-push);rider.position.z+=.015*sway;
 rider.updateMatrix();
 updateArms();
 head.rotation.x=-rider.rotation.x*.65+.008*Math.sin(phase-.35);
 head.rotation.y=.65+.025*Math.sin(phase/3);
 head.rotation.z=-rider.rotation.z*.55+.009*Math.sin(phase*2-.25);
 tail.rotation.z=.10*Math.sin(phase-.75);tail.rotation.x=.08*Math.sin(phase-.9);
 for(const {flipper,side} of hoodFlippers)flipper.rotation.z=side*(.32+.065*Math.sin(phase-.6));
 for(const {mesh,base} of hairMotion){
  const position=mesh.geometry.attributes.position;
  for(let i=0;i<position.count;i++){
   const weight=THREE.MathUtils.clamp((1.44-base[i*3+1])/.12,0,1);
   position.setXYZ(i,base[i*3]+.006*weight*Math.sin(phase-.8),base[i*3+1],base[i*3+2]+.004*weight*Math.sin(phase-1.1));
  }
  position.needsUpdate=true;
 }
}
window.renderAt=function(ms){
 const t=((ms%5400)+5400)%5400/1000,phase=-t/1.8*Math.PI*2;
 for(const wheel of animatedWheels)wheel.rotation.z=-t/1.35*Math.PI*2;
 chainring.rotation.z=phase;
 for(const {arm,platform,side} of crankArms){const angle=phase+(side===1?Math.PI:0);arm.rotation.z=angle;platform.rotation.z=-angle;}
 updateRidingPose(phase);
 updateLeg(legs[0],phase,-.27);updateLeg(legs[1],phase+Math.PI,.27);
 const blink=Math.max(0,1-Math.abs(t-2.4)/.11);
 for(const mesh of facialMeshes){const index=mesh.morphTargetDictionary.Fcl_EYE_Close;if(index!==undefined)mesh.morphTargetInfluences[index]=blink;}
 const distance=t/1.35*Math.PI*2*.44;
 markers.forEach((marker,i)=>marker.position.x=(i-10)*markerSpacing-distance%markerSpacing);
 for(let i=0;i<petals.length;i++){petals[i].position.y=1.1+(i%3)*.65+Math.sin(t/5.4*Math.PI*2+i)*.12;petals[i].rotation.z=t/5.4*Math.PI*2+i;}
 const water=seaGeometry.attributes.position;
 for(let i=0;i<water.count;i++){const x=seaBase[i*3],z=seaBase[i*3+2];water.setY(i,Math.sin(x*.8+z*1.7-t/5.4*Math.PI*2)*.035+Math.sin(z*2.6+t/5.4*Math.PI*4)*.015);}
 water.needsUpdate=true;seaGeometry.computeVertexNormals();
 starMaterial.opacity=(currentLighting?.stars??0)*(.88+.12*Math.sin(t/5.4*Math.PI*2));
 controls.update();renderer.render(scene,camera);
 window.motionState={crankAngle:phase,wheelAngle:animatedWheels[0].rotation.z,roadOffset:-distance,pedalX:-.08+.19*Math.cos(phase),pedalY:.6+.19*Math.sin(phase),paused,elapsed:ms};
};
window.refreshTime=()=>updateTime();
updateTime();
setInterval(()=>updateTime(),1000);
document.addEventListener('visibilitychange',()=>{lastFrame=null;if(!document.hidden)updateTime();});
try{
 await loadHead();model.traverse(mesh=>{if(mesh.isMesh&&!mesh.material.transparent){mesh.castShadow=mesh.receiveShadow=true;}});
 updateTime();window.renderAt(0);window.ready=true;document.querySelector('#loading').hidden=true;
 Object.assign(window.debug,{controls,resetView,world,headlamp,key,ambient});
 if(!capture)renderer.setAnimationLoop(ms=>{if(lastFrame!==null&&!paused&&!document.hidden)elapsed+=Math.min(ms-lastFrame,100);lastFrame=ms;window.renderAt(elapsed);});
}catch(error){document.querySelector('#loading').hidden=true;document.querySelector('#error').hidden=false;window.renderError=String(error);console.error(error);}
