import test from 'node:test';
import assert from 'node:assert/strict';
import { createRenderLoop } from '../src/render-loop.js';

function makeFrameScheduler() {
  let nextId = 1;
  const pending = new Map();
  const cancelled = [];

  return {
    request(callback) {
      const id = nextId++;
      pending.set(id, callback);
      return id;
    },
    cancel(id) {
      cancelled.push(id);
      pending.delete(id);
    },
    flush(timestamp) {
      const entry = pending.entries().next().value;
      assert.ok(entry, 'an animation frame should be pending');
      const [id, callback] = entry;
      pending.delete(id);
      callback(timestamp);
    },
    get pendingCount() { return pending.size; },
    get cancelled() { return [...cancelled]; }
  };
}

test('schedules only one frame and advances using bounded frame deltas', () => {
  const scheduler = makeFrameScheduler();
  const deltas = [];
  let renders = 0;
  const loop = createRenderLoop({
    update: delta => deltas.push(delta),
    render: () => renders++,
    requestFrame: callback => scheduler.request(callback),
    cancelFrame: id => scheduler.cancel(id)
  });

  assert.equal(scheduler.pendingCount, 1);
  assert.equal(loop.start(), false);
  scheduler.flush(1000);
  scheduler.flush(1016);

  assert.deepEqual(deltas, [0, 0.016]);
  assert.equal(renders, 2);
  assert.equal(scheduler.pendingCount, 1);
  loop.dispose();
  assert.equal(scheduler.pendingCount, 0);
});

test('stopping cancels the pending frame and restarting resets elapsed time', () => {
  const scheduler = makeFrameScheduler();
  const deltas = [];
  const loop = createRenderLoop({
    update: delta => deltas.push(delta),
    render() {},
    requestFrame: callback => scheduler.request(callback),
    cancelFrame: id => scheduler.cancel(id)
  });

  scheduler.flush(100);
  assert.equal(loop.stop(), true);
  assert.equal(scheduler.pendingCount, 0);
  assert.equal(loop.running, false);

  assert.equal(loop.start(), true);
  scheduler.flush(9000);
  assert.deepEqual(deltas, [0, 0]);
  assert.equal(scheduler.pendingCount, 1);
  loop.dispose();
});

test('caps a delayed frame at the configured maximum delta', () => {
  const scheduler = makeFrameScheduler();
  const deltas = [];
  const loop = createRenderLoop({
    update: delta => deltas.push(delta),
    render() {},
    requestFrame: callback => scheduler.request(callback),
    cancelFrame: id => scheduler.cancel(id),
    maxDeltaSeconds: 0.025
  });

  scheduler.flush(100);
  scheduler.flush(5100);
  assert.deepEqual(deltas, [0, 0.025]);
  loop.dispose();
});

test('dispose permanently prevents the loop from restarting', () => {
  const scheduler = makeFrameScheduler();
  const loop = createRenderLoop({
    update() {},
    render() {},
    requestFrame: callback => scheduler.request(callback),
    cancelFrame: id => scheduler.cancel(id)
  });

  loop.dispose();
  assert.equal(loop.running, false);
  assert.equal(loop.start(), false);
  assert.equal(scheduler.pendingCount, 0);
});
