import test from 'node:test';
import assert from 'node:assert/strict';
import { getRenderPixelRatio, MAX_RENDER_PIXEL_RATIO } from '../src/render-config.js';

test('keeps ordinary display pixel ratios unchanged', () => {
  assert.equal(getRenderPixelRatio(1), 1);
  assert.equal(getRenderPixelRatio(1.25), 1.25);
  assert.equal(getRenderPixelRatio(1.5), 1.5);
});

test('caps high-density displays at the mobile GPU budget', () => {
  assert.equal(getRenderPixelRatio(2), MAX_RENDER_PIXEL_RATIO);
  assert.equal(getRenderPixelRatio(3), MAX_RENDER_PIXEL_RATIO);
  assert.equal(getRenderPixelRatio(4), 1.5);
});

test('uses a safe ratio when the device value is invalid', () => {
  assert.equal(getRenderPixelRatio(undefined), 1);
  assert.equal(getRenderPixelRatio(Number.NaN), 1);
  assert.equal(getRenderPixelRatio(0), 1);
  assert.equal(getRenderPixelRatio(-2), 1);
});
