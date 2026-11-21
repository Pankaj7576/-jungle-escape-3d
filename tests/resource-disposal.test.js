import test from 'node:test';
import assert from 'node:assert/strict';
import { disposeWorldObject } from '../src/resource-disposal.js';

function disposable() {
  let calls = 0;
  return {
    dispose() { calls++; },
    get calls() { return calls; }
  };
}

function node({ geometry = null, children = [], userData = {} } = {}) {
  return {
    geometry,
    children,
    userData,
    traverse(visitor) {
      visitor(this);
      for (const child of this.children) child.traverse(visitor);
    }
  };
}

test('disposes each unique geometry in the removed object tree once', () => {
  const sharedGeometry = disposable();
  const secondGeometry = disposable();
  const root = node({
    children: [
      node({ geometry: sharedGeometry }),
      node({ geometry: sharedGeometry }),
      node({ geometry: secondGeometry })
    ]
  });

  assert.equal(disposeWorldObject(root), true);
  assert.equal(sharedGeometry.calls, 1);
  assert.equal(secondGeometry.calls, 1);
});

test('disposes object-owned materials but preserves shared scene materials', () => {
  const ownedMaterial = disposable();
  const sharedMaterial = disposable();
  const root = node({ userData: { ownedMaterials: [ownedMaterial, ownedMaterial] } });

  assert.equal(disposeWorldObject(root), true);
  assert.equal(ownedMaterial.calls, 1);
  assert.equal(sharedMaterial.calls, 0);
  assert.deepEqual(root.userData.ownedMaterials, []);
});

test('cleanup is idempotent when a collected item is later pruned or reset', () => {
  const geometry = disposable();
  const material = disposable();
  const root = node({ geometry, userData: { ownedMaterials: [material] } });

  assert.equal(disposeWorldObject(root), true);
  assert.equal(disposeWorldObject(root), false);
  assert.equal(geometry.calls, 1);
  assert.equal(material.calls, 1);
});

test('ignores null or non-Object3D values safely', () => {
  assert.equal(disposeWorldObject(null), false);
  assert.equal(disposeWorldObject({ userData: {} }), false);
});
