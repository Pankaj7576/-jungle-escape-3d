import * as THREE from 'three';
import './style.css';
import { TrackSystem, makeWorldObstacle, makeCoin } from './track-system.js';
import { RunnerCharacter, TempleBeast } from './character-system.js';
import { RunnerCamera } from './camera-system.js';

const $ = id => document.getElementById(id);
const canvas = $('world');
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x8fb3c2);
scene.fog = new THREE.FogExp2(0x9db9c0, .0031);

const camera = new THREE.PerspectiveCamera(66, innerWidth / innerHeight, .1, 220);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
renderer.setSize(innerWidth, innerHeight);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.08;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

scene.add(new THREE.HemisphereLight(0xd7edff, 0x263c31, 1.65));
const sun = new THREE.DirectionalLight(0xffe3b2, 2.1);
sun.position.set(-28, 45, 24);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.camera.left = -28; sun.shadow.camera.right = 28;
sun.shadow.camera.top = 36; sun.shadow.camera.bottom = -26;
scene.add(sun);

const mat = (color, roughness = .9, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });
const stoneMapCanvas = document.createElement('canvas');
stoneMapCanvas.width = stoneMapCanvas.height = 256;
const stoneCtx = stoneMapCanvas.getContext('2d');
stoneCtx.fillStyle = '#77756a'; stoneCtx.fillRect(0, 0, 256, 256);
for (let i = 0; i < 9000; i++) {
  const v = 65 + Math.random() * 130;
  stoneCtx.fillStyle = 'rgba(' + v + ',' + (v * .98) + ',' + (v * .9) + ',' + (Math.random() * .3) + ')';
  stoneCtx.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 4, 1 + Math.random() * 4);
}
const stoneMap = new THREE.CanvasTexture(stoneMapCanvas);
stoneMap.wrapS = stoneMap.wrapT = THREE.RepeatWrapping;
stoneMap.colorSpace = THREE.SRGBColorSpace;
const mats = {
  deck: new THREE.MeshStandardMaterial({ color: 0x766f60, map: stoneMap, roughness: 1 }),
  foundation: mat(0x343c39), parapet: mat(0x837c6b), rail: mat(0x4d554e, .85),
  stone: new THREE.MeshStandardMaterial({ color: 0xaaa18d, map: stoneMap, roughness: 1 }),
  rock: new THREE.MeshStandardMaterial({ color: 0x62675f, map: stoneMap, roughness: 1 }),
  bark: mat(0x382719), gold: mat(0xe1b34d, .32, .5), leaf: mat(0x183b2c),
  snow: mat(0xe8f2f2), mountain: mat(0x586f70), cloud: mat(0xe4edef)
};

function addEnvironment() {
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(900, 900), mat(0x142820));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -28; floor.position.z = -100;
  floor.receiveShadow = true; scene.add(floor);
  for (const side of [-1, 1]) {
    for (let i = 0; i < 9; i++) {
      const peak = new THREE.Group();
      peak.position.set(side * (25 + i * 6), -7 + i * .65, -32 - i * 29);
      const h = 24 + i * 3, r = 12 + i * 1.8;
      const rock = new THREE.Mesh(new THREE.ConeGeometry(r, h, 8, 3), i % 2 ? mats.leaf : mats.mountain);
      rock.position.y = h * .5; rock.castShadow = false; peak.add(rock);
      if (i > 3) {
        const cap = new THREE.Mesh(new THREE.ConeGeometry(r * .42, h * .32, 8, 2), mats.snow);
        cap.position.y = h * .83; peak.add(cap);
      }
      scene.add(peak);
    }
  }
  for (let i = 0; i < 18; i++) {
    const cloud = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 8), mats.cloud);
    cloud.position.set((Math.random() - .5) * 110, 8 + Math.random() * 13, -30 - Math.random() * 230);
    cloud.scale.set(5 + Math.random() * 8, 1.6 + Math.random() * 2, 3 + Math.random() * 5);
    scene.add(cloud);
  }
}
addEnvironment();

const track = new TrackSystem(scene, mats);
const runner = new RunnerCharacter(scene);
const beast = new TempleBeast(scene);
const cameraRig = new RunnerCamera(camera, scene);

const state = {
  active: false, paused: false, progress: 0, lane: 1, jumpY: 0, jumpVelocity: 0,
  slideTime: 0, stumbleTime: 0, invulnerable: 0, elapsed: 0, speed: 12,
  distance: 0, coins: 0, best: Number(localStorage.getItem('jungleBest') || 0),
  gems: Number(localStorage.getItem('jungleGems') || 5), magnetTime: 0, boostTime: 0,
  chaserGap: 5.5, reviveUsed: false, spawnAt: 18, lastPowerup: 0
};
$('best').textContent = state.best;
$('gem-count').textContent = state.gems;

const obstacles = [];
const pickups = [];
const coinVisuals = [];
const LANE_SPACING = 2.25;
let runFrame = 0;

function laneOffset(lane) { return (lane - 1) * LANE_SPACING; }
function placeAt(progress, lane = 1) { return track.getPose(progress, laneOffset(lane)); }

function spawnPattern(at) {
  const safe = Math.floor(Math.random() * 3);
  const pose = track.getPose(at);
  const piece = pose.piece;
  if (piece.kind !== 'gap' && piece.kind !== 'turn') {
    for (let lane = 0; lane < 3; lane++) {
      if (lane === safe || Math.random() > .72) continue;
      const kindRoll = Math.random();
      const kind = kindRoll < .43 ? 'rock' : kindRoll < .75 ? 'wall' : 'arch';
      const p = track.getPose(at);
      const mesh = makeWorldObstacle(scene, mats, p, laneOffset(lane), kind);
      obstacles.push({ mesh, progress: at, lane, kind, hit: false });
    }
  }
  for (let i = 0; i < 7; i++) {
    const p = track.getPose(at + i * 1.65);
    const mesh = makeCoin(scene, mats, p, laneOffset(safe));
    coinVisuals.push({ mesh, progress: at + i * 1.65, lane: safe, taken: false, power: null });
  }
  if (at - state.lastPowerup > 95 && Math.random() < .72) {
    const type = Math.random() < .55 ? 'magnet' : 'boost';
    const powerLane = (safe + 1 + Math.floor(Math.random() * 2)) % 3;
    const p = track.getPose(at + 13);
    const mesh = makeCoin(scene, mats, p, laneOffset(powerLane), true, type);
    pickups.push({ mesh, progress: at + 13, lane: powerLane, type, taken: false });
    state.lastPowerup = at;
  }
}

function showRevive() {
  state.active = false;
  $('revive-distance').textContent = Math.floor(state.distance);
  $('revive-gems').textContent = state.gems;
  $('revive').classList.remove('hidden');
  $('hud').classList.add('hidden');
  $('controls').classList.add('hidden');
  $('revive-continue').disabled = state.gems < 5 || state.reviveUsed;
}
function gameOver() {
  state.active = false;
  state.best = Math.max(state.best, Math.floor(state.distance));
  localStorage.setItem('jungleBest', state.best);
  $('best').textContent = state.best;
  $('message').textContent = 'The temple beast caught you. Distance: ' + Math.floor(state.distance) + ' m';
  $('play').textContent = 'RUN AGAIN';
  $('menu').classList.remove('hidden');
  $('hud').classList.add('hidden');
  $('controls').classList.add('hidden');
}
function failRun() {
  if (!state.reviveUsed) showRevive();
  else gameOver();
}
function reviveRun() {
  if (state.gems < 5 || state.reviveUsed) return;
  state.gems -= 5; state.reviveUsed = true; state.active = true;
  state.invulnerable = 3.2; state.chaserGap = 8;
  state.progress += 8; state.stumbleTime = 0; state.jumpY = 0;
  localStorage.setItem('jungleGems', String(state.gems));
  $('gem-count').textContent = state.gems;
  $('revive').classList.add('hidden');
  $('hud').classList.remove('hidden');
  $('controls').classList.remove('hidden');
  const pose = placeAt(state.progress, state.lane);
  runner.root.position.copy(pose.position);
  { const p = track.getPose(Math.max(0, state.progress - state.chaserGap)); p.position.addScaledVector(p.tangent, -state.chaserGap); beast.update(.016, p); }
}
$('revive-continue').onclick = reviveRun;
$('revive-decline').onclick = () => { $('revive').classList.add('hidden'); gameOver(); };

function resetRun() {
  state.progress = 0; state.lane = 1; state.jumpY = 0; state.jumpVelocity = 0;
  state.slideTime = 0; state.stumbleTime = 0; state.invulnerable = 0;
  state.elapsed = 0; state.speed = 12; state.distance = 0; state.coins = 0;
  state.magnetTime = 0; state.boostTime = 0; state.chaserGap = 5.5;
  state.reviveUsed = false; state.spawnAt = 18; state.lastPowerup = 0;
  for (const item of [...obstacles, ...coinVisuals, ...pickups]) scene.remove(item.mesh);
  obstacles.length = 0; coinVisuals.length = 0; pickups.length = 0;
  $('distance').textContent = '0'; $('coins').textContent = '0';
  track.reset();
  track.ensureAhead(0, 240);
  const pose = placeAt(0, 1);
  runner.root.position.copy(pose.position);
  { const p = track.getPose(0); p.position.addScaledVector(p.tangent, -5.5); beast.update(.016, p); }
  cameraRig.update(.016, pose.position, pose.tangent);
}
function startRun() {
  resetRun(); state.active = true; state.paused = false;
  $('menu').classList.add('hidden'); $('revive').classList.add('hidden');
  $('hud').classList.remove('hidden'); $('controls').classList.remove('hidden');
  runner.play('run');
}
$('play').onclick = startRun;
$('pause').onclick = () => {
  if (!state.active) return;
  state.paused = !state.paused;
  $('pause').textContent = state.paused ? '▶' : 'Ⅱ';
  $('pause-label').textContent = state.paused ? 'PAUSED' : '';
  $('pause-overlay').classList.toggle('hidden', !state.paused);
};
$('resume').onclick = () => {
  state.paused = false; $('pause').textContent = 'Ⅱ'; $('pause-overlay').classList.add('hidden');
};

function action(name) {
  if (!state.active || state.paused) return;
  if (name === 'left') state.lane = Math.max(0, state.lane - 1);
  if (name === 'right') state.lane = Math.min(2, state.lane + 1);
  if (name === 'jump' && state.jumpY <= 0 && state.slideTime <= 0) {
    state.jumpVelocity = 7.2; runner.play('jump');
  }
  if (name === 'slide' && state.jumpY <= .05) {
    state.slideTime = .82; runner.play('slide');
  }
}
document.querySelectorAll('[data-action]').forEach(button => {
  button.addEventListener('pointerdown', event => { event.preventDefault(); action(button.dataset.action); });
});
let touchX = 0, touchY = 0;
canvas.addEventListener('touchstart', event => {
  touchX = event.changedTouches[0].clientX; touchY = event.changedTouches[0].clientY;
}, { passive: true });
canvas.addEventListener('touchend', event => {
  const dx = event.changedTouches[0].clientX - touchX;
  const dy = event.changedTouches[0].clientY - touchY;
  if (Math.max(Math.abs(dx), Math.abs(dy)) < 22) return;
  action(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy < 0 ? 'jump' : 'slide'));
}, { passive: true });
addEventListener('keydown', event => {
  if (event.key === 'ArrowLeft' || event.key === 'a') action('left');
  if (event.key === 'ArrowRight' || event.key === 'd') action('right');
  if (event.key === 'ArrowUp' || event.key === ' ') action('jump');
  if (event.key === 'ArrowDown' || event.key === 's') action('slide');
  if (event.key === 'Escape') $('pause').click();
});

function collectCoins(dt, runnerPose) {
  for (const coin of coinVisuals) {
    if (coin.taken) continue;
    const distance = coin.progress - state.progress;
    if (state.magnetTime > 0 && Math.abs(distance) < 10) {
      const target = runnerPose.position.clone().add(new THREE.Vector3(0, 1.05, 0));
      coin.mesh.position.lerp(target, 1 - Math.exp(-dt * 5));
    }
    if (Math.abs(distance) < 1.05 && (coin.lane === state.lane || state.magnetTime > 0)) {
      coin.taken = true; scene.remove(coin.mesh); state.coins++;
    }
  }
  for (const power of pickups) {
    if (power.taken) continue;
    if (Math.abs(power.progress - state.progress) < 1.15 && power.lane === state.lane) {
      power.taken = true; scene.remove(power.mesh);
      if (power.type === 'magnet') state.magnetTime = 10;
      if (power.type === 'boost') state.boostTime = 5.5;
    }
  }
}

function updateWorld(dt) {
  state.elapsed += dt;
  state.magnetTime = Math.max(0, state.magnetTime - dt);
  state.boostTime = Math.max(0, state.boostTime - dt);
  state.invulnerable = Math.max(0, state.invulnerable - dt);
  state.stumbleTime = Math.max(0, state.stumbleTime - dt);
  const boost = state.boostTime > 0 ? 1.55 : 1;
  const stumble = state.stumbleTime > 0 ? .48 : 1;
  state.speed = Math.min(22, 12 + state.elapsed * .12) * boost * stumble;
  state.progress += state.speed * dt;
  state.distance = state.progress * .5;
  track.ensureAhead(state.progress, 230);
  track.pruneBehind(state.progress);

  if (state.progress >= state.spawnAt) {
    spawnPattern(state.spawnAt);
    state.spawnAt += 23 + Math.random() * 9;
  }
  if (state.jumpVelocity !== 0 || state.jumpY > 0) {
    state.jumpY += state.jumpVelocity * dt;
    state.jumpVelocity -= 18 * dt;
    if (state.jumpY <= 0) { state.jumpY = 0; state.jumpVelocity = 0; }
  }
  state.slideTime = Math.max(0, state.slideTime - dt);
  const lanePose = placeAt(state.progress, state.lane);
  runner.root.position.copy(lanePose.position);
  runner.root.position.y += state.jumpY;
  runner.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), lanePose.tangent);
  const runnerState = state.slideTime > 0 ? 'slide' : state.jumpY > .08 ? 'jump' : 'run';
  runner.update(dt, runnerState, state.speed / 12);

  const gap = track.gapAt(state.progress);
  $('gap-status').classList.toggle('hidden', !gap && !track.pieces.some(p => p.kind === 'gap' && p.gapStart > state.progress && p.gapStart - state.progress < 12));
  if (gap && state.jumpY < 1.05 && state.invulnerable <= 0) {
    failRun(); return;
  }
  if (state.invulnerable <= 0) {
    for (const obstacle of obstacles) {
      if (obstacle.hit || obstacle.lane !== state.lane) continue;
      if (Math.abs(obstacle.progress - state.progress) < .95) {
        const safe = obstacle.kind === 'arch' ? state.slideTime > .15 : state.jumpY > .92;
        obstacle.hit = true;
        if (!safe) { state.stumbleTime = .9; state.chaserGap = Math.max(1.1, state.chaserGap - 1.9); }
      }
    }
  }
  collectCoins(dt, lanePose);

  const targetGap = 5.5 - (state.stumbleTime > 0 ? 3.1 : 0) + (state.boostTime > 0 ? 1.6 : 0);
  state.chaserGap += (targetGap - state.chaserGap) * Math.min(1, dt * 1.4);
  const beastProgress = Math.max(0, state.progress - state.chaserGap);
  const beastPose = track.getPose(beastProgress);
  if (state.progress < state.chaserGap) beastPose.position.addScaledVector(beastPose.tangent, -(state.chaserGap - state.progress));
  beast.update(dt, beastPose, state.stumbleTime > 0 ? 1 : 0);
  if (state.chaserGap < 1.25 && state.invulnerable <= 0) { failRun(); return; }

  for (const item of [...obstacles, ...coinVisuals, ...pickups]) {
    if (item.progress < state.progress - 32) {
      scene.remove(item.mesh);
      const list = item.mesh.userData.kind ? obstacles : coinVisuals.includes(item) ? coinVisuals : pickups;
      const index = list.indexOf(item); if (index >= 0) list.splice(index, 1);
    }
  }
  $('distance').textContent = Math.floor(state.distance);
  $('coins').textContent = state.coins;
  $('magnet-status').classList.toggle('hidden', state.magnetTime <= 0);
  $('boost-status').classList.toggle('hidden', state.boostTime <= 0);
  $('magnet-time').textContent = Math.ceil(state.magnetTime);
  $('boost-time').textContent = Math.ceil(state.boostTime);
  if (state.stumbleTime > 0) $('warning').classList.remove('hidden');
  else $('warning').classList.add('hidden');
  cameraRig.update(dt, runner.root.position, lanePose.tangent, state.jumpY);
}

resetRun();

const clock = new THREE.Clock();
function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), .04);
  if (state.active && !state.paused) updateWorld(dt);
  runFrame += dt;
  for (const coin of coinVisuals) if (!coin.taken) coin.mesh.rotation.y += dt * 2.2;
  for (const power of pickups) if (!power.taken) { power.mesh.rotation.y += dt * 2.6; power.mesh.position.y += Math.sin(runFrame * 3 + power.progress) * .0015; }
  renderer.render(scene, camera);
}
frame();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.5));
});
