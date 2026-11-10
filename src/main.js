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
const renderer = new THREE.WebGLRenderer({antialias:false,powerPreference:'high-performance'});
renderer.setSize(innerWidth,innerHeight);
const qualityPresets={low:{pixelRatio:1,shadows:false,shadowSize:512},medium:{pixelRatio:1.25,shadows:true,shadowSize:1024},high:{pixelRatio:1.5,shadows:true,shadowSize:1536}};
const savedQuality=localStorage.getItem('lostTempleGraphics');
let graphicsQuality=Object.hasOwn(qualityPresets,savedQuality)?savedQuality:'medium';
function applyGraphicsQuality(){const q=qualityPresets[graphicsQuality]||qualityPresets.medium;renderer.setPixelRatio(Math.min(devicePixelRatio||1,q.pixelRatio));renderer.shadowMap.enabled=q.shadows;sun.shadow.mapSize.set(q.shadowSize,q.shadowSize);sun.shadow.needsUpdate=true;scene.traverse(o=>{if(o.isMesh&&o.userData.qualityShadow)o.castShadow=q.shadows;});}
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
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
 // Mature tropical hardwood: tapered trunk, exposed roots and irregular branches.
 cyl(g,M.bark,0,2.15,0,.28,.43,4.3,12,true);
 for(let r=0;r<4;r++){const a=r*Math.PI/2+.35;const root=cyl(g,M.bark,Math.cos(a)*.34,.2,Math.sin(a)*.34,.11,.28,1.05,7);root.rotation.z=Math.cos(a)*.68;root.rotation.x=Math.sin(a)*.68}
 for(let b=0;b<3;b++){const a=b*2.1+.4;const branch=cyl(g,M.bark,Math.cos(a)*.62,3.35,Math.sin(a)*.55,.12,.2,1.65,8);branch.rotation.z=Math.cos(a)*-.62;branch.rotation.x=Math.sin(a)*.62}
 for(let i=0;i<9;i++){const a=i*2.399;const radius=.65+(i%3)*.25;const crown=sphere(g,i%3===0?M.leaf2:M.leaf,Math.cos(a)*radius,4.05+(i%4)*.34,Math.sin(a)*radius,.72+(i%2)*.16,.72+(i%3)*.12,.72,1);crown.rotation.y=a}
 // Hanging vines break the repeated spherical canopy silhouette.
 for(let i=0;i<3;i++){const vine=cyl(g,M.moss,Math.cos(i*2.1)*.72,3.05,Math.sin(i*2.1)*.72,.025,.018,1.15,5);vine.rotation.z=(Math.random()-.5)*.22}
 return g;
}
function makeTemple(parent,z){
 const g=new THREE.Group();g.position.z=z;parent.add(g);
 // An original North-Indian Nagara-inspired stone shrine: jagati, mandapa,
 // deep sanctum, carved pilasters and a stepped curvilinear shikhara.
 box(g,M.stoneDark,0,.28,-5.9,9.4,.42,7.2);
 box(g,M.stone,0,.58,-5.9,8.9,.34,6.8);
 for(let step=0;step<3;step++)box(g,step%2?M.stoneDark:M.stone,0,.82+step*.16,-2.75-step*.22,6.7-step*.48,.16,.72);
 // Sanctum mass and shadowed doorway.
 box(g,M.stone,0,2.0,-7.0,4.55,3.0,3.5,true);
 box(g,M.templeInterior,0,1.72,-5.22,1.42,2.25,.08);
 // Door frame with layered jambs and lintel.
 for(const x of [-.92,.92]){
  box(g,M.stoneDark,x,1.75,-5.13,.22,2.45,.26);
  for(let k=0;k<5;k++)box(g,k%2?M.stone:M.stoneDark,x, .72+k*.45,-4.98,.3,.08,.18);
  cyl(g,M.stone,x,1.7,-5.0,.16,.16,1.85,10);
 }
 box(g,M.stoneDark,0,2.98,-5.12,2.2,.28,.35);
 // Carved relief panels and repeated miniature niches on sanctum facade.
 for(const x of [-1.72,1.72]){
  box(g,M.stoneDark,x,2.0,-5.18,.72,1.38,.14);
  box(g,M.stone,x,2.0,-5.07,.52,1.18,.12);
  sphere(g,M.stoneDark,x,2.05,-4.98,.19,.34,.09);
  for(let k=0;k<3;k++)cyl(g,M.stoneDark,x,1.25+k*.48,-4.93,.035,.035,.28,6);
 }
 // Mandapa: stone columns with bases, fluted shafts, lotus-like capitals.
 for(const x of [-3.05,-1.05,1.05,3.05]){
  for(const zz of [-3.35,-1.15]){
   box(g,M.stoneDark,x,.92,zz,.78,.22,.78);
   cyl(g,M.stone,x,1.9,zz,.27,.34,1.8,14,true);
   for(let k=0;k<8;k++){const a=k*Math.PI/4;const rib=cyl(g,M.stoneDark,x+Math.cos(a)*.245,1.9,zz+Math.sin(a)*.245,.025,.025,1.48,5);rib.rotation.z=Math.cos(a)*.04}
   cyl(g,M.stoneDark,x,2.82,zz,.43,.35,.22,12);
   box(g,M.stone,x,3.03,zz,.72,.2,.72);
  }
 }
 // Mandapa roof and ornate horizontal cornices.
 box(g,M.stoneDark,0,3.2,-2.25,7.9,.28,3.5);
 box(g,M.stone,0,3.43,-2.25,8.15,.18,3.7);
 for(let x=-3.5;x<=3.51;x+=.5){
  const bead=sphere(g,M.stoneDark,x,3.55,-2.25,.075,.075,.075,0);bead.castShadow=true;
 }
 // Tall stepped shikhara rises behind the hall, with amalaka and kalasha.
 for(let tier=0;tier<7;tier++){
  const y=3.55+tier*.48, width=3.65-tier*.43;
  const level=cone(g,tier%2?M.stone:M.stoneDark,0,y,-7.15,width*.72,.82,12,true);
  level.scale.z=1.0;
  // vertical miniature ribs on the tower face
  for(const side of [-1,1]){const rib=box(g,M.stone,side*width*.34,y,-6.48,.12,.72,.12);rib.rotation.z=side*.12}
 }
 cyl(g,M.stoneDark,0,6.9,-7.15,.78,.82,.28,16);
 for(let k=0;k<3;k++)cyl(g,M.stone,0,7.12+k*.13,-7.15,.48-k*.1,.48-k*.1,.12,14);
 sphere(g,M.stoneDark,0,7.55,-7.15,.23,.24,.23);
 cone(g,M.stone,0,7.9,-7.15,.12,.55,10);
 // Weathered side walls, broken edges and moss patches.
 for(const side of [-1,1]){
  box(g,M.stoneDark,side*4.1,1.25,-4.1,.38,2.1,3.1,true);
  for(let k=0;k<4;k++)box(g,M.stone,side*(3.92+k*.06),.9+k*.28,-4.6,.16,.12,.72);
  sphere(g,M.moss,side*3.9,2.1,-3.1,.48,.22,.6);
 }
 // Fallen carved blocks around the ruined court.
 for(let i=0;i<5;i++){const b=box(g,i%2?M.stone:M.stoneDark,-4.4+(i%3)*.55,.22,-1.0-i*.75,.7,.38,.55,true);b.rotation.y=i*.45;b.rotation.z=(i%2)*.12}
 g.traverse(o=>{if(o.isMesh){o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true}});
 return g;
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
 const g=new THREE.Group();
 // Rugged expedition runner with readable human proportions and layered field gear.
 sphere(g,M.skin,0,1.57,-.015,.235,.30,.22);
 sphere(g,M.leather,0,1.79,.035,.255,.17,.24);
 // Face plane, brow, nose and hair silhouette face toward the run direction (-Z).
 sphere(g,M.skin,0,1.59,-.205,.19,.19,.045);
 for(const x of [-.085,.085])sphere(g,M.templeInterior,x,1.64,-.248,.027,.027,.018,0);
 sphere(g,M.skin,0,1.55,-.26,.035,.055,.035,0);
 sphere(g,M.leather,0,1.91,.02,.27,.105,.25);
 // Chest, shoulder harness and waist belt.
 const torso=cyl(g,M.cloth,0,1.12,0,.26,.32,.66,12,true);torso.rotation.z=.02;
 box(g,M.leather,0,.82,-.005,.53,.12,.34);
 for(const x of [-.19,.19]){const strap=box(g,M.leather,x,1.18,-.18,.055,.58,.045);strap.rotation.z=x*.65}
 // Backpack and rolled bedroll.
 box(g,M.leather,0,1.25,.23,.39,.52,.2);
 cyl(g,M.stoneDark,0,1.53,.26,.12,.12,.42,9).rotation.z=Math.PI/2;
 const arms=[],legs=[];
 for(const x of [-.36,.36]){
  const shoulder=sphere(g,M.cloth,x,1.35,0,.16,.17,.16);
  const upper=cyl(g,M.cloth,x,1.08,0,.105,.13,.48,10,true);upper.rotation.z=x<0?-.12:.12;
  const elbow=sphere(g,M.skin,x,.83,0,.105,.11,.1,0);
  const lower=cyl(g,M.cloth,x,.68,-.01,.085,.105,.34,9,true);
  sphere(g,M.skin,x,.48,-.02,.09,.10,.09,0);arms.push(upper,lower);
 }
 for(const x of [-.15,.15]){
  const thigh=cyl(g,M.pants,x,.52,0,.14,.17,.48,10,true);
  const knee=sphere(g,M.pants,x,.29,-.01,.14,.14,.14);
  const shin=cyl(g,M.pants,x,.19,-.01,.09,.12,.32,9,true);
  box(g,M.leather,x,.075,-.08,.24,.14,.38);
  legs.push(thigh,shin);
 }
 g.userData.arms=arms;g.userData.legs=legs;
 g.traverse(o=>{if(o.isMesh){o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true}});
 return g;
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
const guardian=new THREE.Group();
// A heavy stone-age jungle guardian: hunched shoulders, long arms, brow, jaw,
// tusks and a jagged mane. This remains a fallback until a verified rig is added.
sphere(guardian,M.monster,0,1.05,.02,.62,.72,.48);
sphere(guardian,M.monster2,0,1.68,-.08,.48,.48,.43);
sphere(guardian,M.monster,0,1.43,-.43,.38,.31,.22);
sphere(guardian,M.monster2,0,1.22,-.47,.31,.16,.18);
for(const x of [-.22,.22]){
 sphere(guardian,M.monsterEye,x,1.78,-.47,.085,.065,.045,0);
 const brow=cyl(guardian,M.monster,x,1.9,-.43,.09,.13,.34,8);brow.rotation.z=x<0?-.28:.28;
 const tusk=cone(guardian,M.stone,x,1.28,-.61,.075,.28,7);tusk.rotation.z=x<0?-.2:.2;
 const shoulder=sphere(guardian,M.monster2,x*2,1.42,.02,.31,.35,.36);
 const arm=cyl(guardian,M.monster,x*1.75,.88,-.02,.2,.25,1.0,10,true);arm.rotation.z=x<0?-.32:.32;
 sphere(guardian,M.monster,x*1.82,.35,-.12,.22,.2,.2);
 for(let claw=0;claw<3;claw++)cone(guardian,M.stone,x*1.82+(claw-1)*.12,.17,-.22,.045,.2,6);
}
// Jagged dorsal mane and bone-like ridges create a readable silhouette.
for(let i=0;i<7;i++){const spine=cone(guardian,M.stoneDark,(i-3)*.14,1.85-Math.abs(i-3)*.08,.28,.13,.42,6);spine.rotation.z=(i-3)*-.1}
guardian.traverse(o=>{if(o.isMesh){o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true}});
guardian.position.set(0,0,7.3);scene.add(guardian);
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
  if(!heroController.loaded)hero.userData.arms.forEach((a,i)=>a.rotation.x=Math.sin(elapsed*speed*.65+i*Math.PI)*.48);
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