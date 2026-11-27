import test from 'node:test';
import assert from 'node:assert/strict';
import { disposeObjectGeometries, removeAndDisposeObject } from '../src/three-resource-cleanup.js';

function node(geometry = null, children = []) {
  return {
    geometry,
    children,
    traverse(callback) {
      callback(this);
      for (const child of this.children) child.traverse(callback);
    }
  };
}

function geometry() {
  return { disposeCount: 0, dispose() { this.disposeCount++; } };
}

test('disposes every unique geometry once across a generated object tree', () => {
  const shared = geometry();
  const first = geometry();
  const second = geometry();
  const root = node(null, [node(first), node(shared), node(null, [node(second), node(shared)])]);
  const material = { disposed: false };
  root.material = material;

  assert.equal(disposeObjectGeometries(root), 3);
  assert.equal(first.disposeCount, 1);
  assert.equal(shared.disposeCount, 1);
  assert.equal(second.disposeCount, 1);
  assert.equal(material.disposed, false);
});

test('removes a generated object from its parent and disposes its geometry', () => {
  const geometryA = geometry();
  const geometryB = geometry();
  const child = node(null, [node(geometryA), node(geometryB)]);
  const parent = {
    children: [child],
    remove(object) { this.children = this.children.filter(item => item !== object); }
  };

  assert.equal(removeAndDisposeObject(parent, child), 2);
  assert.deepEqual(parent.children, []);
  assert.equal(geometryA.disposeCount, 1);
  assert.equal(geometryB.disposeCount, 1);
});

test('cleanup safely ignores missing roots and objects', () => {
  assert.equal(disposeObjectGeometries(null), 0);
  assert.equal(removeAndDisposeObject(null, {}), 0);
  assert.equal(removeAndDisposeObject({ remove() {} }, null), 0);
});
