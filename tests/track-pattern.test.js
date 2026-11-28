import test from 'node:test';
import assert from 'node:assert/strict';
import { createTrackPattern } from '../src/track-pattern.js';

test('inserts two safe bridge sections between generated gaps', () => {
  const next = createTrackPattern({ random: () => 0, turnChance: 0, gapChance: 1 });
  const pattern = Array.from({ length: 8 }, () => next());

  assert.deepEqual(pattern, [
    'bridge', 'bridge', 'bridge', 'gap',
    'bridge', 'bridge', 'gap', 'bridge'
  ]);
});

test('keeps turn junctions and a short safe approach after turns', () => {
  const next = createTrackPattern({ random: () => 0, turnChance: 1, gapChance: 1 });
  const pattern = Array.from({ length: 15 }, () => next());

  assert.equal(pattern[10], 'turnLeft');
  assert.deepEqual(pattern.slice(11, 14), ['bridge', 'bridge', 'bridge']);
  assert.equal(pattern[14], 'gap');
});

test('uses the right turn when the direction roll is above one half', () => {
  let calls = 0;
  const next = createTrackPattern({
    random: () => (++calls === 2 ? 0.8 : 0),
    turnChance: 1,
    gapChance: 0,
    gapAfterSegments: Number.POSITIVE_INFINITY
  });
  const pattern = Array.from({ length: 11 }, () => next());
  assert.equal(pattern[10], 'turnRight');
});

test('rejects a non-function random source', () => {
  assert.throws(() => createTrackPattern({ random: 1 }), /random must be a function/);
});
