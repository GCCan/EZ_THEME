import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { effectScope, nextTick, ref } from 'vue';
import { useLandingHalo } from '../src/views/landing/composables/useLandingHalo';

const lifecycle = vi.hoisted(() => ({ mount: [], unmount: [] }));
const createHalo = vi.hoisted(() => vi.fn());
vi.mock('vue', async (original) => ({
  ...await original(),
  onMounted: (callback) => lifecycle.mount.push(callback),
  onUnmounted: (callback) => lifecycle.unmount.push(callback)
}));
vi.mock('three', () => ({}));
vi.mock('vanta/src/vanta.halo', () => ({ default: createHalo }));

let scope;
let motion;
let effect;
let isDark;
let isActive;
let idleCallback;

beforeEach(() => {
  lifecycle.mount = [];
  lifecycle.unmount = [];
  motion = Object.assign(new EventTarget(), { matches: false });
  const document = Object.assign(new EventTarget(), { hidden: false, documentElement: {} });
  const window = {
    devicePixelRatio: 3, innerWidth: 390,
    matchMedia: () => motion,
    requestIdleCallback: vi.fn((callback) => { idleCallback = callback; return 1; }),
    cancelIdleCallback: vi.fn()
  };
  vi.stubGlobal('document', document);
  vi.stubGlobal('window', window);
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '#10b981' }));
  vi.stubGlobal('cancelAnimationFrame', vi.fn());
  effect = {
    req: 7,
    destroy: vi.fn(), setOptions: vi.fn(), animationLoop: vi.fn(),
    renderer: { dispose: vi.fn(), forceContextLoss: vi.fn() },
    bufferTarget: { dispose: vi.fn() }, bufferFeedback: { dispose: vi.fn() },
    uniforms: { backgroundColor: { value: { set: vi.fn() } } }
  };
  createHalo.mockReset().mockReturnValue(effect);
  isDark = ref(false);
  isActive = ref(true);
  scope = effectScope();
  scope.run(() => useLandingHalo(ref({}), isDark, isActive));
  lifecycle.mount.forEach((callback) => callback());
});

afterEach(() => {
  lifecycle.unmount.forEach((callback) => callback());
  scope.stop();
  vi.unstubAllGlobals();
});

describe('landing halo resource lifecycle', () => {
  it('defers initialization, caps high-DPR mobile rendering, and reuses WebGL on theme changes', async () => {
    expect(createHalo).not.toHaveBeenCalled();
    await idleCallback();
    expect(createHalo).toHaveBeenCalledTimes(1);
    expect(createHalo.mock.calls[0][0]).toMatchObject({ scale: 3, scaleMobile: 3 });
    isDark.value = true;
    await nextTick();
    expect(createHalo).toHaveBeenCalledTimes(1);
    expect(effect.setOptions).toHaveBeenLastCalledWith({ backgroundColor: 0x090e13 });
    expect(effect.uniforms.backgroundColor.value.set).toHaveBeenLastCalledWith(9 / 255, 14 / 255, 19 / 255);
  });

  it('pauses off the hero and while hidden, then resumes the same effect', async () => {
    await idleCallback();
    isActive.value = false;
    await nextTick();
    expect(cancelAnimationFrame).toHaveBeenCalledWith(7);
    expect(effect.destroy).not.toHaveBeenCalled();
    isActive.value = true;
    await nextTick();
    expect(effect.animationLoop).toHaveBeenCalledTimes(1);
    document.hidden = true;
    document.dispatchEvent(new Event('visibilitychange'));
    document.hidden = false;
    document.dispatchEvent(new Event('visibilitychange'));
    expect(effect.animationLoop).toHaveBeenCalledTimes(2);
    expect(createHalo).toHaveBeenCalledTimes(1);
  });

  it('releases both feedback textures and the WebGL renderer when motion is disabled', async () => {
    await idleCallback();
    motion.matches = true;
    motion.dispatchEvent(new Event('change'));
    expect(effect.destroy).toHaveBeenCalledOnce();
    expect(effect.bufferTarget.dispose).toHaveBeenCalledOnce();
    expect(effect.bufferFeedback.dispose).toHaveBeenCalledOnce();
    expect(effect.renderer.dispose).toHaveBeenCalledOnce();
    expect(effect.renderer.forceContextLoss).toHaveBeenCalledOnce();
  });

  it('does not create an effect after the page unmounts during lazy loading', async () => {
    const initialization = idleCallback();
    lifecycle.unmount.forEach((callback) => callback());
    await initialization;
    expect(createHalo).not.toHaveBeenCalled();
  });
});
