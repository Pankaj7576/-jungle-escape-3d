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
const mats={ground:mat(0x18251d),path:mat(0x493b2c),stone:mat(0x777064),dark:mat(0x292a25),bark:mat(0x302017),leaf:mat(0x183626),leaf2:mat(0x304a30),gold:mat(0xb78a43,.42,.35),hero:mat(0x303d35),skin:mat(0x79553d),cloth:mat(0x202522),monster:mat(0x18271e),bridgeWood:mat(0x49301f,.88),bridgeEdge:mat(0x6b5135,.78),iron:mat(0x292e2d,.38,.78),rope:mat(0x6a5135),rock:mat(0x55564f),eye:new THREE.MeshBasicMaterial({color:0xffb34d})};
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
// Elevated ancient bridge deck with individually visible weathered timber planks.
block(g,mats.bridgeWood,0,-.18,-12,7.4,.42,27);for(let n=0;n<27;n++){block(g,(n%3===0)?mats.bridgeEdge:mats.bridgeWood,0,.055,-n-0.8,7.25,.12,.91);for(const x of [-3.3,3.3])block(g,mats.iron,x,.08,-n-.8,.055,.13,.86)}
for(const side of [-1,1]){block(g,mats.bridgeEdge,side*3.72,.72,-12,.28,1.5,27);block(g,mats.iron,side*3.72,1.52,-12,.12,.12,27);for(let n=0;n<9;n++){const zz=-n*3.1-1;block(g,mats.bridgeEdge,side*3.72,.83,zz,.22,1.5,.24);block(g,mats.iron,side*3.72,1.62,zz,.17,.16,.2)}block(g,mats.iron,side*3.72,2.2,-12,.12,.12,27);
// Massive suspension towers and diagonal support cables.
for(const zz of [-2,-22]){block(g,mats.stone,side*3.72,3.5,zz,.48,7,.55);block(g,mats.stone,side*3.72,7,zz,.9,.42,1.1)}const cable=mesh(g,new THREE.CylinderGeometry(.045,.045,28,7),mats.iron,[side*3.72,3.5,-12],[1,1,1],false);cable.rotation.x=Math.PI/2;
for(let n=0;n<6;n++)tree(g,side*(10+Math.random()*9),-n*5-2,.9+Math.random()*.7)}
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