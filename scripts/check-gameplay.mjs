import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { lockHeroAnimationRootMotion } from '../src/hero-animation.js';

const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8');

function cloneTrack(track) {
  return {
    name: track.name,
    values: new Float32Array(track.values),
    clone() { return cloneTrack(this); }
  };
}
function cloneClip(clip) {
  return {
    name: clip.name,
    tracks: clip.tracks.map(cloneTrack),
    clone() { return cloneClip(this); }
  };
}

const originalClip = cloneClip({
  name: 'Run',
  tracks: [
    { name: 'Armature.position', values: [1, 0, 2, 3, 0.5, 4] },
    { name: 'Hips.quaternion', values: [0, 0, 0, 1, 0, 0.1, 0, 0.99] }
  ]
});
const originalPosition = [...originalClip.tracks[0].values];
const originalRotation = [...originalClip.tracks[1].values];
const lockedClip = lockHeroAnimationRootMotion([originalClip])[0];

assert.notEqual(lockedClip, originalClip, 'animation clips must be cloned');
assert.deepEqual([...lockedClip.tracks[0].values], [1, 0, 2, 1, 0.5, 2],
  'hero root X/Z must stay fixed while Y animation is preserved');
assert.deepEqual([...originalClip.tracks[0].values], originalPosition,
  'source animation data must not be mutated');
assert.deepEqual([...lockedClip.tracks[1].values], originalRotation,
  'rotation tracks must remain unchanged');
console.log('PASS: hero root motion is locked without mutating source clips');

const actionStart = main.indexOf('function action(a){');
const actionEnd = main.indexOf('\ndocument.querySelectorAll', actionStart);
assert.ok(actionStart >= 0 && actionEnd > actionStart, 'player action handler must exist');
const actionBlock = main.slice(actionStart, actionEnd);
assert.match(actionBlock, /if\(a==='left'\)lane=Math\.max\(0,lane-1\)/);
assert.match(actionBlock, /if\(a==='right'\)lane=Math\.min\(2,lane\+1\)/);
const laneWrites = [...main.matchAll(/\blane\s*=\s*Math\.(?:max|min)\(/g)];
assert.equal(laneWrites.length, 2, 'only left/right input may change the selected lane');
assert.ok(laneWrites.every((match) => match.index >= actionStart && match.index < actionEnd),
  'lane changes must remain inside the input handler');
assert.match(main, /hero\.position\.x\+=\(laneX\[lane\]-hero\.position\.x\)\*Math\.min\(1,dt\*12\)/);
assert.match(main, /url\.endsWith\('\/hero\.glb'\)\?lockHeroAnimationRootMotion\(gltf\.animations\):gltf\.animations/);
assert.ok(main.includes('hero.rotation.z=0;'), 'hero must not visually sway sideways while idle');
console.log('PASS: lane changes are input-driven and hero X follows the selected lane');

assert.ok(!main.includes('M.water') && !main.includes('water:mat') && !main.includes('stepping='),
  'rejected river and stepping-stone experiment must stay removed');
assert.ok(!/railway|railroad|rail track/i.test(main + html),
  'rejected railway experiment must stay removed');
assert.ok(!/jungle rivers|cross .*river/i.test(html),
  'start-screen copy must not advertise the rejected river section');
console.log('PASS: rejected river/railway content is absent');

assert.ok(html.includes('name="viewport"') && html.includes('viewport-fit=cover'));
assert.ok(main.includes('innerHeight>innerWidth?64:58'),
  'camera must retain the portrait-oriented mobile field of view');
console.log('PASS: portrait mobile layout configuration is present');
