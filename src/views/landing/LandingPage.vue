<template>
  <div class="landing-page" tabindex="0" :class="{ 'dark-theme': isDarkTheme, 'is-loaded': preloaderDone }" @wheel="handleWheel" @touchstart.passive="handleTouchStart" @touchend.passive="handleTouchEnd" @keydown="handleKeydown" ref="landingPageRef">
    
    <div ref="vantaRef" class="vanta-background" aria-hidden="true"></div>
    <div class="background-overlay" :class="{ 'is-dimmed': currentSection > 0 }" aria-hidden="true"></div>
    <div class="brand-mark" aria-hidden="true">{{ siteConfig.siteName }}<span class="brand-dot"></span></div>

    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <button class="enter-btn"
              @click="navigateToLogin">
        <span class="pulse-dot"></span>
        <span class="enter-btn-text">{{ $t('landing.enterPanel') }}</span>
      </button>
      <ThemeToggle />
      <LanguageSelector />
    </div>
    
    <!-- 全屏分页滚动容器 -->
    <div class="sections-wrapper" :style="{ transform: `translateY(-${currentSection * 100}%)` }">
      
      <!-- 第一屏：Hero -->
      <section class="fullpage-section section-hero" :inert="currentSection !== 0" :aria-hidden="currentSection !== 0">
        <div class="content-container">
          <div class="hero-content">
            <img v-if="siteConfig.showLogo" src="/images/logo.png" :alt="siteConfig.siteName" class="hero-logo" />
            <h1 class="site-title">
              <span class="title-text">{{ siteConfig.siteName }}</span>
            </h1>
            <p class="landing-text">{{ $t('landing.mainText') }}</p>
            <div class="hero-actions">
              <button class="primary-btn" @click="navigateToLogin">{{ $t('landing.enterPanel') }}<IconArrowRight :size="18" /></button>
              <button class="secondary-btn" @click="goToSection(2)">{{ $t('landing.viewPlans') }}<IconChevronDown :size="17" /></button>
            </div>
            <div class="hero-highlights">
              <span v-for="feature in features" :key="feature.titleKey"><component :is="feature.icon" :size="15" />{{ $t(feature.titleKey) }}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- 第二屏：介绍页 -->
      <section class="fullpage-section section-intro" :inert="currentSection !== 1" :aria-hidden="currentSection !== 1">
        <div class="intro-container" :class="{ 'is-visible': currentSection === 1 }">
          <h2 class="intro-title">{{ $t('landing.introTitle') }}</h2>
          <p class="intro-subtitle">{{ $t('landing.introSubtitle') }}</p>
          
          <div class="features-grid">
            <div class="feature-card" v-for="(feature, index) in features" :key="index"
                 :style="{ transitionDelay: currentSection === 1 ? `${0.2 + index * 0.15}s` : '0s' }">
              <div class="feature-icon-wrapper">
                <component :is="feature.icon" :size="28" :stroke-width="1.5" />
              </div>
              <h3 class="feature-title">{{ $t(feature.titleKey) }}</h3>
              <p class="feature-desc">{{ $t(feature.descKey) }}</p>
            </div>
          </div>

        </div>
      </section>

      <!-- 第三屏：套餐页 -->
      <section class="fullpage-section section-plans" :inert="currentSection !== 2" :aria-hidden="currentSection !== 2">
        <div class="plans-container" :class="{ 'is-visible': currentSection === 2 }">
          <h2 class="intro-title">{{ $t('landing.plansTitle') }}</h2>
          <p class="intro-subtitle">{{ $t('landing.plansSubtitle') }}</p>
          
          <div class="plans-grid">
            <div class="landing-plan-card" v-for="(plan, index) in plans" :key="index"
                 :class="{ 'is-featured': plan.featured }"
                 :style="{ transitionDelay: currentSection === 2 ? `${0.2 + index * 0.15}s` : '0s' }">
              <div class="plan-badge" v-if="plan.featured">{{ $t('landing.recommended') }}</div>
              <h3 class="plan-name">{{ $t(plan.nameKey) }}</h3>
              <div class="plan-price">
                <span class="currency">¥</span>
                <span class="amount">{{ plan.price }}</span>
                <span class="period">/ {{ $t('landing.month') }}</span>
              </div>
              <ul class="plan-features-list">
                <li v-for="(feature, fIndex) in plan.featuresKey" :key="fIndex">
                  <IconCheck :size="18" class="check-icon" />
                  <span>{{ $t(feature) }}</span>
                </li>
              </ul>
              <button class="plan-btn" @click="navigateToLogin">{{ $t('landing.buyNow') }}</button>
            </div>
          </div>
          

        </div>
      </section>

    </div>
    
    <!-- 分页指示器 -->
    <nav class="page-indicators" :aria-label="$t('landing.mainText')">
      <button v-for="(label, index) in sectionLabels" :key="label" class="indicator-dot" :class="{ active: currentSection === index }" :aria-label="$t(label)" :aria-current="currentSection === index ? 'step' : undefined" @click="goToSection(index)"></button>
    </nav>

    <!-- 底部箭头 -->
    <button class="scroll-arrow-container" @click="handleArrowClick">
      <div class="scroll-arrow">
        <IconChevronDown :size="32" :stroke-width="1.5" />
      </div>
      <div class="scroll-text">{{ currentSection < totalSections - 1 ? $t('landing.scrollMore') : $t('landing.enterPanel') }}</div>
    </button>

    <!-- 页面过渡遮罩 -->
    <div class="page-transition-mask" :class="{ 'active': isTransitioning }"></div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { SITE_CONFIG } from '@/utils/baseConfig';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import LanguageSelector from '@/components/common/LanguageSelector.vue';
import { IconChevronDown, IconArrowRight, IconBolt, IconWorld, IconShieldLock, IconCheck } from '@tabler/icons-vue';

const router = useRouter();
const isDarkTheme = ref(document.body.classList.contains('dark-theme'));
const themeObserver = new MutationObserver(() => {
  isDarkTheme.value = document.body.classList.contains('dark-theme');
});
const siteConfig = SITE_CONFIG;
const landingPageRef = ref(null);
const vantaRef = ref(null);
const preloaderDone = ref(false);
const currentSection = ref(0);
const totalSections = 3;
const isTransitioning = ref(false);
const sectionLabels = ['landing.mainText', 'landing.introTitle', 'landing.plansTitle'];
const features = [
  { icon: IconBolt, titleKey: 'landing.featureSpeed', descKey: 'landing.featureSpeedDesc' },
  { icon: IconWorld, titleKey: 'landing.featureGlobal', descKey: 'landing.featureGlobalDesc' },
  { icon: IconShieldLock, titleKey: 'landing.featureSecurity', descKey: 'landing.featureSecurityDesc' }
];
// Preserve existing advertised prices; this page does not fetch the shop catalog.
const plans = [
  { nameKey: 'landing.planBasic', price: '15', featuresKey: ['landing.planFeature1', 'landing.planFeature2'] },
  { nameKey: 'landing.planStandard', price: '25', featuresKey: ['landing.planFeature1', 'landing.planFeature2', 'landing.planFeature3'], featured: true },
  { nameKey: 'landing.planPro', price: '50', featuresKey: ['landing.planFeature1', 'landing.planFeature2', 'landing.planFeature3', 'landing.planFeature4'] }
];
let vantaEffect;
let disposed = false;
let backgroundVersion = 0;
let scrollTimer;
let transitionTimer;
let entranceFrame;
let isScrolling = false;
let touchStart = null;
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const initVanta = async () => {
  const version = ++backgroundVersion;
  vantaEffect?.destroy();
  vantaEffect = null;
  // Light mode uses a purpose-built CSS background; motion-sensitive users get the same fallback.
  if (!isDarkTheme.value || reducedMotion.matches || document.hidden) return;
  try {
    const [THREE, { default: HALO }] = await Promise.all([import('three'), import('vanta/src/vanta.halo')]);
    if (disposed || version !== backgroundVersion || !vantaRef.value) return;
    const color = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim();
    vantaEffect = HALO({
      el: vantaRef.value, THREE,
      mouseControls: window.matchMedia('(pointer: fine)').matches,
      touchControls: false, gyroControls: false,
      backgroundColor: 0x090e13,
      baseColor: /^#[0-9a-f]{6}$/i.test(color) ? parseInt(color.slice(1), 16) : 0x10b981,
      amplitudeFactor: 1.2, size: window.innerWidth <= 768 ? 1.1 : 1.6,
      xOffset: 0, yOffset: 0.05, minHeight: 200, minWidth: 200
    });
  } catch (error) {
    console.warn('Landing background unavailable; using CSS fallback.', error);
  }
};
watch(isDarkTheme, initVanta);

const goToSection = (index) => {
  if (index < 0 || index >= totalSections || index === currentSection.value || isTransitioning.value) return;
  currentSection.value = index;
  isScrolling = true;
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(() => { isScrolling = false; }, reducedMotion.matches ? 0 : 800);
};
// Allow tall sections and the horizontal plan list to consume their own scroll first.
const canScrollWithin = (target, delta) => {
  let element = target instanceof Element ? target : null;
  while (element && element !== landingPageRef.value) {
    if (element.scrollHeight > element.clientHeight + 2 && /auto|scroll/.test(getComputedStyle(element).overflowY)) {
      if (delta > 0 && element.scrollTop + element.clientHeight < element.scrollHeight - 2) return true;
      if (delta < 0 && element.scrollTop > 2) return true;
    }
    element = element.parentElement;
  }
  return false;
};
const handleWheel = (event) => {
  if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY) || canScrollWithin(event.target, event.deltaY)) return;
  event.preventDefault();
  if (isScrolling || Math.abs(event.deltaY) < 30) return;
  goToSection(currentSection.value + Math.sign(event.deltaY));
};
const handleTouchStart = (event) => {
  touchStart = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY, target: event.target } : null;
};
const handleTouchEnd = (event) => {
  if (!touchStart || !event.changedTouches.length) return;
  const deltaY = touchStart.y - event.changedTouches[0].clientY;
  const deltaX = touchStart.x - event.changedTouches[0].clientX;
  const target = touchStart.target;
  touchStart = null;
  if (isScrolling || Math.abs(deltaY) < 60 || Math.abs(deltaX) >= Math.abs(deltaY) || canScrollWithin(target, deltaY)) return;
  goToSection(currentSection.value + Math.sign(deltaY));
};
const handleKeydown = (event) => {
  if (event.target.closest('button, a, input, textarea, select, [contenteditable]') || event.altKey || event.ctrlKey || event.metaKey) return;
  const direction = { ArrowDown: 1, PageDown: 1, ArrowUp: -1, PageUp: -1 }[event.key];
  if (!direction || canScrollWithin(event.target, direction)) return;
  event.preventDefault();
  goToSection(currentSection.value + direction);
};
const navigateToLogin = () => {
  if (isTransitioning.value) return;
  isTransitioning.value = true;
  transitionTimer = setTimeout(async () => {
    try { await router.push('/login'); }
    finally { if (!disposed) isTransitioning.value = false; }
  }, reducedMotion.matches ? 0 : 250);
};
const handleArrowClick = () => currentSection.value < totalSections - 1 ? goToSection(currentSection.value + 1) : navigateToLogin();
onMounted(() => {
  entranceFrame = requestAnimationFrame(() => { preloaderDone.value = true; });
  themeObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  isDarkTheme.value = document.body.classList.contains('dark-theme');
  initVanta();
  document.addEventListener('visibilitychange', initVanta);
  reducedMotion.addEventListener('change', initVanta);
});
onUnmounted(() => {
  disposed = true;
  themeObserver.disconnect();
  backgroundVersion++;
  vantaEffect?.destroy();
  clearTimeout(scrollTimer);
  clearTimeout(transitionTimer);
  cancelAnimationFrame(entranceFrame);
  document.removeEventListener('visibilitychange', initVanta);
  reducedMotion.removeEventListener('change', initVanta);
});
</script>

<style lang="scss" scoped>
.landing-page {
  --landing-ink: #182c31;
  --landing-muted: #566c70;
  --landing-surface: rgba(255, 255, 255, .82);
  --landing-border: rgba(32, 75, 73, .13);
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  color: var(--landing-ink);
  background: #f5f8f6;
  isolation: isolate;
  &.dark-theme {
    --landing-ink: #edf5f2;
    --landing-muted: #a1b5af;
    --landing-surface: rgba(17, 28, 33, .88);
    --landing-border: rgba(214, 241, 229, .14);
    background: #090e13;
  }
  *, *::before, *::after { box-sizing: border-box; }
  button { font: inherit; cursor: pointer; }
  button:focus-visible { outline: 3px solid var(--theme-color); outline-offset: 5px; }
}
.vanta-background, .background-overlay { position: absolute; inset: 0; pointer-events: none; }
.vanta-background {
  z-index: -3;
  background: radial-gradient(ellipse at 50% 42%, rgba(var(--theme-color-rgb), .17), transparent 60%);
}
.background-overlay {
  z-index: -2;
  background: radial-gradient(ellipse at center, transparent 10%, rgba(245, 248, 246, .75) 85%);
  transition: background .6s ease;
  &.is-dimmed { background: rgba(245, 248, 246, .7); }
}
.dark-theme .background-overlay {
  background: radial-gradient(ellipse at center, rgba(9, 14, 19, .08), rgba(9, 14, 19, .8));
  &.is-dimmed { background: rgba(9, 14, 19, .86); }
}
.brand-mark { position: absolute; top: calc(30px + env(safe-area-inset-top)); left: 40px; z-index: 20; font-size: 14px; font-weight: 750; letter-spacing: -.3px; display: flex; align-items: center; gap: 10px; }
.brand-dot, .pulse-dot { width: 6px; height: 6px; background: var(--theme-color); border-radius: 50%; flex-shrink: 0; }
.top-toolbar { position: absolute; top: calc(20px + env(safe-area-inset-top)); right: 32px; z-index: 30; display: flex; align-items: center; gap: 8px; }
.enter-btn { display: inline-flex; align-items: center; gap: 8px; padding: 10px 18px; min-height: 40px; border: 1px solid var(--landing-border); border-radius: 999px; color: var(--landing-ink); background: var(--landing-surface); font-size: 13px !important; }
.top-toolbar :deep(.theme-toggle), .top-toolbar :deep(.language-btn) { color: var(--landing-ink); background: var(--landing-surface); border: 1px solid var(--landing-border); box-shadow: none; }
.sections-wrapper { width: 100%; height: 100%; transition: transform .75s cubic-bezier(.65, 0, .35, 1); }
.fullpage-section { width: 100%; height: 100%; padding: calc(100px + env(safe-area-inset-top)) 64px calc(90px + env(safe-area-inset-bottom)); overflow-y: auto; overscroll-behavior: contain; display: flex; align-items: safe center; justify-content: center; }
.content-container, .intro-container, .plans-container { width: 100%; margin: auto; text-align: center; }
.intro-container { max-width: 1080px; }
.plans-container { max-width: 1120px; }
.hero-content { display: flex; flex-direction: column; align-items: center; opacity: 0; transform: translateY(16px); transition: opacity .6s ease, transform .6s ease; }
.is-loaded .hero-content { opacity: 1; transform: none; }
.hero-logo { width: 64px; height: 64px; object-fit: contain; border-radius: 18px; margin-bottom: 28px; box-shadow: 0 8px 28px rgba(0, 0, 0, .1); }
.site-title { margin: 0 0 20px; max-width: 100%; font-size: clamp(38px, 6.2vw, 88px); font-weight: 750; line-height: 1.08; letter-spacing: -.055em; overflow-wrap: anywhere; text-wrap: balance; }
.landing-text { color: var(--landing-muted); font-size: clamp(15px, 1.4vw, 19px); line-height: 1.8; letter-spacing: .08em; margin: 0; max-width: 600px; text-wrap: balance; }
.hero-actions { display: flex; justify-content: center; flex-wrap: wrap; gap: 12px; margin-top: 36px; }
.primary-btn, .secondary-btn { min-height: 50px; display: inline-flex; align-items: center; justify-content: center; gap: 20px; padding: 13px 25px; border-radius: 12px; font-weight: 650 !important; font-size: 14px !important; transition: transform .2s, box-shadow .2s; }
.primary-btn { border: 1px solid transparent; color: #fff; background: color-mix(in srgb, var(--theme-color), #102e28 28%); box-shadow: 0 6px 22px rgba(var(--theme-color-rgb), .2); }
.secondary-btn { border: 1px solid var(--landing-border); color: var(--landing-ink); background: var(--landing-surface); }
.hero-highlights { display: flex; flex-wrap: wrap; justify-content: center; gap: 12px 24px; margin-top: 30px; color: var(--landing-muted); font-size: 12px; }
.hero-highlights span { display: inline-flex; align-items: center; gap: 7px; }
.intro-title { color: var(--landing-ink); font-size: clamp(25px, 3.2vw, 42px); line-height: 1.25; letter-spacing: -.04em; margin: 0 0 14px; font-weight: 700; text-wrap: balance; }
.intro-subtitle { color: var(--landing-muted); max-width: 640px; margin: 0 auto 40px; font-size: 15px; line-height: 1.8; text-wrap: balance; }
.features-grid, .plans-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; text-align: left; }
.feature-card, .landing-plan-card { background: var(--landing-surface); border: 1px solid var(--landing-border); border-radius: 20px; padding: 30px; backdrop-filter: blur(12px); transition: border-color .2s, box-shadow .2s; }
.feature-icon-wrapper { display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; border-radius: 14px; color: color-mix(in srgb, var(--theme-color), var(--landing-ink) 30%); background: rgba(var(--theme-color-rgb), .1); margin-bottom: 28px; }
.feature-title { color: var(--landing-ink); font-size: 18px; margin: 0 0 12px; }
.feature-desc { color: var(--landing-muted); font-size: 14px; line-height: 1.9; margin: 0; }
.plans-grid { padding-top: 12px; }
.landing-plan-card { position: relative; display: flex; flex-direction: column; padding: 32px 28px; }
.landing-plan-card.is-featured { border-color: rgba(var(--theme-color-rgb), .65); box-shadow: 0 12px 40px rgba(var(--theme-color-rgb), .1); background: linear-gradient(150deg, rgba(var(--theme-color-rgb), .08), transparent 65%), var(--landing-surface); }
.plan-badge { position: absolute; top: 0; right: 24px; transform: translateY(-50%); background: color-mix(in srgb, var(--theme-color), #102e28 28%); color: #fff; padding: 6px 13px; border-radius: 999px; font-size: 11px; font-weight: 650; }
.plan-name { margin: 0 0 24px; font-size: 17px; font-weight: 600; }
.plan-price { display: flex; align-items: baseline; gap: 4px; margin-bottom: 26px; }
.currency { font-size: 20px; }
.amount { font-size: 52px; font-weight: 700; line-height: 1; letter-spacing: -.06em; }
.period { color: var(--landing-muted); font-size: 13px; margin-left: 6px; }
.plan-features-list { list-style: none; margin: 0 0 30px; padding: 24px 0 0; border-top: 1px solid var(--landing-border); flex: 1; }
.plan-features-list li { display: flex; align-items: center; gap: 10px; margin-bottom: 13px; font-size: 13px; color: var(--landing-muted); line-height: 1.5; }
.check-icon { color: var(--theme-color); flex-shrink: 0; }
.plan-btn { width: 100%; min-height: 44px; border: 1px solid var(--landing-border); border-radius: 10px; color: var(--landing-ink); background: transparent; font-size: 13px !important; font-weight: 600 !important; }
.is-featured .plan-btn { background: color-mix(in srgb, var(--theme-color), #102e28 28%); color: #fff; border-color: transparent; }
.page-indicators { position: absolute; right: 22px; top: 50%; transform: translateY(-50%); display: flex; flex-direction: column; gap: 4px; z-index: 20; }
.indicator-dot { width: 28px; height: 28px; border: 0; background: transparent; display: grid; place-items: center; padding: 0; }
.indicator-dot::after { content: ''; width: 5px; height: 5px; border-radius: 6px; background: var(--landing-muted); opacity: .4; transition: height .25s, opacity .25s; }
.indicator-dot.active::after { height: 22px; background: var(--theme-color); opacity: 1; }
.scroll-arrow-container { position: absolute; bottom: calc(20px + env(safe-area-inset-bottom)); left: 50%; transform: translateX(-50%); z-index: 20; display: flex; flex-direction: column; align-items: center; gap: 3px; border: 0; background: transparent; color: var(--landing-muted); padding: 4px 16px; }
.scroll-arrow { line-height: 0; }
.scroll-text { font-size: 11px; letter-spacing: .05em; white-space: nowrap; }
.page-transition-mask { position: absolute; inset: 0; z-index: 100; background: var(--background-color); pointer-events: none; opacity: 0; transition: opacity .25s; &.active { opacity: 1; pointer-events: auto; } }
@media (hover: hover) {
  .primary-btn:hover, .secondary-btn:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(var(--theme-color-rgb), .16); }
  .feature-card:hover, .landing-plan-card:hover { border-color: rgba(var(--theme-color-rgb), .5); }
  .plan-btn:hover, .enter-btn:hover { border-color: var(--theme-color); }
}
@media (max-width: 768px) {
  .brand-mark { left: 20px; top: calc(27px + env(safe-area-inset-top)); max-width: 32%; overflow: hidden; white-space: nowrap; font-size: 11px; }
  .top-toolbar { top: calc(16px + env(safe-area-inset-top)); right: 16px; gap: 6px; }
  .enter-btn { padding: 8px 12px; font-size: 11px !important; }
  .fullpage-section { padding-left: 24px; padding-right: 40px; }
  .hero-logo { width: 54px; height: 54px; margin-bottom: 24px; }
  .hero-highlights { gap: 10px 14px; font-size: 11px; }
  .hero-actions { margin-top: 28px; }
  .primary-btn, .secondary-btn { padding: 12px 18px; gap: 12px; }
  .intro-subtitle { font-size: 13px; margin-bottom: 24px; }
  .features-grid { grid-template-columns: 1fr; gap: 12px; }
  .feature-card { display: grid; grid-template-columns: 40px 1fr; gap: 6px 16px; padding: 20px; border-radius: 16px; }
  .feature-icon-wrapper { grid-row: 1 / 3; width: 40px; height: 40px; margin: 0; border-radius: 12px; }
  .feature-title { margin: 0; font-size: 15px; }
  .feature-desc { font-size: 12px; line-height: 1.7; }
  .plans-grid { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; padding: 14px 0 16px; gap: 14px; scrollbar-width: thin; scrollbar-color: var(--theme-color) transparent; }
  .landing-plan-card { flex: 0 0 88%; scroll-snap-align: center; padding: 28px 24px; }
  .page-indicators { right: 4px; }
}
@media (max-width: 380px) { .brand-mark { display: none; } }
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; animation: none !important; scroll-behavior: auto !important; }
}
</style>
