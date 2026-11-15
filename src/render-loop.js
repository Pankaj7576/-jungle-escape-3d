const DEFAULT_MAX_DELTA_SECONDS = 0.04;

/**
 * Run one animation frame at a time while active. Stopping resets the clock so
 * a page resumed from the background never receives a large simulation step.
 */
export function createRenderLoop({
  update,
  render,
  requestFrame,
  cancelFrame,
  maxDeltaSeconds = DEFAULT_MAX_DELTA_SECONDS
}) {
  if (typeof update !== 'function' || typeof render !== 'function') {
    throw new TypeError('update and render callbacks are required');
  }
  if (typeof requestFrame !== 'function' || typeof cancelFrame !== 'function') {
    throw new TypeError('requestFrame and cancelFrame callbacks are required');
  }
  if (!Number.isFinite(maxDeltaSeconds) || maxDeltaSeconds <= 0) {
    throw new RangeError('maxDeltaSeconds must be a positive finite number');
  }

  let frameId = null;
  let previousTimestamp = null;
  let running = false;
  let disposed = false;

  const tick = timestamp => {
    frameId = null;
    if (!running || disposed) return;

    const now = Number.isFinite(timestamp) ? timestamp : 0;
    const delta = previousTimestamp === null
      ? 0
      : Math.min(maxDeltaSeconds, Math.max(0, (now - previousTimestamp) / 1000));
    previousTimestamp = now;

    update(delta);
    render();

    if (running && !disposed) frameId = requestFrame(tick);
  };

  const start = () => {
    if (running || disposed) return false;
    running = true;
    previousTimestamp = null;
    frameId = requestFrame(tick);
    return true;
  };

  const stop = () => {
    if (!running) return false;
    running = false;
    if (frameId !== null) {
      cancelFrame(frameId);
      frameId = null;
    }
    previousTimestamp = null;
    return true;
  };

  const dispose = () => {
    if (disposed) return;
    stop();
    disposed = true;
  };

  start();
  return {
    start,
    stop,
    dispose,
    get running() { return running; }
  };
}
