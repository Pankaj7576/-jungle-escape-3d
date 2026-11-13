import * as THREE from 'three';

const UP = new THREE.Vector3(0, 1, 0);

function ribbonGeometry(curve, width, startT, endT, steps = 24) {
  const positions = [], uvs = [], indices = [];
  for (let i = 0; i <= steps; i++) {
    const t = startT + (endT - startT) * i / steps;
    const p = curve.getPointAt(t), tangent = curve.getTangentAt(t).normalize();
    const right = tangent.clone().cross(UP).normalize();
    const left = p.clone().addScaledVector(right, -width * .5);
    const rightEdge = p.clone().addScaledVector(right, width * .5);
    positions.push(left.x, left.y, left.z, rightEdge.x, rightEdge.y, rightEdge.z);
    uvs.push(0, t * 8, 1, t * 8);
    if (i < steps) {
      const a = i * 2;
      indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export class TrackSystem {
  constructor(scene, materials, options = {}) {
    this.scene = scene;
    this.mats = materials;
    this.width = options.width || 7.6;
    this.radius = options.turnRadius || 9;
    this.pieces = [];
    this.nextAnchor = new THREE.Vector3(0, 0, -10);
    this.heading = 0;
    this.distance = 0;
    this.turnCooldown = 0;
    this.serial = 0;
    for (let i = 0; i < 3; i++) this.addPiece('straight');
  }

  transformLocal(v) {
    return v.applyAxisAngle(UP, this.heading).add(this.nextAnchor.clone());
  }

  addPiece(kind = 'straight', direction = 'right') {
    const group = new THREE.Group();
    const start = this.distance;
    let curve, length;
    if (kind === 'turn') {
      const r = this.radius, sign = direction === 'right' ? 1 : -1;
      const p0 = this.transformLocal(new THREE.Vector3(0, 0, 0));
      const p1 = this.transformLocal(new THREE.Vector3(0, 0, -r * .55));
      const p2 = this.transformLocal(new THREE.Vector3(sign * r * .45, 0, -r));
      const p3 = this.transformLocal(new THREE.Vector3(sign * r, 0, -r));
      curve = new THREE.CubicBezierCurve3(p0, p1, p2, p3);
      length = curve.getLength();
      this.nextAnchor.copy(p3);
      this.heading += sign * -Math.PI / 2;
      this.turnCooldown = 3;
    } else {
      const p0 = this.transformLocal(new THREE.Vector3(0, 0, 0));
      const p1 = this.transformLocal(new THREE.Vector3(0, 0, -25));
      curve = new THREE.LineCurve3(p0, p1);
      length = 25;
      this.nextAnchor.copy(p1);
      if (this.turnCooldown > 0) this.turnCooldown--;
    }
    const piece = {
      id: this.serial++, kind, direction, group, curve, start,
      end: start + length, length,
      gapStart: kind === 'gap' ? start + length * .39 : null,
      gapEnd: kind === 'gap' ? start + length * .61 : null
    };
    this.buildPiece(piece);
    this.scene.add(group);
    this.pieces.push(piece);
    this.distance += length;
    return piece;
  }

  buildPiece(piece) {
    const g = piece.group, curve = piece.curve;
    const addDeck = (a, b) => {
      const mesh = new THREE.Mesh(ribbonGeometry(curve, this.width, a, b, 28), this.mats.deck);
      mesh.receiveShadow = true;
      g.add(mesh);
      const stoneEdge = new THREE.Mesh(ribbonGeometry(curve, this.width + .28, a, b, 28), this.mats.foundation);
      stoneEdge.position.y = -.24;
      stoneEdge.receiveShadow = true;
      g.add(stoneEdge);
    };
    if (piece.kind === 'gap') {
      addDeck(0, .37);
      addDeck(.63, 1);
      piece.gapStart = piece.start + piece.length * .37;
      piece.gapEnd = piece.start + piece.length * .63;
    } else addDeck(0, 1);

    const railMaterial = this.mats.rail;
    for (const side of [-1, 1]) {
      for (let i = 0; i <= 12; i++) {
        const t = i / 12, p = curve.getPointAt(t), tangent = curve.getTangentAt(t).normalize();
        const right = tangent.clone().cross(UP).normalize();
        const postPos = p.clone().addScaledVector(right, side * (this.width * .5 - .12));
        const post = new THREE.Mesh(new THREE.BoxGeometry(.22, .92, .28), this.mats.parapet);
        post.position.copy(postPos); post.position.y += .35;
        post.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), tangent);
        post.castShadow = true; post.receiveShadow = true; g.add(post);
      }
      const points = [];
      for (let i = 0; i <= 32; i++) {
        const p = curve.getPointAt(i / 32), tangent = curve.getTangentAt(i / 32).normalize();
        points.push(p.addScaledVector(tangent.clone().cross(UP).normalize(), side * (this.width * .5 - .12)).add(new THREE.Vector3(0, .83, 0)));
      }
      const rail = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points), 40, .105, 6, false), railMaterial);
      rail.castShadow = true; g.add(rail);
    }
    if (piece.kind === 'turn') {
      const marker = new THREE.Mesh(new THREE.TorusGeometry(1.15, .1, 7, 20, Math.PI), this.mats.gold);
      const p = curve.getPointAt(.48); marker.position.copy(p); marker.position.y += .25;
      marker.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), curve.getTangentAt(.48));
      g.add(marker);
    }
  }

  ensureAhead(progress, horizon = 220) {
    while (this.distance < progress + horizon) {
      let kind = 'straight', direction = Math.random() < .5 ? 'left' : 'right';
      if (this.turnCooldown === 0 && this.pieces.length > 4 && Math.random() < .17) kind = 'turn';
      else if (this.pieces.length > 3 && Math.random() < .13) kind = 'gap';
      this.addPiece(kind, direction);
    }
  }

  getPose(progress, laneOffset = 0) {
    let piece = this.pieces.find(p => progress >= p.start && progress <= p.end);
    if (!piece) piece = progress < this.pieces[0].start ? this.pieces[0] : this.pieces[this.pieces.length - 1];
    const t = THREE.MathUtils.clamp((progress - piece.start) / piece.length, 0, 1);
    const position = piece.curve.getPointAt(t);
    const tangent = piece.curve.getTangentAt(t).normalize();
    const right = tangent.clone().cross(UP).normalize();
    position.addScaledVector(right, laneOffset);
    return { position, tangent, right, piece, t };
  }

  gapAt(progress) {
    return this.pieces.find(p => p.kind === 'gap' && progress >= p.gapStart && progress <= p.gapEnd) || null;
  }

  pruneBehind(progress, keep = 45) {
    while (this.pieces.length > 4 && this.pieces[1].end < progress - keep) {
      const old = this.pieces.shift();
      this.scene.remove(old.group);
      old.group.traverse(o => { if (o.geometry) o.geometry.dispose(); });
    }
  }
}

export function makeWorldObstacle(scene, materials, pose, lane, kind) {
  const group = new THREE.Group();
  group.position.copy(pose.position);
  group.position.y = 0;
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, -1), pose.tangent);
  const add = (geo, material, pos, scale = [1, 1, 1]) => {
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.set(...pos); mesh.scale.set(...scale);
    mesh.castShadow = true; mesh.receiveShadow = true; group.add(mesh);
  };
  if (kind === 'rock') add(new THREE.DodecahedronGeometry(.72, 1), materials.rock, [lane, .62, 0], [1, .9, 1]);
  if (kind === 'wall') add(new THREE.BoxGeometry(1.8, 1.35, .55), materials.stone, [lane, .68, 0]);
  if (kind === 'arch') {
    add(new THREE.BoxGeometry(2.25, .28, .35), materials.bark, [lane, 1.62, 0]);
    add(new THREE.BoxGeometry(.18, 1.55, .35), materials.bark, [lane - 1.05, .78, 0]);
    add(new THREE.BoxGeometry(.18, 1.55, .35), materials.bark, [lane + 1.05, .78, 0]);
  }
  group.userData.kind = kind;
  scene.add(group);
  return group;
}

export function makeCoin(scene, materials, pose, lane, isPowerup = false, type = 'magnet') {
  const group = new THREE.Group();
  group.position.copy(pose.position);
  group.position.addScaledVector(pose.right, lane);
  group.position.y += isPowerup ? 1.15 : 1.0;
  group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), pose.tangent);
  const color = isPowerup ? (type === 'magnet' ? 0x55d9ff : 0xffa52f) : 0xd8a93e;
  const material = isPowerup ? new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: .55, metalness: .45, roughness: .25 }) : materials.gold;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(isPowerup ? .42 : .28, isPowerup ? .1 : .075, 8, 18), material);
  ring.rotation.y = Math.PI / 2; ring.castShadow = true; group.add(ring);
  if (isPowerup) {
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.22), material);
    group.add(core);
  }
  scene.add(group);
  return group;
}
