import { onMounted, onUnmounted, watch } from 'vue';

// Keep Vanta's animation-loop and GPU cleanup details out of the page component.
export function useLandingHalo(element, isDark, isActive) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let effect;
  let mounted = false;
  let disposed = false;
  let loading = false;
  let failed = false;
  let running = false;
  let scheduled;
  const useIdleCallback = typeof window.requestIdleCallback === 'function';
  const shouldAnimate = () => mounted && !disposed && isActive.value && !document.hidden && !reducedMotion.matches;

  const cancelScheduled = () => {
    if (scheduled == null) return;
    if (useIdleCallback) window.cancelIdleCallback(scheduled);
    else clearTimeout(scheduled);
    scheduled = undefined;
  };

  const destroy = () => {
    if (!effect) return;
    // Vanta 0.5.24 drops these references without disposing their GPU allocations.
    const { renderer, bufferTarget, bufferFeedback } = effect;
    effect.destroy();
    bufferTarget?.dispose();
    bufferFeedback?.dispose();
    renderer?.dispose();
    renderer?.forceContextLoss();
    effect = undefined;
    running = false;
  };

  const applyTheme = () => {
    if (!effect) return;
    effect.setOptions({ backgroundColor: isDark.value ? 0x090e13 : 0x000000 });
    // HALO writes raw RGB; bypass modern THREE.Color's hex-to-linear conversion.
    effect.uniforms.backgroundColor.value.set(...(isDark.value ? [9 / 255, 14 / 255, 19 / 255] : [0, 0, 0]));
  };

  const initialize = async () => {
    scheduled = undefined;
    if (!shouldAnimate() || effect || loading || failed) return;
    loading = true;
    try {
      const [THREE, { default: HALO }] = await Promise.all([import('three'), import('vanta/src/vanta.halo')]);
      if (!shouldAnimate() || !element.value) return;
      const color = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
      const mobile = window.innerWidth <= 768;
      // Vanta uses DPR / scale for both the canvas and its two feedback textures.
      const scale = Math.max(1, window.devicePixelRatio / (mobile ? 1 : 1.5));
      effect = HALO({
        el: element.value, THREE,
        mouseControls: window.matchMedia('(pointer: fine)').matches,
        touchControls: false, gyroControls: false,
        backgroundColor: isDark.value ? 0x090e13 : 0x000000,
        baseColor: /^#[0-9a-f]{6}$/i.test(color) ? parseInt(color.slice(1), 16) : 0x10b981,
        amplitudeFactor: 1.2, size: mobile ? 1.1 : 1.6,
        scale, scaleMobile: scale,
        xOffset: 0, yOffset: 0.05, minHeight: 200, minWidth: 200
      });
      if (!effect.renderer || !effect.uniforms) throw new Error('WebGL unavailable');
      running = true;
      applyTheme();
    } catch (error) {
      failed = true;
      destroy();
      console.warn('Landing background unavailable; using CSS fallback.', error);
    } finally {
      loading = false;
    }
  };

  const syncAnimation = () => {
    if (!shouldAnimate()) {
      cancelScheduled();
      if (reducedMotion.matches) destroy();
      else if (effect && running) {
        // Vanta has no pause API; cancelling its single loop keeps the current frame.
        cancelAnimationFrame(effect.req);
        running = false;
      }
      return;
    }
    if (effect) {
      if (!running) {
        effect.prevNow = undefined;
        running = true;
        effect.animationLoop();
      }
    } else if (!loading && !failed && scheduled == null) {
      scheduled = useIdleCallback
        ? window.requestIdleCallback(initialize, { timeout: 1200 })
        : setTimeout(initialize, 100);
    }
  };

  watch(isDark, applyTheme);
  watch(isActive, syncAnimation);
  onMounted(() => {
    mounted = true;
    document.addEventListener('visibilitychange', syncAnimation);
    reducedMotion.addEventListener('change', syncAnimation);
    syncAnimation();
  });
  onUnmounted(() => {
    disposed = true;
    cancelScheduled();
    document.removeEventListener('visibilitychange', syncAnimation);
    reducedMotion.removeEventListener('change', syncAnimation);
    destroy();
  });
}
