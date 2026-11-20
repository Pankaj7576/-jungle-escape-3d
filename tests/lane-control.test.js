import test from 'node:test';
import assert from 'node:assert/strict';
import { applyLaneInput } from '../src/lane-control.js';

test('explicit left and right actions move exactly one lane', () => {
  assert.equal(applyLaneInput(1, 'left'), 0);
  assert.equal(applyLaneInput(1, 'right'), 2);
});

test('lane movement clamps at both outer lanes', () => {
  assert.equal(applyLaneInput(0, 'left'), 0);
  assert.equal(applyLaneInput(2, 'right'), 2);
});

test('jump, slide, pause and unknown actions never change the lane', () => {
  for (const action of ['jump', 'slide', 'pause', 'resume', null, undefined]) {
    assert.equal(applyLaneInput(1, action), 1);
  }
});

test('invalid lane state is rejected instead of silently drifting', () => {
  for (const lane of [-1, 3, 1.5, NaN]) {
    assert.throws(() => applyLaneInput(lane, 'left'), RangeError);
  }
});
