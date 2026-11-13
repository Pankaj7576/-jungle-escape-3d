import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import './style.css';
const $=id=>document.getElementById(id),canvas=$('world');
const scene=new THREE.Scene();scene.background=new THREE.Color(0x91a7ad);scene.fog=new THREE.Fog(0x91a7ad,48,155);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,130);camera.position.set(0,6.1,10.8);
// Graphics are permanently locked to the Super Smooth profile. No quality selector or user override is exposed.
const GRAPHICS={pixelRatio:1.5,shadows:true,shadowMap:THREE.PCFSoftShadowMap,toneMapping:THREE.ACESFilmicToneMapping,exposure:1.05};
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,GRAPHICS.pixelRatio));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=GRAPHICS.shadows;renderer.shadowMap.type=GRAPHICS.shadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=GRAPHICS.toneMapping;renderer.toneMappingExposure=GRAPHICS.exposure;renderer.setClearColor(0x91a7ad);
scene.add(new THREE.HemisphereLight(0xc5d4d6,0x202a24,1.15));const sun=new THREE.DirectionalLight(0xffe0b2,2.0);sun.position.set(-14,28,12);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-18;scene.add(sun);
const mat=(c,r=.9,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const mats={ground:mat(0x18251d),path:mat(0x493b2c),stone:mat(0x777064),dark:mat(0x292a25),bark:mat(0x302017),leaf:mat(0x183626),leaf2:mat(0x304a30),gold:mat(0xb78a43,.42,.35),hero:mat(0x303d35),skin:mat(0x79553d),cloth:mat(0x202522),monster:mat(0x18271e),bridgeWood:mat(0x49301f,.88),bridgeEdge:mat(0x6b5135,.78),iron:mat(0x292e2d,.38,.78),rope:mat(0x6a5135),rock:mat(0x55564f),deck:mat(0x343b3b,.82,.18),steel:mat(0x68777a,.3,.82),steelDark:mat(0x263438,.34,.78),lanePaint:mat(0xd7d5c7,.72,.05),led:new THREE.MeshStandardMaterial({color:0x42d9d0,emissive:0x147d79,emissiveIntensity:1.2,roughness:.3}),eye:new THREE.MeshBasicMaterial({color:0xffb34d})};
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,16,12);
function mesh(parent,geo,material,pos,scale,shadow=true){const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.scale.set(...scale);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
function block(parent,material,x,y,z,sx,sy,sz){return mesh(parent,boxGeo,material,[x,y,z],[sx,sy,sz])}
// Deep forest canyon far below the elevated bridge.
const canyon=mesh(scene,new THREE.PlaneGeometry(260,260),mats.ground,[0,-42,-48],[1,1,1],false);canyon.rotation.x=-Math.PI/2;
for(let side of [-1,1])for(let i=0;i<24;i++){const cliff=mesh(scene,new THREE.ConeGeometry(5+Math.random()*6,24+Math.random()*28,7),mats.rock,[side*(17+Math.random()*32),-20-Math.random()*8,-i*12-12],[1,1,1],false);cliff.rotation.z=(Math.random()-.5)*.22}
const road=new THREE.Group();scene.add(road);
const lanes=[-2.25,0,2.25],segments=[];
function tree(parent,x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);parent.add(g);mesh(g,new THREE.CylinderGeometry(.12,.32,4.8,9),mats.bark,[0,2.4,0],[1,1,1]);for(let i=0;i<8;i++){const a=i*2.4,r=.7+(i%3)*.4;mesh(g,sphereGeo,i%2?mats.leaf:mats.leaf2,[Math.cos(a)*r,3.7+(i%3)*.45,Math.sin(a)*r],[1.25,.8,1.1],false)}}
function temple(parent){const g=new THREE.Group();g.position.set(0,0,-12);parent.add(g);block(g,mats.stone,0,1.1,0,7,2.2,4);block(g,mats.dark,0,1.1,-2.06,2.3,1.9,.12);for(const x of [-2.7,2.7]){mesh(g,new THREE.CylinderGeometry(.2,.3,2.6,12),mats.stone,[x,1.3,-1.6],[1,1,1]);}for(let i=0;i<5;i++){const roof=mesh(g,new THREE.CylinderGeometry(2.8-i*.38,3.3-i*.38,.28,4),i%2?mats.stone:mats.dark,[0,2.35+i*.25,-1],[1,1,1]);roof.rotation.y=Math.PI/4}}
function segment(z,i){const g=new THREE.Group();g.position.z=z;road.add(g);
// Modern elevated steel suspension bridge: asphalt deck, structural trusses, cable-stayed supports and safety rails.
block(g,mats.steelDark,0,-.22,-12.5,8.25,.55,25.8);
block(g,mats.deck,0,.075,-12.5,7.65,.16,25.4);
for(let n=0;n<26;n++){const z=-.5-n;block(g,mats.steel,0,-.04,z,7.85,.12,.035)}
for(const x of [-1.15,1.15])block(g,mats.lanePaint,x,.165,-12.5,.055,.012,24.6);
for(const side of [-1,1]){
 const x=side*4.02;
 // Deep longitudinal girders and repeating triangular steel truss.
 block(g,mats.steelDark,x,.02,-12.5,.34,.72,25.4);
 block(g,mats.steel,x,.43,-12.5,.2,.18,25.4);
 for(let n=0;n<9;n++){
  const z=-1.2-n*2.85;
  block(g,mats.steel,x,.78,z,.18,.72,.18);
  const brace=mesh(g,new THREE.BoxGeometry(.13,3.25,.13),mats.steel,[x,.35,z-1.35],[1,1,1]);
  brace.rotation.x=side>0?.72:-.72;
 }
 // Modern double-height crash barrier with evenly spaced uprights and illuminated edge strip.
 block(g,mats.steelDark,side*3.86,.62,-12.5,.14,.16,25.3);
 block(g,mats.steel,side*3.86,1.22,-12.5,.12,.12,25.3);
 block(g,mats.led,side*3.91,.24,-12.5,.045,.045,25.1);
 for(let n=0;n<13;n++)block(g,mats.steel,side*3.86,.87,-.55-n*2,.12,1.35,.13);
 // Suspension cable sweeps smoothly over the tower; vertical hangers transfer load to the deck.
 const cablePoints=[new THREE.Vector3(x,3.6,0),new THREE.Vector3(x,5.2,-5),new THREE.Vector3(x,7.9,-12.5),new THREE.Vector3(x,5.2,-20),new THREE.Vector3(x,3.6,-25)];
 const cableCurve=new THREE.CatmullRomCurve3(cablePoints);
 mesh(g,new THREE.TubeGeometry(cableCurve,36,.075,7,false),mats.steelDark,[0,0,0],[1,1,1],false);
 for(let n=1;n<12;n++){const z=-n*2.05;const t=Math.abs((z+12.5)/12.5);const y=3.65+4.2*(1-t*t);const hanger=mesh(g,new THREE.CylinderGeometry(.027,.027,y-.25,6),mats.steel,[x,y/2+.18,z],[1,1,1],false)}
 // Tall portal tower, cross-bracing and broad cap beams.
 block(g,mats.steelDark,x,4.05,-12.5,.52,8.1,.62);
 block(g,mats.steel,x,8.2,-12.5,.82,.34,1.02);
 block(g,mats.steelDark,side*2.35,8.18,-12.5,.3,.3,.5);
 const diagonal=mesh(g,new THREE.BoxGeometry(.18,5.7,.18),mats.steel,[side*3.05,4.1,-12.5],[1,1,1]);
 diagonal.rotation.z=side*.35;
 // No freestanding trees beside the elevated deck: valley scenery is grounded below.
 // Layered canyon shoulders descend away from the bridge to create a deep open-valley view.
 const cliff=mesh(g,new THREE.ConeGeometry(8.5,17,7),mats.stone,[side*10.8,-6.8,-12.5],[1,1,1],false);
 cliff.rotation.z=side>0?-.22:.22;
 const lowerSlope=mesh(g,new THREE.ConeGeometry(10,12,8),mats.ground,[side*15,-10.5,-15],[1,1,1],false);
 lowerSlope.rotation.z=side>0?-.18:.18;
 for(let n=0;n<5;n++){
  const ridge=mesh(g,new THREE.ConeGeometry(5.5,8,7),n%2?mats.leaf:mats.leaf2,[side*(12+n*2.1),-8.2,-3-n*5.2],[1,1,1],false);
  ridge.rotation.z=side>0?-.2:.2;
 }
}
// Distant layered green valley ridgelines frame the bridge without placing floating trees.
for(const side of [-1,1]){
 for(let n=0;n<4;n++){
  const ridge=mesh(g,new THREE.ConeGeometry(10+n*1.2,13+n*1.5,8),n%2?mats.leaf:mats.leaf2,[side*(21+n*5),-10,-5-n*7],[1,1,1],false);
  ridge.rotation.z=side>0?-.12:.12;
 }
}
// Tower portal crossbeam and small warning beacons add a contemporary highway-bridge silhouette.
block(g,mats.steelDark,0,8.15,-12.5,8.5,.36,.5);
for(const x of [-4.02,4.02])mesh(g,sphereGeo,mats.led,[x,8.48,-12.5],[.12,.12,.12],false);
for(let n=0;n<13;n++)for(let l=0;l<3;l++)if(Math.random()>.12)block(g,(n+l)%4?mats.stone:mats.dark,lanes[l],.19,-n*2.1-1,2.18,.08,1.95);if(i%3===0)temple(g);return g}
for(let i=0;i<7;i++)segments.push(segment(-i*25,i));
function heroModel(){const g=new THREE.Group();mesh(g,sphereGeo,mats.hero,[0,1.12,0],[.34,.48,.23]);mesh(g,sphereGeo,mats.skin,[0,1.78,-.01],[.21,.26,.19]);mesh(g,sphereGeo,mats.dark,[0,1.96,.02],[.22,.1,.2]);for(const x of [-.16,.16]){mesh(g,new THREE.CapsuleGeometry(.11,.38,4,8),mats.cloth,[x,.42,0],[1,1,1]);mesh(g,new THREE.CapsuleGeometry(.09,.35,4,8),mats.hero,[x*2,1.15,0],[1,1,1])}return g}
let hero=heroModel();hero.position.set(0,.22,2.5);scene.add(hero);
let heroMixer=null,heroRunAction=null,heroModelLoaded=false;
const heroLoader=new GLTFLoader();
heroLoader.load('/models/character_black_suit_rigged.glb',gltf=>{
  const model=gltf.scene;
  model.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(model);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const height=Math.max(size.y,.001);
  model.scale.setScalar(1.85/height);
  model.position.set(-center.x*model.scale.x,-bounds.min.y*model.scale.y,-center.z*model.scale.z);
  model.rotation.y=Math.PI;
  model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true}});
  const replacement=new THREE.Group();
  replacement.add(model);
  replacement.position.set(0,.22,2.5);
  scene.add(replacement);
  scene.remove(hero);
  hero=replacement;
  heroModelLoaded=true;
  if(gltf.animations&&gltf.animations.length){
    heroMixer=new THREE.AnimationMixer(model);
    const runClip=gltf.animations.find(clip=>/run|walk|jog/i.test(clip.name))||gltf.animations[0];
    heroRunAction=heroMixer.clipAction(runClip);
    heroRunAction.play();
  }
},undefined,error=>console.warn('Black suit hero model could not be loaded; using fallback character.',error));
const guardian=new THREE.Group();mesh(guardian,sphereGeo,mats.monster,[0,1.4,0],[.58,.75,.42]);mesh(guardian,sphereGeo,mats.monster,[0,2,-.12],[.42,.43,.35]);for(const x of [-.15,.15])mesh(guardian,sphereGeo,mats.eye,[x,2.02,-.43],[.06,.045,.025],false);guardian.position.set(0,0,7.8);scene.add(guardian);
const obstacleGroup=new THREE.Group();scene.add(obstacleGroup);const obstacles=[],coins=[];let lane=1,jump=0,slide=0,active=false,paused=false,elapsed=0,distance=0,coinCount=0,spawn=0,best=Number(localStorage.getItem('jungleBest')||0);$('best').textContent=best;
function obstacle(l,z){const g=new THREE.Group();g.position.set(lanes[l],0,z);obstacleGroup.add(g);const type=Math.random();if(type<.45)mesh(g,new THREE.DodecahedronGeometry(.75,1),mats.dark,[0,.65,0],[1,.8,1]);else if(type<.8)block(g,mats.stone,0,.7,0,1.8,1.4,.55);else block(g,mats.bark,0,1.85,0,2.2,.3,.3);g.userData={kind:type<.45?'rock':type<.8?'wall':'branch',hit:false};obstacles.push(g)}
function coin(l,z){coins.push({x:lanes[l],z,taken:false})}
function pattern(){const safe=Math.floor(Math.random()*3),z=-55;for(let l=0;l<3;l++)if(l!==safe&&Math.random()>.25)obstacle(l,z);for(let n=0;n<6;n++)coin(safe,z-n*1.7)}
function act(a){if(!active||paused)return;if(a==='left')lane=Math.max(0,lane-1);if(a==='right')lane=Math.min(2,lane+1);if(a==='jump'&&jump===0&&slide<=0)jump=1;if(a==='slide'&&jump===0)slide=.7}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();act(b.dataset.action)}));let sx=0,sy=0;canvas.addEventListener('touchstart',e=>{sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY},{passive:true});canvas.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return;act(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy<0?'jump':'slide')},{passive:true});addEventListener('keydown',e=>{if(e.key==='ArrowLeft')act('left');if(e.key==='ArrowRight')act('right');if(e.key==='ArrowUp'||e.key===' ')act('jump');if(e.key==='ArrowDown')act('slide')});
function reset(){for(const o of obstacles)obstacleGroup.remove(o);obstacles.length=0;coins.length=0;lane=1;jump=0;slide=0;elapsed=0;distance=0;coinCount=0;spawn=0;hero.position.set(0,.22,2.5);guardian.position.set(0,.22,7.8);segments.forEach((s,i)=>s.position.z=-i*25)}
function finish(){active=false;best=Math.max(best,Math.floor(distance));localStorage.setItem('jungleBest',best);$('best').textContent=best;$('message').textContent='The guardian caught you! Distance: '+Math.floor(distance)+' m · Coins: '+coinCount;$('play').textContent='RUN AGAIN';$('menu').classList.remove('hidden');$('hud').classList.add('hidden');$('controls').classList.add('hidden')}
$('play').onclick=()=>{reset();active=true;paused=false;$('menu').classList.add('hidden');$('hud').classList.remove('hidden');$('controls').classList.remove('hidden')};$('pause').onclick=()=>{if(!active)return;paused=!paused;$('message').textContent=paused?'Run paused.':'Run through ancient ruins, dodge deadly traps and escape the temple guardian.';$('play').textContent=paused?'RESUME':'START RUN';$('menu').classList.toggle('hidden',!paused)};
const clock=new THREE.Clock();function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04);if(active&&!paused){if(heroMixer)heroMixer.update(dt);elapsed+=dt;const speed=Math.min(23,14+elapsed*.16);distance+=speed*dt*.5;spawn+=dt;if(spawn>1.25){pattern();spawn=0}hero.position.x+=(lanes[lane]-hero.position.x)*Math.min(1,dt*12);if(jump){hero.position.y+=jump*dt*8;jump-=dt*2.6;if(jump<=0){jump=0;hero.position.y=.22}}if(slide>0)slide-=dt;hero.scale.y=slide>0?.62:1;guardian.position.z=7.8-Math.min(2,elapsed*.015);for(const s of segments){s.position.z+=speed*dt;if(s.position.z>25)s.position.z-=175}for(const o of obstacles){o.position.z+=speed*dt;if(!o.userData.hit&&Math.abs(o.position.z-hero.position.z)<.8&&Math.abs(o.position.x-hero.position.x)<.85){o.userData.hit=true;const safe=o.userData.kind==='branch'?slide>0:jump>0;if(!safe){finish();break}}}for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i].position.z>15){obstacleGroup.remove(obstacles[i]);obstacles.splice(i,1)}for(const c of coins){c.z+=speed*dt;if(!c.taken&&Math.abs(c.z-hero.position.z)<.8&&Math.abs(c.x-hero.position.x)<.8){c.taken=true;coinCount++}}for(let i=coins.length-1;i>=0;i--)if(coins[i].z>15)coins.splice(i,1);$('distance').textContent=Math.floor(distance);$('coins').textContent=coinCount}camera.position.x+=(hero.position.x*.2-camera.position.x)*.04;camera.lookAt(hero.position.x*.15,1.45,-10);renderer.render(scene,camera)}frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,GRAPHICS.pixelRatio))});