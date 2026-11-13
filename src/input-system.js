const SWIPE_THRESHOLD = 36;
const AXIS_DOMINANCE = 1.2;

/**
 * Convert one completed pointer gesture into exactly one runner action.
 * Short taps, jitter and ambiguous diagonals intentionally do nothing.
 */
export function classifySwipe(startX, startY, endX, endY) {
  const dx = endX - startX;
  const dy = endY - startY;
  const absX = Math.abs(dx);
  const absY = Math.abs(dy);
  const dominant = Math.max(absX, absY);
  const minor = Math.min(absX, absY);

  if (dominant < SWIPE_THRESHOLD || dominant < minor * AXIS_DOMINANCE) return null;
  if (absX >= absY) return dx < 0 ? 'left' : 'right';
  return dy < 0 ? 'jump' : 'slide';
}

/**
 * Bind isolated pointer, on-screen button and keyboard input.
 * A lane change can only come from one completed horizontal swipe,
 * one control-button press, or one non-repeating keyboard press.
 */
export function bindGameInput({ canvas, controlsRoot, action, onPause, keyboardTarget = window }) {
  if (!canvas || !controlsRoot || typeof action !== 'function') {
    throw new TypeError('canvas, controlsRoot and action are required');
  }

  let activePointer = null;

  const onPointerDown = event => {
    if (event.isPrimary === false || event.button !== 0 || activePointer) return;
    if (event.target !== canvas) return;
    event.preventDefault();
    activePointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    try {
      canvas.setPointerCapture?.(event.pointerId);
    } catch {
      // Window-level pointerup still completes the gesture on older browsers.
    }
  };

  const finishPointer = (event, shouldAct) => {
    if (!activePointer || event.pointerId !== activePointer.id) return;
    const start = activePointer;
    activePointer = null;
    if (shouldAct) {
      event.preventDefault();
      const gesture = classifySwipe(start.x, start.y, event.clientX, event.clientY);
      if (gesture) action(gesture);
    }
    try {
      if (canvas.hasPointerCapture?.(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    } catch {
      // Pointer capture may already have been released by the browser.
    }
  };

  const onPointerUp = event => finishPointer(event, true);
  const onPointerCancel = event => finishPointer(event, false);
  const onLostPointerCapture = event => {
    if (activePointer && event.pointerId === activePointer.id) activePointer = null;
  };

  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('lostpointercapture', onLostPointerCapture);
  keyboardTarget.addEventListener('pointerup', onPointerUp);
  keyboardTarget.addEventListener('pointercancel', onPointerCancel);

  const buttonCleanups = [];
  for (const button of controlsRoot.querySelectorAll('[data-action]')) {
    const onButtonDown = event => {
      if (event.isPrimary === false || event.button !== 0) return;
      event.preventDefault();
      event.stopPropagation();
      action(button.dataset.action);
    };
    button.addEventListener('pointerdown', onButtonDown);
    buttonCleanups.push(() => button.removeEventListener('pointerdown', onButtonDown));
  }

  const keyActions = new Map([
    ['ArrowLeft', 'left'], ['KeyA', 'left'],
    ['ArrowRight', 'right'], ['KeyD', 'right'],
    ['ArrowUp', 'jump'], ['KeyW', 'jump'], ['Space', 'jump'],
    ['ArrowDown', 'slide'], ['KeyS', 'slide']
  ]);
  const onKeyDown = event => {
    if (event.repeat) return;
    const target = event.target;
    if (target?.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target?.tagName || '')) return;
    if (event.code === 'Escape') {
      event.preventDefault();
      onPause?.();
      return;
    }
    const name = keyActions.get(event.code);
    if (!name) return;
    event.preventDefault();
    action(name);
  };
  keyboardTarget.addEventListener('keydown', onKeyDown);

  return () => {
    canvas.removeEventListener('pointerdown', onPointerDown);
    canvas.removeEventListener('lostpointercapture', onLostPointerCapture);
    keyboardTarget.removeEventListener('pointerup', onPointerUp);
    keyboardTarget.removeEventListener('pointercancel', onPointerCancel);
    keyboardTarget.removeEventListener('keydown', onKeyDown);
    for (const cleanup of buttonCleanups) cleanup();
    activePointer = null;
  };
}
