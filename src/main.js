import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { makePBRMaterial } from './pbr-textures.js';
import './style.css';

const $ = id => document.getElementById(id);
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x9bb8a3);
scene.fog = new THREE.FogExp2(0x9bb8a3, 0.012);
const camera = new THREE.PerspectiveCamera(innerHeight > innerWidth ? 64 : 58, innerWidth/innerHeight, .1, 180);
camera.position.set(0,4.6,9.2);
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

scene.add(new THREE.HemisphereLight(0xdcebdc,0x3c3826,1.55));
const sun = new THREE.DirectionalLight(0xffdfaa,2.35);
sun.position.set(-12,22,10); sun.castShadow=true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=25;sun.shadow.camera.bottom=-25;
scene.add(sun);
applyGraphicsQuality();
const fill = new THREE.DirectionalLight(0x9db8c6,.55); fill.position.set(8,8,-12);scene.add(fill);

const mat=(color,roughness=.9,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});
const anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
const M={
 soil:makePBRMaterial(0x66553a,1,{repeat:7,roughness:.98,bumpScale:.035,anisotropy}),
 path:makePBRMaterial(0x877454,2,{repeat:4,roughness:.92,bumpScale:.025,anisotropy}),
 stone:makePBRMaterial(0x807866,3,{repeat:3,roughness:.9,bumpScale:.04,anisotropy}),
 stoneDark:makePBRMaterial(0x4e4b3d,4,{repeat:3,roughness:.94,bumpScale:.045,anisotropy}),
 bark:makePBRMaterial(0x493629,5,{repeat:2,roughness:.96,bumpScale:.035,anisotropy}),
 moss:makePBRMaterial(0x43583b,6,{repeat:3,roughness:1,bumpScale:.03,anisotropy}),
 edge:mat(0x403d2c),leaf:mat(0x315a38),leaf2:mat(0x547448),
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
 cyl(g,M.bark,0,1.8,0,.24,.36,3.6,9);
 for(let i=0;i<5;i++){const a=i*1.25;const b=sphere(g,i%2?M.leaf:M.leaf2,Math.cos(a)*.55,3.2+(i%3)*.42,Math.sin(a)*.5,.9,1.05,.85);b.rotation.z=(Math.random()-.5)*.3}
 return g;
}
function makeTemple(parent,z){
 const g=new THREE.Group();g.position.z=z;parent.add(g);
 // carved base, pillars, lintels, stepped shikhara
 box(g,M.stone,0,.48,-5.4,7.8,.9,5.6);
 for(const x of [-2.9,-1,1,2.9]){
  cyl(g,M.stoneDark,x,1.65,-4.1,.31,.38,2.25,12);
  cyl(g,M.stone,x,2.75,-4.1,.48,.42,.22,12);
  for(let k=0;k<3;k++)cyl(g,k%2?M.stone:M.stoneDark,x,1.0+k*.42,-4.1,.34,.34,.09,12);
 }
 box(g,M.stone,0,2.85,-4.1,7.3,.45,1.1);
 box(g,M.stoneDark,0,3.2,-4.1,7.5,.18,1.2);
 for(let i=0;i<5;i++){const y=3.45+i*.27;const w=3.1-i*.45;box(g,i%2?M.stone:M.stoneDark,0,y,-4.4,w,.3,1.35)}
 cone(g,M.stone,0,5.15,-4.4,.55,1.15,8);
 // entry darkness
 box(g,M.templeInterior,0,1.1,-3.51,1.65,2.2,.06);
 for(const x of [-3.5,3.5]){box(g,M.stoneDark,x,1.5,-5.2,.25,3,.4,true);sphere(g,M.moss,x,3.1,-5.2,.55,.45,.55)}
 g.traverse(o=>{if(o.isMesh){o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true}});
 return g;
}
function buildSegment(z,index){
 const g=new THREE.Group();g.position.z=z;world.add(g);
 box(g,M.path,0,-.08,-12,7.7,.28,27);
 for(const x of [-3.95,3.95])box(g,M.edge,x,-.02,-12,.3,.42,27);
 // broken paving stones on road
 for(let i=0;i<12;i++)for(let j=0;j<3;j++){
  if(Math.random()<.25)continue;
  const p=box(g,i%2?M.stone:M.path,(j-1)*2.35+(Math.random()-.5)*.3,-.0,-i*2.15-1,2.15,.035,1.9);
 }
 if(index%3===0)makeTemple(g,-13);
 if(index%4===1){
  box(g,M.water,6.2,-.16,-12,3.8,.08,27);
  for(let k=0;k<5;k++)box(g,M.stone,4.6,-.02,-5-k*4,1.2,.3,1.6);
 }
 for(const side of [-1,1])for(let i=0;i<5;i++)makeTree(g,side*(5.7+Math.random()*3.5),-i*5.1-2,.72+Math.random()*.5);
 // distant cliff silhouettes
 for(const side of [-1,1]){const cliff=cone(g,M.moss,side*12,3,-18,5,8,7);cliff.rotation.z=side*.12}
 // torch stands
 for(const x of [-3.55,3.55]){
  cyl(g,M.stoneDark,x,.45,-8,.13,.18,.9);
  const flame=sphere(g,M.fire,x,1.05,-8,.13,.25,.13,0);
  flame.userData.flame=true;
 }
 return g;
}
for(let i=0;i<7;i++)segments.push(buildSegment(-i*25,i));

function makeHero(){
 const g=new THREE.Group();
 // more human-like layered silhouette, procedural fallback (replaceable by GLB)
 sphere(g,M.skin,0,1.58,0,.27,.34,.25);
 sphere(g,M.leather,0,1.88,.015,.29,.17,.27);
 box(g,M.cloth,0,1.08,0,.55,.72,.32);
 box(g,M.pants,-.15,.49,0,.22,.55,.24);box(g,M.pants,.15,.49,0,.22,.55,.24);
 box(g,M.leather,-.15,.16,.05,.25,.2,.38);box(g,M.leather,.15,.16,.05,.25,.2,.38);
 const arms=[];
 for(const x of [-.37,.37]){const arm=cyl(g,M.cloth,x,1.08,0,.105,.13,.58,9);arm.rotation.z=x<0?-.18:.18;arms.push(arm);sphere(g,M.skin,x, .77,0,.12,.13,.12,0)}
 // backpack
 box(g,M.leather,0,1.2,.22,.36,.46,.17);
 g.userData.arms=arms;g.traverse(o=>{if(o.isMesh){o.castShadow=graphicsQuality!=='low';o.userData.qualityShadow=true}});return g;
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
sphere(guardian,M.monster,0,1.0,0,.52,.72,.42);
sphere(guardian,M.monster2,0,1.72,-.02,.43,.48,.4);
for(const x of [-.2,.2])sphere(guardian,M.monsterEye,x,1.82,-.36,.075,.075,.045,0);
for(const x of [-.34,.34]){const arm=cyl(guardian,M.monster,x,.95,0,.19,.23,.85,9);arm.rotation.z=x<0?-.35:.35}
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
 camera.lookAt(hero.position.x*.18,1.25,-8);
 renderer.render(scene,camera);
}
frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.fov=innerHeight>innerWidth?64:58;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);applyGraphicsQuality()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&active&&!paused)togglePause()});