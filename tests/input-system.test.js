import test from 'node:test';
import assert from 'node:assert/strict';
import { bindGameInput, classifySwipe } from '../src/input-system.js';

class FakeTarget {
  constructor() { this.listeners = new Map(); this.buttons = []; this.dataset = {}; }
  addEventListener(type, callback) {
    if (!this.listeners.has(type)) this.listeners.set(type, []);
    this.listeners.get(type).push(callback);
  }
  removeEventListener(type, callback) {
    this.listeners.set(type, (this.listeners.get(type) || []).filter(fn => fn !== callback));
  }
  querySelectorAll() { return this.buttons; }
  emit(type, values = {}) {
    const event = {
      target: this,
      preventDefault() {},
      stopPropagation() {},
      ...values
    };
    for (const callback of this.listeners.get(type) || []) callback(event);
  }
}

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

test('one canvas pointer gesture produces at most one lane action', () => {
  const canvas = new FakeTarget();
  const controls = new FakeTarget();
  const keyboard = new FakeTarget();
  const actions = [];
  bindGameInput({ canvas, controlsRoot: controls, keyboardTarget: keyboard, action: name => actions.push(name) });
  canvas.emit('pointerdown', { pointerId: 7, button: 0, isPrimary: true, clientX: 200, clientY: 100 });
  keyboard.emit('pointerup', { pointerId: 8, clientX: 100, clientY: 100 });
  assert.deepEqual(actions, []);
  keyboard.emit('pointerup', { pointerId: 7, clientX: 145, clientY: 101 });
  assert.deepEqual(actions, ['left']);
  keyboard.emit('pointerup', { pointerId: 7, clientX: 80, clientY: 100 });
  assert.deepEqual(actions, ['left']);
});

test('control buttons do not also trigger a canvas swipe', () => {
  const canvas = new FakeTarget();
  const controls = new FakeTarget();
  const keyboard = new FakeTarget();
  const rightButton = new FakeTarget();
  rightButton.dataset.action = 'right';
  controls.buttons = [rightButton];
  const actions = [];
  bindGameInput({ canvas, controlsRoot: controls, keyboardTarget: keyboard, action: name => actions.push(name) });
  rightButton.emit('pointerdown', { pointerId: 2, button: 0, isPrimary: true });
  keyboard.emit('pointerup', { pointerId: 2, clientX: 0, clientY: 0 });
  assert.deepEqual(actions, ['right']);
});

test('held keyboard keys do not auto-repeat lane changes', () => {
  const canvas = new FakeTarget();
  const controls = new FakeTarget();
  const keyboard = new FakeTarget();
  const actions = [];
  bindGameInput({ canvas, controlsRoot: controls, keyboardTarget: keyboard, action: name => actions.push(name) });
  const key = { code: 'ArrowRight', target: { tagName: 'BODY' } };
  keyboard.emit('keydown', { ...key, repeat: false });
  keyboard.emit('keydown', { ...key, repeat: true });
  assert.deepEqual(actions, ['right']);
});
