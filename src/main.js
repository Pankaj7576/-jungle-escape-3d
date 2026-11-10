import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makePBRMaterial } from './pbr-textures.js';
import './style.css';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x596b58);
scene.fog = new THREE.FogExp2(0x596b58, 0.0095);
const camera = new THREE.PerspectiveCamera(innerHeight > innerWidth ? 64 : 58, innerWidth/innerHeight, .1, 180);
camera.position.set(0,4.25,8.8);
const renderer = new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
const qualityPresets={low:{pixelRatio:1,shadows:false,shadowSize:512},medium:{pixelRatio:1.25,shadows:true,shadowSize:1024},high:{pixelRatio:1.5,shadows:true,shadowSize:1536}};
const savedQuality=localStorage.getItem('lostTempleGraphics');
let graphicsQuality=Object.hasOwn(qualityPresets,savedQuality)?savedQuality:'medium';
function applyGraphicsQuality(){const q=qualityPresets[graphicsQuality]||qualityPresets.medium;renderer.setPixelRatio(Math.min(devicePixelRatio||1,q.pixelRatio));renderer.shadowMap.enabled=q.shadows;sun.shadow.mapSize.set(q.shadowSize,q.shadowSize);sun.shadow.needsUpdate=true;scene.traverse(o=>{if(o.isMesh&&o.userData.qualityShadow)o.castShadow=q.shadows;});}
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.12;
$('app').prepend(renderer.domElement);

scene.add(new THREE.HemisphereLight(0xc6d1c1,0x211e17,.82));
const sun = new THREE.DirectionalLight(0xffd39a,2.05);
sun.position.set(-12,24,10); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;
scene.add(sun);
applyGraphicsQuality();
const fill = new THREE.DirectionalLight(0x81968b,.22); fill.position.set(8,8,-12);scene.add(fill);
const bounce = new THREE.DirectionalLight(0xb2a17b,.28); bounce.position.set(0,5,12);scene.add(bounce);

const mat=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
const M={
 soil:makePBRMaterial(0x514633,1,{repeat:9,roughness:1,bumpScale:.055,anisotropy}),
 path:makePBRMaterial(0x75664e,2,{repeat:5,roughness:.96,bumpScale:.045,anisotropy}),
 stone:makePBRMaterial(0x766e5e,3,{repeat:4,roughness:.94,bumpScale:.065,anisotropy}),
 stoneDark:makePBRMaterial(0x454238,4,{repeat:4,roughness:.98,bumpScale:.06,anisotropy}),
 bark:makePBRMaterial(0x39291e,5,{repeat:3,roughness:1,bumpScale:.055,anisotropy}),
 moss:makePBRMaterial(0x34432d,6,{repeat:4,roughness:1,bumpScale:.045,anisotropy}),
 edge:mat(0x373329),leaf:mat(0x203d29),leaf2:mat(0x38543a),
 gold:mat(0xe7b83f,.28,.72),water:mat(0x3b8987,.22,.2),cloth:mat(0x52634a),pants:mat(0x393b32),
 skin:mat(0x9c6848),leather:mat(0x3b2920),monster:mat(0x283c2c),monster2:mat(0x43543a),
 templeInterior:mat(0x171c16),gap:mat(0x171b16),monsterEye:mat(0xe4b94f,.25),
 fire:new THREE.MeshBasicMaterial({color:0xffa33b})
};
const boxGeo=new THREE.BoxGeometry(1,1,1);
const sphereGeometries=new Map(),cylinderGeometries=new Map(),coneGeometries=new Map();
const keyOf=(...values)=>values.map(v=>Number(v).toFixed(3)).join(':');
function getSphereGeometry(detail=1){const key=detail===1?'16:12':'10:8';if(!sphereGeometries.has(key))sphereGeometries.set(key,new THREE.SphereGeometry(1,...(detail===1?[16,12]:[10,8])));return sphereGeometries.get(key)}
function getCylinderGeometry(rt,rb,h,segments){const key=keyOf(rt,rb,h,segments);if(!cylinderGeometries.has(key))cylinderGeometries.set(key,new THREE.CylinderGeometry(rt,rb,h,segments));return cylinderGeometries.get(key)}
function getConeGeometry(r,h,segments){const key=keyOf(r,h,segments);if(!coneGeometries.has(key))coneGeometries.set(key,new THREE.ConeGeometry(r,h,segments));return coneGeometries.get(key)}

function capsuleBetween(parent,material,a,b,radius,radial=12){
 const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b),delta=bv.clone().sub(av);
 const mesh=new THREE.Mesh(new THREE.CapsuleGeometry(radius,Math.max(.02,delta.length()-radius*2),4,radial),material);
 mesh.position.copy(av).add(bv).multiplyScalar(.5);
 mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());
 mesh.castShadow=graphicsQuality!=='low';mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function lathe(parent,material,x,y,z,profile,segments=32){
 const points=profile.map(([r,h])=>new THREE.Vector2(r,h));
 const mesh=new THREE.Mesh(new THREE.LatheGeometry(points,segments),material);
 mesh.position.set(x,y,z);mesh.castShadow=graphicsQuality!=='low';mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
function tube(parent,material,points,radius,segments=32,radial=8){
 const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
 const mesh=new THREE.Mesh(new THREE.TubeGeometry(curve,segments,radius,radial,false),material);
 mesh.castShadow=graphicsQuality!=='low';mesh.receiveShadow=true;parent.add(mesh);return mesh;
}
const leafShape=new THREE.Shape();
leafShape.moveTo(0,-.55);leafShape.quadraticCurveTo(.34,-.12,0,.58);leafShape.quadraticCurveTo(-.34,-.12,0,-.55);
const leafGeo=new THREE.ShapeGeometry(leafShape,5);leafGeo.computeVertexNormals();
const leafMat=new THREE.MeshStandardMaterial({color:0x54784a,roughness:.86,side:THREE.DoubleSide});

function box(parent,material,x,y,z,sx,sy,sz,castShadow=false){const m=new THREE.Mesh(boxGeo,material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=castShadow;m.receiveShadow=true;parent.add(m);return m}
function sphere(parent,material,x,y,z,sx,sy,sz,detail=1,castShadow=false){const m=new THREE.Mesh(getSphereGeometry(detail),material);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=castShadow;parent.add(m);return m}
function cyl(parent,material,x,y,z,rt,rb,h,segments=10,castShadow=false){const m=new THREE.Mesh(getCylinderGeometry(rt,rb,h,segments),material);m.position.set(x,y,z);m.castShadow=castShadow;m.receiveShadow=true;parent.add(m);return m}
function cone(parent,material,x,y,z,r,h,segments=8,castShadow=false){const m=new THREE.Mesh(getConeGeometry(r,h,segments),material);m.position.set(x,y,z);m.castShadow=castShadow;parent.add(m);return m}

const ground= new THREE.Mesh(new THREE.PlaneGeometry(220,220),M.soil);ground.rotation.x=-Math.PI/2;ground.position.set(0,-.22,-55);ground.receiveShadow=true;scene.add(ground);
const world=new THREE.Group();scene.add(world);
const segments=[];
const laneX=[-2.35,0,2.35];

function makeTree(parent,x,z,scale=1){
 const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(scale);parent.add(g);
 lathe(g,M.bark,0,0,0,[[.24,0],[.34,.18],[.27,.55],[.22,1.25],[.18,2],[.14,2.8],[.09,3.65],[.025,4.25],[0,4.35]],18);
 for(let i=0;i<5;i++){const a=i*Math.PI*2/5+.3,dx=Math.cos(a),dz=Math.sin(a);tube(g,M.bark,[[0,.38,0],[dx*.25,.22,dz*.25],[dx*.62,.08,dz*.62],[dx*.92,.035,dz*.92]],.105,12,7)}
 for(let i=0;i<7;i++){const a=i*2.399,dx=Math.cos(a),dz=Math.sin(a),h=2.55+(i%3)*.34;const end=[dx*(1.1+(i%2)*.35),h+.7,dz*(1.1+(i%2)*.35)];tube(g,M.bark,[[0,h*.62,0],[dx*.35,h+.15,dz*.35],[dx*.78,h+.48,dz*.78],end],.085-(i%3)*.012,18,7)}
 const count=185,leaves=new THREE.InstancedMesh(leafGeo,leafMat,count),dummy=new THREE.Object3D();leaves.frustumCulled=false;
 for(let i=0;i<count;i++){const a=i*2.399,rad=.55+Math.sqrt((i+.5)/count)*1.65,y=3.45+Math.sin(i*1.73)*.78+Math.cos(a*2)*.18;dummy.position.set(Math.cos(a)*rad,y,Math.sin(a)*rad);dummy.rotation.set((Math.random()-.5)*1.25,a+(Math.random()-.5)*.8,(Math.random()-.5)*1.1);const sz=.42+Math.random()*.52;dummy.scale.set(sz*.68,sz,sz*.08);dummy.updateMatrix();leaves.setMatrixAt(i,dummy.matrix);leaves.setColorAt(i,new THREE.Color().setHSL(.25+Math.random()*.07,.27+Math.random()*.22,.22+Math.random()*.15))}
 leaves.instanceMatrix.needsUpdate=true;if(leaves.instanceColor)leaves.instanceColor.needsUpdate=true;leaves.castShadow=graphicsQuality!=='low';leaves.receiveShadow=true;leaves.userData.qualityShadow=true;g.add(leaves);
 for(let i=0;i<4;i++){const a=i*1.57+.2,xx=Math.cos(a),zz=Math.sin(a);tube(g,M.moss,[[xx*.7,4.1,zz*.7],[xx*.9,3.2,zz*.9],[xx*.84,2.3,zz*.84]],.018,12,5)}
 return g;
}
function makeTemple(parent,z){
 const g=new THREE.Group();g.position.z=z;parent.add(g);
 const base=new THREE.Mesh(new THREE.BoxGeometry(8.6,.58,8.6),M.stone);base.position.set(0,.29,-5.5);base.castShadow=true;base.receiveShadow=true;g.add(base);
 for(let level=0;level<3;level++){const stair=new THREE.Mesh(new THREE.BoxGeometry(5.2-level*.7,.16,.72),M.stoneDark);stair.position.set(0,.66+level*.16,-1.12-level*.5);stair.castShadow=true;g.add(stair)}
 const sanctum=new THREE.Mesh(new THREE.BoxGeometry(4.15,3.35,3.65),M.stone);sanctum.position.set(0,2.22,-7.05);sanctum.castShadow=true;sanctum.receiveShadow=true;g.add(sanctum);
 for(const x of [-2.18,2.18])for(const zz of [-8.55,-5.6])lathe(g,M.stoneDark,x,.72,zz,[[.16,0],[.22,.12],[.17,.28],[.13,1.6],[.19,1.78],[.23,1.9],[.12,2.05],[0,2.05]],20);
 box(g,M.templeInterior,0,1.72,-5.19,1.42,2.25,.08);
 for(const x of [-.86,.86]){lathe(g,M.stoneDark,x,.62,-5.12,[[.12,0],[.17,.12],[.13,.25],[.12,1.9],[.19,2.05],[.14,2.18],[0,2.18]],20);for(let k=0;k<4;k++)sphere(g,M.stone,x,1+k*.38,-4.98,.11,.12,.09,1,true)}
 const archShape=new THREE.Shape();archShape.moveTo(-.82,0);archShape.lineTo(-.82,1.7);archShape.absarc(0,1.7,.82,Math.PI,0,true);archShape.lineTo(.82,0);archShape.lineTo(.58,0);archShape.lineTo(.58,1.7);archShape.absarc(0,1.7,.58,0,Math.PI,false);archShape.lineTo(-.58,0);archShape.closePath();
 const arch=new THREE.Mesh(new THREE.ExtrudeGeometry(archShape,{depth:.12,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.035,bevelThickness:.035}),M.stoneDark);arch.position.set(0,.66,-5.28);arch.castShadow=true;g.add(arch);
 for(const x of [-3.05,-1.05,1.05,3.05])for(const zz of [-3.15,-1.35]){
  lathe(g,M.stone,x,.72,zz,[[.34,0],[.43,.12],[.28,.25],[.2,.42],[.17,1.35],[.23,1.55],[.34,1.72],[.42,1.84],[.28,1.98],[0,1.98]],24);
  for(let k=0;k<3;k++){const ring=new THREE.Mesh(new THREE.TorusGeometry(k===1?.3:.38,.045,8,24),M.stoneDark);ring.position.set(x,.95+k*.47,zz);ring.rotation.x=Math.PI/2;g.add(ring)}
 }
 for(let k=0;k<4;k++){const roof=new THREE.Mesh(new THREE.CylinderGeometry(3.65-k*.56,4.1-k*.56,.22,4,1),k%2?M.stone:M.stoneDark);roof.rotation.y=Math.PI/4;roof.position.set(0,2.86+k*.23,-2.15);roof.castShadow=true;roof.receiveShadow=true;g.add(roof)}
 const towerProfile=[[0,0],[1.92,0],[2.02,.18],[1.88,.42],[1.78,.78],[1.65,1.18],[1.48,1.62],[1.28,2.08],[1.08,2.55],[.86,3.03],[.65,3.48],[.43,3.88],[.22,4.22],[0,4.42]];
 lathe(g,M.stone,0,3.48,-7.1,towerProfile,48);
 for(let k=0;k<7;k++){const y=3.82+k*.52,rad=1.88-k*.235;const band=new THREE.Mesh(new THREE.TorusGeometry(rad,.055,8,48),M.stoneDark);band.position.set(0,y,-7.1);band.rotation.x=Math.PI/2;g.add(band)}
 for(let i=0;i<12;i++){const a=i*Math.PI/6,pts=[];for(let k=0;k<8;k++){const y=3.58+k*.53,rad=1.9-k*.235;pts.push([Math.cos(a)*rad,y,-7.1+Math.sin(a)*rad])}tube(g,M.stoneDark,pts,.035,24,5)}
 for(const x of [-1.55,1.55])for(const zz of [-8.15,-6.05])lathe(g,M.stoneDark,x,4.05,zz,[[0,0],[.34,0],[.38,.12],[.31,.35],[.24,.62],[.14,.9],[.04,1.16],[0,1.22]],20);
 lathe(g,M.stoneDark,0,7.83,-7.1,[[0,0],[.56,0],[.7,.1],[.78,.22],[.72,.34],[.58,.43],[0,.43]],40);
 for(let i=0;i<16;i++){const a=i*Math.PI/8;sphere(g,M.stone,Math.cos(a)*.62,8.05,-7.1+Math.sin(a)*.62,.09,.2,.09,1,true)}
 lathe(g,M.stone,0,8.25,-7.1,[[.18,0],[.23,.1],[.16,.25],[.1,.36],[.16,.45],[.11,.58],[0,.75]],24);
 for(const x of [-1.45,1.45]){box(g,M.stoneDark,x,2.05,-5.17,.72,1.38,.16);box(g,M.stone,x,2.05,-5.06,.52,1.15,.08);sphere(g,M.stoneDark,x,2.15,-4.98,.19,.32,.08,1,true)}
 for(let i=0;i<9;i++){const b=new THREE.Mesh(new THREE.DodecahedronGeometry(.32+Math.random()*.3,1),i%2?M.stone:M.stoneDark);b.position.set(-4.5+Math.random()*9,.22+Math.random()*.12,-1.2-Math.random()*7);b.rotation.set(Math.random(),Math.random(),Math.random());b.castShadow=true;g.add(b)}
 g.traverse(o=>{if(o.isMesh){o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true}});return g;
}

function buildSegment(z,index){
 const g=new THREE.Group();g.position.z=z;world.add(g);
 // A raised, uneven flagstone causeway with dark joints and worn side kerbs.
 box(g,M.path,0,-.13,-12,7.35,.42,27);
 for(const x of [-3.78,3.78]){
  box(g,M.stoneDark,x,-.02,-12,.48,.62,27);
  for(let k=0;k<12;k++)box(g,M.stone,x,-.25,-k*2.25-1,.52,.22,1.9);
 }
 for(let i=0;i<13;i++)for(let j=0;j<3;j++){
  if(Math.random()<.13)continue;
  const x=(j-1)*2.36+(Math.random()-.5)*.18,zp=-i*2.08-1;
  const slab=box(g,(i+j)%4===0?M.stoneDark:M.stone,x,-.0,zp,2.24+(Math.random()-.5)*.12,.10,1.94);
  slab.rotation.y=(Math.random()-.5)*.025;
  if(Math.random()<.22){const crack=box(g,M.edge,x+(Math.random()-.5)*.8,.055,zp,.018,.012,1.3);crack.rotation.y=Math.random()*.3}
 }
 // Ancient retaining walls and scattered ruins frame the playable lane.
 for(const side of [-1,1]){
  if(index%2===0){box(g,M.stoneDark,side*5.0,.8,-13,.65,1.65,24);for(let k=0;k<5;k++)box(g,M.stone,side*5.0,1.7,-3-k*4,.78,.18,1.2)}
  for(let i=0;i<3;i++){const ruin=box(g,M.stone,side*(4.7+Math.random()*1.1),.42,-4-i*8,.9,.82,1.0,true);ruin.rotation.z=(Math.random()-.5)*.18;ruin.rotation.y=Math.random()*.5}
 }
 if(index%3===0)makeTemple(g,-13);
 if(index%4===1){
  box(g,M.water,6.5,-.24,-12,4.8,.09,27);
  for(let k=0;k<7;k++){const stepping=box(g,M.stone,4.9,-.02,-4-k*3.5,1.1,.34,1.35,true);stepping.rotation.y=(Math.random()-.5)*.08}
 }
 for(const side of [-1,1])for(let i=0;i<5;i++)makeTree(g,side*(6.2+Math.random()*4.0),-i*5.0-2,.8+Math.random()*.62);
 // Fern-like undergrowth at the jungle edge.
 for(const side of [-1,1])for(let i=0;i<7;i++){
  const x=side*(4.6+Math.random()*2.5),zz=-Math.random()*25;
  for(let leaf=0;leaf<4;leaf++){const frond=cyl(g,M.leaf,x,.22+leaf*.035,zz,.018,.035,.9,5);frond.rotation.z=(leaf-1.5)*.32+side*.5}
 }
 for(const side of [-1,1]){const cliff=cone(g,M.moss,side*14,3,-18,6,9,9);cliff.rotation.z=side*.12}
 // Weathered stone oil-lamp pillars, not bright arcade torches.
 for(const x of [-3.45,3.45]){
  box(g,M.stoneDark,x,.32,-8,.42,.64,.42);
  cyl(g,M.stone,x,.82,-8,.2,.24,.38,10);
  const flame=sphere(g,M.fire,x,1.12,-8,.075,.16,.075,0);
  flame.userData.flame=true;
 }
 return g;
}
for(let i=0;i<7;i++)segments.push(buildSegment(-i*25,i));


function makeHero(){
 const g=new THREE.Group(),arms=[],legs=[];
 capsuleBetween(g,M.pants,[-.16,.62,0],[-.16,.25,0],.115);capsuleBetween(g,M.pants,[.16,.62,0],[.16,.25,0],.115);
 capsuleBetween(g,M.leather,[-.16,.18,-.04],[-.16,.06,-.25],.14);capsuleBetween(g,M.leather,[.16,.18,-.04],[.16,.06,-.25],.14);
 sphere(g,M.cloth,0,1.12,0,.31,.48,.205);sphere(g,M.leather,0,1.25,-.105,.285,.34,.13);
 for(const x of [-1,1]){sphere(g,M.cloth,x*.29,1.42,0,.16,.18,.17);const a=capsuleBetween(g,M.cloth,[x*.31,1.39,0],[x*.43,1.05,-.01],.105);const b=capsuleBetween(g,M.cloth,[x*.43,1.05,-.01],[x*.39,.76,-.09],.09);capsuleBetween(g,M.leather,[x*.39,.78,-.09],[x*.4,.66,-.12],.085);arms.push(a,b);capsuleBetween(g,M.leather,[x*.43,1.02,-.02],[x*.39,.82,-.07],.105);const strap=box(g,M.leather,x*.1,1.27,-.22,.055,.55,.025);strap.rotation.z=-x*.27}
 const belt=new THREE.Mesh(new THREE.TorusGeometry(.235,.045,8,32),M.leather);belt.position.set(0,.79,0);belt.rotation.x=Math.PI/2;g.add(belt);box(g,M.gold,0,.8,-.205,.11,.1,.025);box(g,M.leather,-.31,.83,.08,.18,.2,.16);
 capsuleBetween(g,M.skin,[0,1.48,0],[0,1.62,0],.095);sphere(g,M.skin,0,1.79,-.015,.205,.265,.19);sphere(g,M.leather,0,1.94,.015,.218,.145,.205);
 for(const x of [-.19,.19])sphere(g,M.skin,x,1.79,0,.055,.09,.055);
 for(const x of [-.075,.075]){sphere(g,M.templeInterior,x,1.82,-.188,.027,.024,.012,1);capsuleBetween(g,M.leather,[x-.035,1.88,-.17],[x+.035,1.88,-.17],.025)}
 sphere(g,M.skin,0,1.76,-.205,.035,.065,.04);sphere(g,M.leather,0,1.69,-.18,.105,.035,.035);
 for(let i=0;i<7;i++){const x=(i-3)*.055;capsuleBetween(g,M.leather,[x,1.98,.06],[x*.9,1.82,.22],.045)}
 box(g,M.leather,0,1.18,.23,.37,.46,.18);capsuleBetween(g,M.stoneDark,[-.19,1.43,.24],[.19,1.43,.24],.09);
 g.userData.arms=arms;g.userData.legs=legs;g.traverse(o=>{if(o.isMesh){o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true}});return g;
}

const hero=makeHero();hero.position.set(0,0,2.4);scene.add(hero);
const gltfLoader=new GLTFLoader();
const animationMixers=[];
const characterControllers=[];
function attachAnimatedGLB(url,parent,{targetHeight=1.75,position=[0,0,0],rotationY=0,fallbackChildren=[]}={}){
 const holder=new THREE.Group();holder.position.set(...position);holder.rotation.y=rotationY;parent.add(holder);
 const controller={mixer:null,actions:{},current:null,model:null,loaded:false,failed:false,state:'run'};
 gltfLoader.load(url,gltf=>{
  const model=gltf.scene;
  let hasSkin=false;model.traverse(o=>{if(o.isSkinnedMesh)hasSkin=true});
  if(!hasSkin||!gltf.animations?.length){controller.failed=true;console.warn(`[GLB] ${url} must contain a skinned mesh and at least one animation clip; procedural fallback remains active.`);return;}
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3());
  if(size.y>0){model.scale.multiplyScalar(targetHeight/size.y);model.updateMatrixWorld(true)}
  const fitted=new THREE.Box3().setFromObject(model);
  const center=fitted.getCenter(new THREE.Vector3());
  model.position.x-=center.x;model.position.z-=center.z;model.position.y-=fitted.min.y;
  model.traverse(o=>{
   if(!o.isMesh)return;
   o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true;o.receiveShadow=false;
   if(o.material){const materials=Array.isArray(o.material)?o.material:[o.material];for(const material of materials){material.roughness=Math.max(material.roughness??.8,.5);material.metalness=Math.min(material.metalness??0,.35)}}
  });
  holder.add(model);controller.model=model;controller.loaded=true;
  fallbackChildren.forEach(o=>o.visible=false);
  if(gltf.animations?.length){
   controller.mixer=new THREE.AnimationMixer(model);
   gltf.animations.forEach(clip=>{const action=controller.mixer.clipAction(clip);controller.actions[clip.name.toLowerCase()]=action});
   animationMixers.push(controller.mixer);
  }
  playCharacterAnimation(controller,controller.state);
  console.info(`[GLB] Loaded ${url}; ${Math.round(size.y*100)/100}m source height; clips: ${gltf.animations.map(a=>a.name).join(', ')||'none'}`);
 },event=>{
  if(event.total)console.info(`[GLB] ${url}: ${Math.round(event.loaded/event.total*100)}%`);
 },error=>{controller.failed=true;console.warn(`[GLB] Could not load ${url}; procedural fallback remains active.`,error)});
 characterControllers.push(controller);return controller;
}
function playCharacterAnimation(controller,state){
 if(!controller)return;
 controller.state=state;
 if(!controller.mixer)return;
 const patterns={run:/run|jog|sprint/,jump:/jump|leap/,slide:/slide|crouch|roll/,idle:/idle|breath|stand/};
 const keys=Object.keys(controller.actions);
 const key=keys.find(k=>patterns[state]?.test(k))||(state==='run'?keys.find(k=>/walk/.test(k)):null);
 // If a model has no jump/slide clip, keep the last valid locomotion action instead of
 // restarting the run clip every frame.
 if(!key)return;
 const next=controller.actions[key];if(controller.current===next)return;
 next.enabled=true;next.reset();next.setEffectiveTimeScale(1);next.setEffectiveWeight(1);
 if(state==='jump'||state==='slide'){next.setLoop(THREE.LoopOnce,1);next.clampWhenFinished=true;}else{next.setLoop(THREE.LoopRepeat,Infinity);next.clampWhenFinished=false;}
 next.fadeIn(.18).play();controller.current?.fadeOut(.18);controller.current=next;
}
const heroController=attachAnimatedGLB('/assets/models/hero.glb',hero,{targetHeight:1.72,position:[0,0,0],fallbackChildren:[...hero.children]});

const guardian=new THREE.Group(),guardianArms=[],guardianLegs=[];
sphere(guardian,M.monster,0,1.38,.04,.53,.68,.38);sphere(guardian,M.monster2,0,1.78,-.12,.4,.42,.34);sphere(guardian,M.monster,0,1.51,-.39,.34,.27,.22);sphere(guardian,M.monster2,0,1.34,-.48,.27,.14,.12);
for(const side of [-1,1]){
 const x=side;sphere(guardian,M.monster2,x*.48,1.72,.02,.31,.34,.32);
 const upper=capsuleBetween(guardian,M.monster,x*.48?[x*.48,1.68,.02]:[0,1.68,.02],[x*.72,1.08,-.02],.22);
 const fore=capsuleBetween(guardian,M.monster2,[x*.72,1.08,-.02],[x*.82,.48,-.2],.17);sphere(guardian,M.monster,x*.82,.4,-.2,.19,.2,.15);guardianArms.push(upper,fore);
 for(let claw=0;claw<4;claw++){const fx=x*.82+(claw-1.5)*.085;capsuleBetween(guardian,M.stoneDark,[fx,.35,-.27],[fx,.15,-.36],.035,8)}
 const thigh=capsuleBetween(guardian,M.monster,[x*.22,.88,.05],[x*.3,.42,.02],.19),shin=capsuleBetween(guardian,M.monster2,[x*.3,.42,.02],[x*.34,.12,-.08],.13);sphere(guardian,M.monster,x*.34,.12,-.2,.19,.12,.3);guardianLegs.push(thigh,shin);
 lathe(guardian,M.stoneDark,x*.22,1.18,-.54,[[0,0],[.08,.12],[.055,.25],[.025,.39],[0,.48]],12);
 tube(guardian,M.monster,[[x*.25,1.98,-.04],[x*.42,2.12,.03],[x*.53,2.38,.12],[x*.47,2.53,.13]],.085,14,8);
}
for(let i=0;i<9;i++){const x=(i-4)*.105;tube(guardian,M.monster2,[[x,1.95,.16],[x*1.12,2.12,.26],[x*1.25,2.26,.3]],.055,10,6)}
for(const x of [-.13,.13]){sphere(guardian,M.monsterEye,x,1.83,-.445,.055,.045,.025,1);capsuleBetween(guardian,M.monster,[x-.09,1.93,-.4],[x+.09,1.94,-.4],.065)}
guardian.traverse(o=>{if(o.isMesh){o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true}});guardian.position.set(0,0,7.3);scene.add(guardian);

const guardianController=attachAnimatedGLB('/assets/models/guardian.glb',guardian,{targetHeight:2.05,position:[0,0,0],fallbackChildren:[...guardian.children]});
applyGraphicsQuality();

const obstacleRoot=new THREE.Group();scene.add(obstacleRoot);
const obstacles=[],coins=[];
const rockGeometry=new THREE.IcosahedronGeometry(.72,1);
const coinGeometry=new THREE.TorusGeometry(.27,.09,8,18);
const MAX_COIN_INSTANCES=96;
const coinInstances=new THREE.InstancedMesh(coinGeometry,M.gold,MAX_COIN_INSTANCES);
coinInstances.instanceMatrix.setUsage(THREE.DynamicDrawUsage);coinInstances.frustumCulled=false;coinInstances.count=0;scene.add(coinInstances);
const coinDummy=new THREE.Object3D();
function spawnObstacle(kind,lane,z){
 const g=new THREE.Group();g.position.set(laneX[lane],0,z);obstacleRoot.add(g);
 if(kind==='rock'){const m=new THREE.Mesh(rockGeometry,M.stoneDark);m.position.y=.63;m.scale.set(1,.75,1.1);m.castShadow=graphicsQuality!=='low';m.userData.qualityShadow=true;g.add(m)}
 if(kind==='log'){const m=cyl(g,M.bark,0,.42,0,.27,.27,2.1,10);m.rotation.z=Math.PI/2}
 if(kind==='wall'){box(g,M.stone,0,.72,0,1.9,1.45,.48);for(let i=0;i<3;i++)box(g,M.stoneDark,-.55+i*.55,1.52,0,.13,.14,.52)}
 if(kind==='branch'){cyl(g,M.bark,0,1.95,0,.17,.22,2.3,9).rotation.z=Math.PI/2}
 if(kind==='gap'){box(g,M.gap,0,-.18,0,2.1,.06,2.5)}
 g.userData={kind,lane,hit:false};obstacles.push(g);
}
function spawnCoin(lane,z){if(coins.length<MAX_COIN_INSTANCES)coins.push({x:laneX[lane],y:1.12,z,rotation:Math.PI/2,taken:false})}
function spawnPattern(){
 const z=-58, r=Math.random();
 if(r<.4){const safe=Math.floor(Math.random()*3);for(let l=0;l<3;l++)if(l!==safe)spawnObstacle(Math.random()<.5?'rock':'wall',l,z);for(let i=0;i<6;i++)spawnCoin(safe,z-2-i*1.8)}
 else{const l=Math.floor(Math.random()*3);spawnObstacle(['rock','log','branch','gap'][Math.floor(Math.random()*4)],l,z);const safe=(l+1+Math.floor(Math.random()*2))%3;for(let i=0;i<5;i++)spawnCoin(safe,z-2-i*1.9)}
}
function removeOld(group,array){for(let i=array.length-1;i>=0;i--)if(array[i].position.z>16){group.remove(array[i]);array.splice(i,1)}}
let audio;
function beep(f=520,d=.09,type='sine'){try{audio??=new (window.AudioContext||window.webkitAudioContext)();const o=audio.createOscillator(),v=audio.createGain();o.type=type;o.frequency.value=f;v.gain.setValueAtTime(.045,audio.currentTime);v.gain.exponentialRampToValueAtTime(.001,audio.currentTime+d);o.connect(v);v.connect(audio.destination);o.start();o.stop(audio.currentTime+d)}catch{}}
let lane=1,vy=0,isJumping=false,slide=0,active=false,paused=false,elapsed=0,distance=0,coinCount=0,speed=15,spawnTimer=0,spawnEvery=1.25,best=Number(localStorage.getItem('lostTempleBest')||0);
$('best').textContent=best;
const qualitySelect=$('quality');qualitySelect.value=graphicsQuality;qualitySelect.addEventListener('change',()=>{graphicsQuality=qualitySelect.value;localStorage.setItem('lostTempleGraphics',graphicsQuality);applyGraphicsQuality();showToast(`Graphics: ${graphicsQuality.toUpperCase()}`)});
function showToast(t){$('toast').textContent=t;$('toast').style.opacity=1;setTimeout(()=>$('toast').style.opacity=0,800)}
function action(a){if(!active||paused)return;
 if(a==='left')lane=Math.max(0,lane-1);
 if(a==='right')lane=Math.min(2,lane+1);
 if(a==='jump'&&!isJumping&&slide<=0){vy=8.3;isJumping=true;beep(600,.1)}
 if(a==='slide'&&!isJumping)slide=.72;
}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();action(b.dataset.action)}));
let sx=0,sy=0;renderer.domElement.addEventListener('touchstart',e=>{sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY},{passive:true});
renderer.domElement.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<24)return;if(Math.abs(dx)>Math.abs(dy))action(dx>0?'right':'left');else action(dy<0?'jump':'slide')},{passive:true});
addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key.toLowerCase()==='a')action('left');if(e.key==='ArrowRight'||e.key.toLowerCase()==='d')action('right');if(e.key==='ArrowUp'||e.key===' ')action('jump');if(e.key==='ArrowDown'||e.key.toLowerCase()==='s')action('slide');if(e.key==='Escape')togglePause()});
function reset(){
 for(const o of obstacles)obstacleRoot.remove(o);obstacles.length=0;coins.length=0;coinInstances.count=0;
 lane=1;vy=0;isJumping=false;slide=0;elapsed=0;distance=0;coinCount=0;speed=15;spawnTimer=0;spawnEvery=1.25;hero.position.set(0,0,2.4);hero.scale.set(1,1,1);guardian.position.set(0,0,7.3);segments.forEach((s,i)=>s.position.z=-i*25);
}
function gameOver(){active=false;const d=Math.floor(distance);best=Math.max(best,d);localStorage.setItem('lostTempleBest',best);$('best').textContent=best;$('intro').innerHTML=`The guardian caught you.<br><b>Distance:</b> ${d} m &nbsp; <b>Coins:</b> ${coinCount}`;$('play').textContent='RUN AGAIN';$('overlay').classList.remove('hidden');$('hud').classList.add('hidden');$('touch-controls').classList.add('hidden');beep(100,.4,'sawtooth')}
function start(){reset();active=true;paused=false;$('overlay').classList.add('hidden');$('hud').classList.remove('hidden');$('touch-controls').classList.remove('hidden');$('pause').textContent='Ⅱ';beep(700,.1)}
function togglePause(){if(!active)return;paused=!paused;if(paused){$('intro').textContent='Paused — the ancient guardian is waiting.';$('play').textContent='RESUME';$('overlay').classList.remove('hidden')}else{$('overlay').classList.add('hidden')}}
$('play').addEventListener('click',()=>{if(active&&paused){paused=false;$('overlay').classList.add('hidden')}else start()});
$('pause').addEventListener('click',togglePause);
let clock=new THREE.Clock();
function frame(){
 requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.033);
 if(active&&!paused){
  elapsed+=dt;speed=Math.min(24,15+elapsed*.18);distance+=speed*dt*.52;spawnTimer+=dt;
  if(spawnTimer>spawnEvery){spawnPattern();spawnTimer=0;spawnEvery=Math.max(.78,1.25-elapsed*.0015)}
  hero.position.x+=(laneX[lane]-hero.position.x)*Math.min(1,dt*12);
  if(isJumping){vy-=19*dt;hero.position.y+=vy*dt;if(hero.position.y<=0){hero.position.y=0;vy=0;isJumping=false}}
  if(slide>0)slide-=dt;hero.scale.y=slide>0?.63:1;
  hero.position.y=slide>0?-.1:(isJumping?hero.position.y:0);
  hero.rotation.z=Math.sin(elapsed*speed*.7)*.025;
  if(!heroController.loaded){hero.userData.arms.forEach((a,i)=>{a.rotation.x=Math.sin(elapsed*speed*.65+i*Math.PI)*.38});hero.userData.legs.forEach((l,i)=>{l.rotation.x=Math.sin(elapsed*speed*.65+i*Math.PI)*.34})}if(!guardianController.loaded){guardianArms.forEach((a,i)=>{a.rotation.x=Math.sin(elapsed*5+i*Math.PI)*.16});guardianLegs.forEach((l,i)=>{l.rotation.x=Math.sin(elapsed*5+i*Math.PI)*.12})}
  playCharacterAnimation(heroController,slide>0?'slide':isJumping?'jump':'run');playCharacterAnimation(guardianController,'run');
  for(const mixer of animationMixers)mixer.update(dt);
  guardian.position.x+=(hero.position.x*.55-guardian.position.x)*dt*1.7;
  guardian.position.z=7.3-Math.min(2.4,elapsed*.018);
  for(const s of segments){s.position.z+=speed*dt;if(s.position.z>25)s.position.z-=175}
  for(const o of obstacles){o.position.z+=speed*dt;if(!o.userData.hit&&Math.abs(o.position.z-hero.position.z)<.8&&Math.abs(o.position.x-hero.position.x)<.85){
    const k=o.userData.kind;const avoided=(k==='branch'&&slide>0)||(k==='gap'&&isJumping)||(k!=='branch'&&k!=='gap'&&isJumping&&hero.position.y>.65);
    o.userData.hit=true;if(!avoided){guardian.position.z-=1.2;showToast('The guardian is getting closer!');beep(130,.16,'sawtooth');if(guardian.position.z<5.25){gameOver();break}}
  }}
  for(const c of coins){c.z+=speed*dt;c.rotation+=dt*3.2;if(!c.taken&&Math.abs(c.z-hero.position.z)<.8&&Math.abs(c.x-hero.position.x)<.8&&hero.position.y<1.65){c.taken=true;coinCount++;beep(900,.06)}}
  for(let i=coins.length-1;i>=0;i--)if(coins[i].z>16)coins.splice(i,1);
  coinInstances.count=coins.length;
  for(let i=0;i<coins.length;i++){const c=coins[i];coinDummy.position.set(c.x,c.taken?-100:c.y,c.z);coinDummy.rotation.set(0,Math.PI/2,c.rotation);coinDummy.scale.setScalar(c.taken?0:1);coinDummy.updateMatrix();coinInstances.setMatrixAt(i,coinDummy.matrix)}
  coinInstances.instanceMatrix.needsUpdate=true;
  removeOld(obstacleRoot,obstacles);
  $('distance').textContent=Math.floor(distance);$('coins').textContent=coinCount;
 }
 // camera eases with lane changes; keep the road visible
 camera.position.x+=(hero.position.x*.24-camera.position.x)*.04;
 camera.lookAt(hero.position.x*.16,1.35,-9.5);
 renderer.render(scene,camera);
}
frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerHeight>innerWidth?64:58;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);applyGraphicsQuality()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!paused)togglePause()});