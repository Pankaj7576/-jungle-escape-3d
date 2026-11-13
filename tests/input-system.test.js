import test from 'node:test';
import assert from 'node:assert/strict';
import { classifySwipe } from '../src/input-system.js';

test('ignores taps and small touch jitter', () => {
  assert.equal(classifySwipe(100, 100, 135, 100), null);
  assert.equal(classifySwipe(100, 100, 101, 118), null);
});

test('maps a deliberate horizontal swipe to one lane action', () => {
  assert.equal(classifySwipe(180, 100, 120, 104), 'left');
  assert.equal(classifySwipe(120, 100, 181, 96), 'right');
});

test('maps vertical swipes to jump and slide', () => {
  assert.equal(classifySwipe(100, 180, 104, 120), 'jump');
  assert.equal(classifySwipe(100, 120, 96, 181), 'slide');
});

test('rejects ambiguous diagonal gestures', () => {
  assert.equal(classifySwipe(100, 100, 160, 150), null);
  assert.equal(classifySwipe(100, 100, 150, 160), null);
});
