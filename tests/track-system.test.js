import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { TrackSystem } from '../src/track-system.js';

function makeMaterials() {
  const material = color => new THREE.MeshStandardMaterial({ color });
  return {
    deck: material(0x777777),
    foundation: material(0x333333),
    parapet: material(0x888888),
    rail: material(0x555555),
    gold: material(0xd8a93e)
  };
}

function inspectPosts(piece) {
  const instanced = [];
  const regularMeshes = [];
  piece.group.traverse(object => {
    if (object.isInstancedMesh) instanced.push(object);
    else if (object.isMesh) regularMeshes.push(object);
  });
  assert.equal(instanced.length, 1, 'each track piece should use one instanced post mesh');
  assert.equal(instanced[0].count, 26, 'each piece should retain 13 posts on both sides');
  assert.equal(instanced[0].instanceMatrix.count, 26);
  assert.equal(regularMeshes.length, 4, 'deck, foundation and two continuous rails remain separate');
}

test('straight track sections batch parapet posts into one instanced mesh', () => {
  const scene = new THREE.Scene();
  const track = new TrackSystem(scene, makeMaterials());
  inspectPosts(track.pieces[0]);
});

test('curved track sections preserve all parapet posts when instanced', () => {
  const scene = new THREE.Scene();
  const track = new TrackSystem(scene, makeMaterials());
  const turn = track.addPiece('turn', 'left');
  inspectPosts(turn);
});
