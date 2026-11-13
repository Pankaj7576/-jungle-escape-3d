import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const capsule = (r, h, material) => new THREE.Mesh(new THREE.CapsuleGeometry(r, h, 5, 9), material);
function part(parent, geometry, material, position) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}

export class RunnerCharacter {
  constructor(scene) {
    this.scene = scene;
    this.root = new THREE.Group();
    this.scene.add(this.root);
    this.mixer = null;
    this.actions = {};
    this.activeAction = null;
    this.state = 'run';
    this.phase = 0;
    this.fallback = this.buildFallback();
    this.root.add(this.fallback);
    this.loadPremiumModel();
  }

  buildFallback() {
    const root = new THREE.Group();
    const jacket = new THREE.MeshStandardMaterial({ color: 0x17232b, roughness: .72 });
    const trim = new THREE.MeshStandardMaterial({ color: 0x333f45, roughness: .8 });
    const skin = new THREE.MeshStandardMaterial({ color: 0x986c50, roughness: .86 });
    const boot = new THREE.MeshStandardMaterial({ color: 0x151719, roughness: .9 });
    const torso = part(root, new THREE.CapsuleGeometry(.27, .52, 7, 12), jacket, [0, 1.18, 0]);
    torso.rotation.x = -.08;
    part(root, new THREE.BoxGeometry(.47, .12, .29), trim, [0, 1.43, .015]);
    part(root, new THREE.SphereGeometry(.17, 16, 12), skin, [0, 1.78, -.015]);
    part(root, new THREE.SphereGeometry(.18, 16, 12), jacket, [0, 1.93, -.035]);
    const joints = { arms: [], legs: [] };
    for (const side of [-1, 1]) {
      const arm = new THREE.Group(); arm.position.set(side * .3, 1.42, 0); root.add(arm);
      const upper = capsule(.09, .3, jacket); upper.position.y = -.18; arm.add(upper);
      const fore = new THREE.Group(); fore.position.y = -.38; arm.add(fore);
      const lower = capsule(.075, .28, skin); lower.position.y = -.16; fore.add(lower);
      joints.arms.push({ upper: arm, lower: fore, side });
      const leg = new THREE.Group(); leg.position.set(side * .15, .78, 0); root.add(leg);
      const thigh = capsule(.115, .32, jacket); thigh.position.y = -.19; leg.add(thigh);
      const shin = new THREE.Group(); shin.position.y = -.39; leg.add(shin);
      const calf = capsule(.09, .31, boot); calf.position.y = -.17; shin.add(calf);
      part(shin, new THREE.BoxGeometry(.2, .12, .34), boot, [0, -.34, -.07]);
      joints.legs.push({ upper: leg, lower: shin, side });
    }
    root.userData.joints = joints;
    return root;
  }

  loadPremiumModel() {
    new GLTFLoader().load('/models/character_black_suit_rigged.glb', gltf => {
      const model = gltf.scene;
      model.updateMatrixWorld(true);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = 1.86 / Math.max(size.y, .001);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -bounds.min.y * scale, -center.z * scale);
      model.rotation.y = Math.PI;
      model.traverse(node => {
        if (node.isMesh) { node.castShadow = true; node.receiveShadow = true; }
      });
      this.root.remove(this.fallback);
      this.root.add(model);
      this.fallback = null;
      if (gltf.animations?.length) {
        this.mixer = new THREE.AnimationMixer(model);
        for (const clip of gltf.animations) {
          const key = /jump|leap/i.test(clip.name) ? 'jump' : /slide|duck|roll/i.test(clip.name) ? 'slide' : /run|walk|jog/i.test(clip.name) ? 'run' : clip.name;
          this.actions[key] = this.mixer.clipAction(clip);
        }
        this.play(this.state);
      }
    }, undefined, error => console.warn('Using articulated fallback adventurer:', error));
  }

  play(state) {
    this.state = state;
    if (!this.mixer) return;
    const next = this.actions[state] || this.actions.run || Object.values(this.actions)[0];
    if (!next || next === this.activeAction) return;
    next.reset().fadeIn(.16).play();
    this.activeAction?.fadeOut(.16);
    this.activeAction = next;
  }

  update(dt, state = this.state, speed = 1) {
    this.play(state);
    this.phase += dt * (8 + speed * 1.6);
    if (this.mixer) this.mixer.update(dt);
    if (!this.fallback) return;
    const joints = this.fallback.userData.joints;
    const running = state === 'run';
    const sliding = state === 'slide';
    this.fallback.position.y = sliding ? -.35 : state === 'jump' ? .12 : 0;
    this.fallback.rotation.x = sliding ? -.65 : 0;
    for (const joint of joints.legs) {
      const swing = running ? Math.sin(this.phase + (joint.side < 0 ? Math.PI : 0)) * .72 : 0;
      joint.upper.rotation.x = sliding ? 1.15 : swing;
      joint.lower.rotation.x = sliding ? -.65 : Math.max(0, -swing) * 1.1;
    }
    for (const joint of joints.arms) {
      const swing = running ? Math.sin(this.phase + (joint.side > 0 ? Math.PI : 0)) * .62 : 0;
      joint.upper.rotation.x = sliding ? -.85 : -swing;
      joint.upper.rotation.z = joint.side * (sliding ? .2 : .08);
      joint.lower.rotation.x = sliding ? -.5 : -.25;
    }
  }
}

export class TempleBeast {
  constructor(scene) {
    this.root = new THREE.Group();
    this.scene = scene;
    const fur = new THREE.MeshStandardMaterial({ color: 0x101714, roughness: 1 });
    const furMid = new THREE.MeshStandardMaterial({ color: 0x202b26, roughness: .98 });
    const hide = new THREE.MeshStandardMaterial({ color: 0x29231e, roughness: .92 });
    const eye = new THREE.MeshStandardMaterial({ color: 0xff6a24, emissive: 0xc62c08, emissiveIntensity: 2.2 });
    part(this.root, new THREE.SphereGeometry(.58, 18, 14), fur, [0, 1.15, 0]).scale.set(1, 1.15, .78);
    part(this.root, new THREE.SphereGeometry(.43, 16, 12), furMid, [0, 1.95, -.1]);
    part(this.root, new THREE.SphereGeometry(.28, 14, 10), hide, [0, 1.82, -.43]).scale.set(1.2, .8, .7);
    for (const side of [-1, 1]) {
      part(this.root, new THREE.SphereGeometry(.075, 10, 8), eye, [side * .16, 2.02, -.48]);
      const arm = new THREE.Group(); arm.position.set(side * .52, 1.45, 0); this.root.add(arm);
      part(arm, new THREE.CapsuleGeometry(.19, .48, 5, 9), fur, [side * .1, -.32, .02]);
      part(arm, new THREE.SphereGeometry(.22, 12, 10), furMid, [side * .13, -.66, -.1]);
      const leg = new THREE.Group(); leg.position.set(side * .25, .55, .02); this.root.add(leg);
      part(leg, new THREE.CapsuleGeometry(.16, .32, 5, 8), fur, [0, -.18, 0]);
      this.root.userData[side < 0 ? 'leftArm' : 'rightArm'] = arm;
      this.root.userData[side < 0 ? 'leftLeg' : 'rightLeg'] = leg;
    }
    this.scene.add(this.root);
    this.phase = 0;
  }

  update(dt, pose, catchup = 0) {
    this.phase += dt * (7 + catchup * 3);
    this.root.position.copy(pose.position);
    this.root.position.y += .05 + Math.abs(Math.sin(this.phase)) * .08;
    this.root.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), pose.tangent);
    const swing = Math.sin(this.phase) * .55;
    this.root.userData.leftArm.rotation.x = swing - .25;
    this.root.userData.rightArm.rotation.x = -swing - .25;
    this.root.userData.leftLeg.rotation.x = -swing * .7;
    this.root.userData.rightLeg.rotation.x = swing * .7;
  }
}
