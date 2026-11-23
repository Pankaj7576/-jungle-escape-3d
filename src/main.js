import * as THREE from 'three';
import { FBXLoader } from 'three/addons/loaders/FBXLoader.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { TrackSystem } from './track-system.js';
import './style.css';
const $=id=>document.getElementById(id),canvas=$('world');
const scene=new THREE.Scene();const UNITY_FOG_COLOR=0x47524a;scene.background=new THREE.Color(UNITY_FOG_COLOR);scene.fog=new THREE.FogExp2(UNITY_FOG_COLOR,0.008);
const camera=new THREE.PerspectiveCamera(62,innerWidth/innerHeight,.1,130);camera.position.set(0,6.1,10.8);
// Graphics are permanently locked to the Super Smooth profile. No quality selector or user override is exposed.
const GRAPHICS={pixelRatio:1.5,shadows:true,shadowMap:THREE.PCFSoftShadowMap,toneMapping:THREE.ACESFilmicToneMapping,exposure:1.05};
const renderer=new THREE.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio||1,GRAPHICS.pixelRatio));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=GRAPHICS.shadows;renderer.shadowMap.type=GRAPHICS.shadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=GRAPHICS.toneMapping;renderer.toneMappingExposure=GRAPHICS.exposure;renderer.setClearColor(UNITY_FOG_COLOR);
scene.add(new THREE.HemisphereLight(0xc5d4d6,0x202a24,0.85));const sun=new THREE.DirectionalLight(0xffe0b2,1.15);sun.position.set(-10,18,12);sun.castShadow=true;sun.shadow.mapSize.set(1536,1536);sun.shadow.camera.left=-18;sun.shadow.camera.right=18;sun.shadow.camera.top=28;sun.shadow.camera.bottom=-18;scene.add(sun);
const mat=(c,r=.9,m=0)=>new THREE.MeshStandardMaterial({color:c,roughness:r,metalness:m});
const mats={ground:mat(0x18251d),path:mat(0x493b2c),stone:mat(0x777064),dark:mat(0x292a25),bark:mat(0x302017),leaf:mat(0x183626),leaf2:mat(0x304a30),gold:mat(0xb78a43,.42,.35),hero:mat(0x303d35),skin:mat(0x79553d),cloth:mat(0x202522),monster:mat(0x18271e),bridgeWood:mat(0x49301f,.88),bridgeEdge:mat(0x6b5135,.78),iron:mat(0x292e2d,.38,.78),rope:mat(0x6a5135),rock:mat(0x55564f),eye:new THREE.MeshBasicMaterial({color:0xffb34d})};
const boxGeo=new THREE.BoxGeometry(1,1,1),sphereGeo=new THREE.SphereGeometry(1,16,12);
function mesh(parent,geo,material,pos,scale,shadow=true){const o=new THREE.Mesh(geo,material);o.position.set(...pos);o.scale.set(...scale);o.castShadow=shadow;o.receiveShadow=true;parent.add(o);return o}
function block(parent,material,x,y,z,sx,sy,sz){return mesh(parent,boxGeo,material,[x,y,z],[sx,sy,sz])}
// Deep forest canyon far below the elevated bridge.
const canyon=mesh(scene,new THREE.PlaneGeometry(260,260),mats.ground,[0,-42,-48],[1,1,1],false);canyon.rotation.x=-Math.PI/2;
for(let side of [-1,1])for(let i=0;i<24;i++){const cliff=mesh(scene,new THREE.ConeGeometry(5+Math.random()*6,24+Math.random()*28,7),mats.rock,[side*(17+Math.random()*32),-20-Math.random()*8,-i*12-12],[1,1,1],false);cliff.rotation.z=(Math.random()-.5)*.22}
const road=new THREE.Group();scene.add(road);
const lanes=[-2,0,2];
let trackSystem=null,trackReady=false;
function tree(parent,x,z,s=1){const g=new THREE.Group();g.position.set(x,0,z);g.scale.setScalar(s);parent.add(g);mesh(g,new THREE.CylinderGeometry(.12,.32,4.8,9),mats.bark,[0,2.4,0],[1,1,1]);for(let i=0;i<8;i++){const a=i*2.4,r=.7+(i%3)*.4;mesh(g,sphereGeo,i%2?mats.leaf:mats.leaf2,[Math.cos(a)*r,3.7+(i%3)*.45,Math.sin(a)*r],[1.25,.8,1.1],false)}}
function temple(parent){const g=new THREE.Group();g.position.set(0,0,-12);parent.add(g);block(g,mats.stone,0,1.1,0,7,2.2,4);block(g,mats.dark,0,1.1,-2.06,2.3,1.9,.12);for(const x of [-2.7,2.7]){mesh(g,new THREE.CylinderGeometry(.2,.3,2.6,12),mats.stone,[x,1.3,-1.6],[1,1,1]);}for(let i=0;i<5;i++){const roof=mesh(g,new THREE.CylinderGeometry(2.8-i*.38,3.3-i*.38,.28,4),i%2?mats.stone:mats.dark,[0,2.35+i*.25,-1],[1,1,1]);roof.rotation.y=Math.PI/4}}
function heroModel(){const g=new THREE.Group();mesh(g,sphereGeo,mats.hero,[0,1.12,0],[.34,.48,.23]);mesh(g,sphereGeo,mats.skin,[0,1.78,-.01],[.21,.26,.19]);mesh(g,sphereGeo,mats.dark,[0,1.96,.02],[.22,.1,.2]);for(const x of [-.16,.16]){mesh(g,new THREE.CapsuleGeometry(.11,.38,4,8),mats.cloth,[x,.42,0],[1,1,1]);mesh(g,new THREE.CapsuleGeometry(.09,.35,4,8),mats.hero,[x*2,1.15,0],[1,1,1])}return g}
let hero=heroModel();hero.position.set(0,.22,2.5);scene.add(hero);
let heroMixer=null,heroRunAction=null,heroModelLoaded=false,guardianMixer=null,heroAnimationRoot=null,heroAnimationRootPosition=new THREE.Vector3();
function makeInPlaceRunClip(sourceClip){
  // Disable root/hips translation from the imported FBX run cycle. The game track
  // supplies forward movement; allowing root motion here makes the hero jump/loop
  // back to the same spawn point at the end of each animation cycle.
  const clip=sourceClip.clone();
  clip.tracks=clip.tracks.filter(track=>{
    const name=track.name||'';
    return !( /(?:^|[|/:.])(?:mixamorig)?(?:hips|root|armature)(?:[|/:.]|$).*\.position$/i.test(name) || name==='.position' );
  });
  return clip;
}
const fbxLoader=new FBXLoader();
function prepareFBXCharacter(root,targetHeight,turn=0){
  root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(root);
  const size=bounds.getSize(new THREE.Vector3());
  const center=bounds.getCenter(new THREE.Vector3());
  const scale=targetHeight/Math.max(size.y,.001);
  root.scale.setScalar(scale);
  root.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
  root.rotation.y=turn;
  root.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true;if(node.material){const mats=Array.isArray(node.material)?node.material:[node.material];for(const m of mats){if(m)m.needsUpdate=true}}}});
  return root;
}
fbxLoader.load('/models/unity_hero_mannequin.fbx',object=>{
  const model=prepareFBXCharacter(object,1.85,Math.PI);
  const replacement=new THREE.Group();
  replacement.add(model);
  replacement.position.set(0,.22,2.5);
  scene.add(replacement);
  scene.remove(hero);
  hero=replacement;
  heroModelLoaded=true;
  heroAnimationRoot=object;heroAnimationRootPosition.copy(object.position);
  heroMixer=new THREE.AnimationMixer(object);
  fbxLoader.load('/models/unity_hero_run.fbx',runObject=>{
    const sourceClip=runObject.animations?.find(clip=>/run|jog|sprint/i.test(clip.name))||runObject.animations?.[0];
    if(sourceClip){const runClip=makeInPlaceRunClip(sourceClip);heroRunAction=heroMixer.clipAction(runClip);heroRunAction.play()}
  },undefined,error=>console.warn('Unity hero run animation could not be loaded.',error));
},undefined,error=>{
  console.warn('Unity hero FBX could not be loaded; trying the existing black-suit GLB.',error);
  const gltfLoader=new GLTFLoader();
  gltfLoader.load('/models/character_black_suit_rigged.glb',gltf=>{
    const model=gltf.scene;
    model.updateMatrixWorld(true);
    const bounds=new THREE.Box3().setFromObject(model);
    const size=bounds.getSize(new THREE.Vector3());
    const center=bounds.getCenter(new THREE.Vector3());
    const scale=1.85/Math.max(size.y,.001);
    model.scale.setScalar(scale);
    model.position.set(-center.x*scale,-bounds.min.y*scale,-center.z*scale);
    model.rotation.y=Math.PI;
    model.traverse(node=>{if(node.isMesh){node.castShadow=true;node.receiveShadow=true}});
    const replacement=new THREE.Group();
    replacement.add(model);
    replacement.position.set(0,.22,2.5);
    scene.add(replacement);
    scene.remove(hero);
    hero=replacement;
    heroModelLoaded=true;
    if(gltf.animations?.length){heroAnimationRoot=model;heroAnimationRootPosition.copy(model.position);heroMixer=new THREE.AnimationMixer(model);const sourceClip=gltf.animations.find(c=>/run|walk|jog/i.test(c.name))||gltf.animations[0];heroRunAction=heroMixer.clipAction(makeInPlaceRunClip(sourceClip));heroRunAction.play()}
  },undefined,glbError=>console.warn('Black-suit fallback could not be loaded; using the built-in character.',glbError));
});
let guardian=new THREE.Group();
mesh(guardian,sphereGeo,mats.monster,[0,1.4,0],[.58,.75,.42]);
mesh(guardian,sphereGeo,mats.monster,[0,2,-.12],[.42,.43,.35]);
for(const x of [-.15,.15])mesh(guardian,sphereGeo,mats.eye,[x,2.02,-.43],[.06,.045,.025],false);
guardian.position.set(0,0,7.8);
scene.add(guardian);
fbxLoader.load('/models/unity_guardian_ape.fbx',ape=>{
  const model=prepareFBXCharacter(ape,2.35,Math.PI);
  const replacement=new THREE.Group();
  replacement.add(model);
  replacement.position.set(0,0,7.8);
  scene.add(replacement);
  scene.remove(guardian);
  guardian=replacement;
  if(ape.animations?.length){
    guardianMixer=new THREE.AnimationMixer(ape);
    const runClip=ape.animations.find(clip=>/run|chase/i.test(clip.name))||ape.animations.find(clip=>/idle/i.test(clip.name))||ape.animations[0];
    guardianMixer.clipAction(runClip).play();
  }
},undefined,error=>console.warn('Unity guardian ape could not be loaded; using the built-in guardian.',error));
const obstacleGroup=new THREE.Group();scene.add(obstacleGroup);const obstacles=[],coins=[];let lane=1,laneOffset=0,verticalSpeed=0,jumpHeight=0,slide=0,active=false,paused=false,elapsed=0,distance=0,coinCount=0,best=Number(localStorage.getItem('jungleBest')||0);$('best').textContent=best;
function obstacleAt(trackDistance,laneValue,kind){const frame=trackSystem.sample(trackDistance,laneValue*2);const g=new THREE.Group();g.position.copy(frame.position);g.rotation.y=Math.atan2(-frame.forward.x,-frame.forward.z);obstacleGroup.add(g);if(kind==='rock')mesh(g,new THREE.DodecahedronGeometry(.75,1),mats.dark,[0,.65,0],[1,.8,1]);else if(kind==='wall')block(g,mats.stone,0,.7,0,1.8,1.4,.55);else block(g,mats.bark,0,1.85,0,2.2,.3,.3);g.userData={kind,hit:false,distance:trackDistance,lane:laneValue};obstacles.push(g)}
function coinAt(trackDistance,laneValue){const frame=trackSystem.sample(trackDistance,laneValue*2);const visual=new THREE.Group();visual.position.copy(frame.position);visual.position.y+=.95;visual.rotation.y=Math.atan2(-frame.forward.x,-frame.forward.z);mesh(visual,new THREE.CylinderGeometry(.24,.24,.07,20),mats.gold,[0,0,0],[1,1,1]);obstacleGroup.add(visual);coins.push({visual,distance:trackDistance,lane:laneValue,taken:false})}
function spawnSegmentContent(segment){if(segment.isGap)return;const count=3+Math.floor(Math.random()*2);for(let i=0;i<count;i++){const t=.22+.55*((i+.5)/count);coinAt(segment.startDistance+segment.length*t,Math.floor(Math.random()*3)-1)}if(Math.random()<Math.min(.9,.72+Math.min(1,distance/1200)*.16)){const d=segment.startDistance+segment.length*(.62+Math.random()*.22);const l=Math.floor(Math.random()*3)-1;const kind=Math.random()<.5?'branch':Math.random()<.5?'rock':'wall';obstacleAt(d,l,kind)}}
trackSystem=new TrackSystem(road,spawnSegmentContent);trackSystem.ready.then(()=>{trackReady=true;$('play').textContent='START RUN';$('message').textContent='Run through the connected ancient stone bridge, take the turns, jump broken gaps and escape the guardian.'}).catch(error=>{console.error('Unity bridge track failed to load',error);$('message').textContent='Bridge assets could not load. Please check your connection and try again.'});
function act(a){if(!active||paused)return;if(a==='left')lane=Math.max(0,lane-1);if(a==='right')lane=Math.min(2,lane+1);if(a==='jump'&&jumpHeight<=0&&verticalSpeed<=0&&slide<=0)verticalSpeed=7.3;if(a==='slide'&&jump===0)slide=.7}
document.querySelectorAll('[data-action]').forEach(b=>b.addEventListener('pointerdown',e=>{e.preventDefault();act(b.dataset.action)}));let sx=0,sy=0;canvas.addEventListener('touchstart',e=>{sx=e.changedTouches[0].clientX;sy=e.changedTouches[0].clientY},{passive:true});canvas.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-sx,dy=e.changedTouches[0].clientY-sy;if(Math.max(Math.abs(dx),Math.abs(dy))<22)return;act(Math.abs(dx)>Math.abs(dy)?dx>0?'right':'left':dy<0?'jump':'slide')},{passive:true});addEventListener('keydown',e=>{if(e.key==='ArrowLeft')act('left');if(e.key==='ArrowRight')act('right');if(e.key==='ArrowUp'||e.key===' ')act('jump');if(e.key==='ArrowDown')act('slide')});
function reset(){for(const o of obstacles)obstacleGroup.remove(o);for(const c of coins)obstacleGroup.remove(c.visual);obstacles.length=0;coins.length=0;lane=1;laneOffset=0;verticalSpeed=0;jumpHeight=0;slide=0;elapsed=0;distance=0;coinCount=0;trackSystem.reset();hero.position.set(0,.22,2.5);guardian.position.set(0,.22,7.8)}
function finish(){active=false;best=Math.max(best,Math.floor(distance));localStorage.setItem('jungleBest',best);$('best').textContent=best;$('message').textContent='The guardian caught you! Distance: '+Math.floor(distance)+' m · Coins: '+coinCount;$('play').textContent='RUN AGAIN';$('menu').classList.remove('hidden');$('hud').classList.add('hidden');$('controls').classList.add('hidden')}
$('play').onclick=()=>{if(!trackReady){$('message').textContent='Unity stone bridge modules are loading. Please wait a moment.';return}reset();active=true;paused=false;$('menu').classList.add('hidden');$('hud').classList.remove('hidden');$('controls').classList.remove('hidden')};$('pause').onclick=()=>{if(!active)return;paused=!paused;$('message').textContent=paused?'Run paused.':'Run through ancient ruins, dodge deadly traps and escape the temple guardian.';$('play').textContent=paused?'RESUME':'START RUN';$('menu').classList.toggle('hidden',!paused)};
const clock=new THREE.Clock();function frame(){requestAnimationFrame(frame);const dt=Math.min(clock.getDelta(),.04);if(active&&!paused){if(heroMixer){heroMixer.update(dt);if(heroAnimationRoot)heroAnimationRoot.position.copy(heroAnimationRootPosition)}if(guardianMixer)guardianMixer.update(dt);elapsed+=dt;const speed=Math.min(14.5,9.5+elapsed*.045);distance+=speed*dt;trackSystem.update(distance);const targetLaneOffset=(lane-1)*2;laneOffset+=THREE.MathUtils.clamp((targetLaneOffset-laneOffset)*12,-12,12)*dt;const playerFrame=trackSystem.sample(distance,laneOffset);if(verticalSpeed!==0||jumpHeight>0){jumpHeight+=verticalSpeed*dt;verticalSpeed-=21*dt;if(jumpHeight<=0){jumpHeight=0;verticalSpeed=0}}if(slide>0)slide=Math.max(0,slide-dt);hero.position.copy(playerFrame.position);hero.position.y+=.22+jumpHeight;hero.rotation.y=Math.atan2(-playerFrame.forward.x,-playerFrame.forward.z);hero.scale.y=slide>0?.62:1;let guardianFrame;if(distance>=4)guardianFrame=trackSystem.sample(distance-4,0);else guardianFrame={position:playerFrame.position.clone().addScaledVector(playerFrame.forward,-(4-distance)),forward:playerFrame.forward};guardian.position.copy(guardianFrame.position);guardian.rotation.y=Math.atan2(-guardianFrame.forward.x,-guardianFrame.forward.z);if(trackSystem.isGapAt(distance)&&jumpHeight<=0&&verticalSpeed<=0){finish()}for(const o of obstacles){if(!o.userData.hit&&Math.abs(o.userData.distance-distance)<.78&&Math.abs(o.userData.lane*2-laneOffset)<.85){o.userData.hit=true;const safe=o.userData.kind==='branch'?slide>0:jumpHeight>.65;if(!safe){finish();break}}}for(let i=obstacles.length-1;i>=0;i--)if(obstacles[i].userData.distance<distance-3){obstacleGroup.remove(obstacles[i]);obstacles.splice(i,1)}for(const c of coins){if(!c.taken&&Math.abs(c.distance-distance)<.8&&Math.abs(c.lane*2-laneOffset)<.85){c.taken=true;coinCount++;obstacleGroup.remove(c.visual)}}for(let i=coins.length-1;i>=0;i--)if(coins[i].distance<distance-3){obstacleGroup.remove(coins[i].visual);coins.splice(i,1)}$('distance').textContent=Math.floor(distance);$('coins').textContent=coinCount}if(active&&trackReady){const frame=trackSystem.sample(distance,0);const desired=hero.position.clone().addScaledVector(frame.forward,-7.5).add(new THREE.Vector3(0,4.2,0));camera.position.lerp(desired,1-Math.exp(-7*dt));camera.lookAt(hero.position.clone().add(new THREE.Vector3(0,1.25,0)))}else camera.lookAt(0,1.2,-8);renderer.render(scene,camera)}frame();
addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);renderer.setPixelRatio(Math.min(devicePixelRatio||1,GRAPHICS.pixelRatio))});