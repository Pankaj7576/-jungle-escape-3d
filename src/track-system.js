import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

/**
 * Three.js port of UnityMigration/Assets/Scripts/Track/{TrackDirector,TrackSegment}.cs.
 * It uses the exact Unity-generated GLB modules and their Entry/Exit/PathNode anchors.
 * The Unity project itself is not used to run this web/Capacitor game.
 */
export class TrackSystem {
  constructor(scene, onSegmentAdded = () => {}) {
    this.scene = scene;
    this.onSegmentAdded = onSegmentAdded;
    this.loader = new GLTFLoader();
    this.templates = {};
    this.active = [];
    this.progress = 0;
    this.segmentsAhead = 8;
    this.keepBehind = 2;
    this.turnChance = 0.12;
    this.gapChance = 0.10;
    this.straightSegmentsBetweenTurns = 2;
    this.turnCooldown = 0;
    this.random = Math.random;
    this.ready = this.loadModules().then(() => {
      this.reset();
      return true;
    });
  }

  async loadModules() {
    const entries = [
      ['straight', '/models/unity_bridge_straight_18m.glb'],
      ['left', '/models/unity_bridge_turn_left_90.glb'],
      ['right', '/models/unity_bridge_turn_right_90.glb'],
      ['gap', '/models/unity_bridge_broken_gap.glb']
    ];
    await Promise.all(entries.map(async ([key, url]) => {
      const gltf = await this.loader.loadAsync(url);
      const root = gltf.scene;
      root.traverse(node => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });
      const find = name => {
        let result = null;
        root.traverse(node => { if (!result && node.name === name) result = node; });
        return result;
      };
      const entry = find('Entry');
      const exit = find('Exit');
      if (!entry || !exit) throw new Error(url + ' is missing the Unity Entry/Exit anchors');
      const pathNodes = [];
      root.traverse(node => {
        const match = /^PathNode_(\d+)$/i.exec(node.name);
        if (match) pathNodes.push({ order: Number(match[1]), node });
      });
      pathNodes.sort((a, b) => a.order - b.order);
      this.templates[key] = { root, entry, exit, pathNodes: pathNodes.map(item => item.node) };
    }));
  }

  reset() {
    for (const segment of this.active) this.scene.remove(segment.root);
    this.active.length = 0;
    this.progress = 0;
    this.turnCooldown = 0;
    const forward = new THREE.Vector3(0, 0, -1);
    const target = this.anchorQuaternion(forward);
    this.append('straight', new THREE.Vector3(0, 0, 0), target);
    while (this.active.length < this.segmentsAhead) this.appendNext();
  }

  anchorQuaternion(forward) {
    const up = new THREE.Vector3(0, 1, 0);
    const right = new THREE.Vector3().crossVectors(forward, up).normalize();
    const correctedUp = new THREE.Vector3().crossVectors(right, forward).normalize();
    const basis = new THREE.Matrix4().makeBasis(right, forward, correctedUp);
    return new THREE.Quaternion().setFromRotationMatrix(basis);
  }

  append(key, targetPosition, targetQuaternion) {
    const template = this.templates[key];
    if (!template) throw new Error('Unity bridge module not loaded: ' + key);
    const root = template.root.clone(true);
    // Blender modules use +Y as forward and +Z as up; rotate into Three.js Y-up/-Z-forward.
    root.rotation.set(-Math.PI / 2, 0, 0);
    root.position.set(0, 0, 0);
    root.scale.set(1, 1, 1);
    root.updateMatrixWorld(true);

    const entry = this.findNode(root, 'Entry');
    const exit = this.findNode(root, 'Exit');
    const nodes = [];
    root.traverse(node => {
      const match = /^PathNode_(\d+)$/i.exec(node.name);
      if (match) nodes.push({ order: Number(match[1]), node });
    });
    nodes.sort((a, b) => a.order - b.order);

    const entryWorld = entry.getWorldPosition(new THREE.Vector3());
    const entryWorldQ = entry.getWorldQuaternion(new THREE.Quaternion());
    const localEntry = root.worldToLocal(entryWorld.clone());
    const localEntryQ = root.quaternion.clone().invert().multiply(entryWorldQ);
    const rootQ = targetQuaternion.clone().multiply(localEntryQ.invert());
    root.quaternion.copy(rootQ);
    root.position.copy(targetPosition).sub(localEntry.applyQuaternion(rootQ));
    root.updateMatrixWorld(true);

    this.scene.add(root);
    const points = [entry, ...nodes.map(item => item.node), exit]
      .map(node => node.getWorldPosition(new THREE.Vector3()));
    const clean = [];
    for (const point of points) {
      if (!clean.length || point.distanceTo(clean[clean.length - 1]) > 0.02) clean.push(point);
    }
    let length = 0;
    for (let i = 1; i < clean.length; i++) length += clean[i].distanceTo(clean[i - 1]);
    const exitWorldQ = exit.getWorldQuaternion(new THREE.Quaternion());
    const segment = {
      key, root, points: clean, length,
      startDistance: this.active.length ? this.active[this.active.length - 1].startDistance + this.active[this.active.length - 1].length : 0,
      endDistance: 0,
      isGap: key === 'gap',
      gapStart: 7,
      gapEnd: 11,
      exitPosition: exit.getWorldPosition(new THREE.Vector3()),
      exitQuaternion: exitWorldQ
    };
    segment.endDistance = segment.startDistance + segment.length;
    this.active.push(segment);
    this.onSegmentAdded(segment);
    return segment;
  }

  findNode(root, name) {
    let found = null;
    root.traverse(node => { if (!found && node.name === name) found = node; });
    return found;
  }

  chooseNext() {
    const roll = this.random();
    const difficulty = Math.min(1, this.progress / 1200);
    const turnChance = Math.min(0.20, this.turnChance + difficulty * 0.06);
    const gapChance = Math.min(0.16, this.gapChance + difficulty * 0.06);
    if (this.turnCooldown === 0 && roll < turnChance) {
      this.turnCooldown = this.straightSegmentsBetweenTurns;
      return this.random() < 0.5 ? 'left' : 'right';
    }
    if (roll >= turnChance && roll < turnChance + gapChance) {
      this.turnCooldown = Math.max(this.turnCooldown, 1);
      return 'gap';
    }
    if (this.turnCooldown > 0) this.turnCooldown--;
    return 'straight';
  }

  appendNext() {
    const previous = this.active[this.active.length - 1];
    const key = this.chooseNext();
    this.append(key, previous.exitPosition.clone(), previous.exitQuaternion.clone());
  }

  update(distance) {
    this.progress = distance;
    while (this.active.length < this.segmentsAhead ||
      this.active[this.active.length - 1].endDistance < distance + 100) this.appendNext();
    while (this.active.length > this.keepBehind + 1 &&
      this.active[0].endDistance < distance - 36) {
      const old = this.active.shift();
      this.scene.remove(old.root);
    }
  }

  sample(distance, laneOffset = 0) {
    let segment = this.active.find(item => distance >= item.startDistance - 0.001 &&
      distance <= item.endDistance + 0.001);
    if (!segment) segment = distance < 0 ? this.active[0] : this.active[this.active.length - 1];
    const local = THREE.MathUtils.clamp(distance - segment.startDistance, 0, segment.length);
    let travelled = 0;
    let center = segment.points[0].clone();
    let forward = new THREE.Vector3(0, 0, -1);
    for (let i = 1; i < segment.points.length; i++) {
      const a = segment.points[i - 1], b = segment.points[i];
      const delta = b.clone().sub(a);
      const span = delta.length();
      if (travelled + span >= local || i === segment.points.length - 1) {
        const t = span > 0 ? THREE.MathUtils.clamp((local - travelled) / span, 0, 1) : 0;
        center = a.clone().lerp(b, t);
        forward = span > 0 ? delta.normalize() : forward;
        break;
      }
      travelled += span;
    }
    forward.y = 0;
    if (forward.lengthSq() < 0.0001) forward.set(0, 0, -1);
    forward.normalize();
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    center.addScaledVector(right, laneOffset);
    return { position: center, forward, right, segment, localDistance: local };
  }

  isGapAt(distance) {
    const frame = this.sample(distance, 0);
    return frame.segment.isGap &&
      frame.localDistance >= frame.segment.gapStart &&
      frame.localDistance <= frame.segment.gapEnd;
  }
}
