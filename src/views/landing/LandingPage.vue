<template>
  <div class="landing-page" :class="{ 'dark-theme': isDarkTheme, 'is-loaded': preloaderDone }" @wheel="handleWheel" @scroll="handleScroll" ref="landingPageRef">
    
    <!-- 电影级加载动画 -->
    <div class="cinematic-preloader" :class="{ 'fade-out': preloaderDone, 'dark-mode': isDarkTheme }">
      <div class="counter glitch-effect" :data-text="loadingProgress + '%'">{{ loadingProgress }}%</div>
    </div>

    <!-- 3D Vanta Background Container -->
    <div ref="vantaRef" class="vanta-background" :class="{ 'light-mode-filter': !isDarkTheme }"></div>
    <div class="background-overlay" :class="{ 'dark-mode': isDarkTheme }"></div>
    
    <!-- 电影胶片级噪点纹理 (Active Theory 风格) -->
    <div class="noise-overlay"></div>

    <!-- 高级交互式跟随鼠标 (Active Theory 风格) -->
    <div ref="cursorRef" class="custom-cursor"></div>
    <div ref="followerRef" class="custom-cursor-follower" :class="{ 'is-hovering': isHovering }"></div>

    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <ThemeToggle />
      <LanguageSelector />
    </div>
    
    <!-- 中央内容区 (无边框全景布局) -->
    <div class="content-container">
      <div class="hero-content">
        <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="hero-logo" />
        <h1 class="site-title">
          <span class="title-text">{{ siteConfig.siteName }}</span>
        </h1>
        <p class="landing-text">{{ $t('landing.mainText') }}</p>
      </div>
    </div>
    
    <!-- 底部箭头 -->
    <div class="scroll-arrow-container" @click="navigateToLogin">
      <div class="scroll-arrow">
        <IconChevronDown :size="32" :stroke-width="1.5" />
      </div>
      <div class="scroll-text">{{ $t('landing.scrollText') }}</div>
    </div>
    
    <!-- 页面过渡遮罩 -->
    <div class="page-transition-mask" :class="{ 'active': isTransitioning }"></div>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useRouter } from 'vue-router';
import { useTheme } from '@/composables/useTheme';
import { useI18n } from 'vue-i18n';
import { SITE_CONFIG, DEFAULT_CONFIG } from '@/utils/baseConfig';
import ThemeToggle from '@/components/common/ThemeToggle.vue';
import LanguageSelector from '@/components/common/LanguageSelector.vue';
import DomainAuthAlert from '@/components/common/DomainAuthAlert.vue';
import { IconChevronDown } from '@tabler/icons-vue';

import * as THREE from 'three';
import HALO from 'vanta/src/vanta.halo';

export default {
  name: 'LandingPage',
  components: {
    ThemeToggle,
    LanguageSelector,
    DomainAuthAlert,
    IconChevronDown
  },
  setup() {
    const router = useRouter();
    const { theme } = useTheme();
    const { t } = useI18n();
    
    const landingPageRef = ref(null);
    const vantaRef = ref(null);
    let vantaEffect = null;
    
    const isDarkTheme = ref(document.body.classList.contains('dark-theme'));
    const siteConfig = ref(SITE_CONFIG);
    const defaultConfig = ref(DEFAULT_CONFIG);
    const isTransitioning = ref(false);
    
    // 自定义鼠标状态
    const cursorRef = ref(null);
    const followerRef = ref(null);
    const isHovering = ref(false);
    
    // 预加载状态
    const loadingProgress = ref(0);
    const preloaderDone = ref(false);
    
    let observer = null;

    // Initialize Vanta Background
    const initVanta = () => {
      if (vantaEffect) vantaEffect.destroy();
      
      // 读取当前的 CSS 主题色变量
      const rootStyle = getComputedStyle(document.documentElement);
      let themeColorHex = rootStyle.getPropertyValue('--theme-color').trim();
      
      // 默认绿色作为兜底
      let parsedBaseColor = 0x10b981; 
      if (themeColorHex && themeColorHex.startsWith('#')) {
        parsedBaseColor = parseInt(themeColorHex.replace('#', '0x'), 16);
      }
      
      // 白天和黑夜模式都强制使用黑色背景，凸显3D星云特效
      const bgColor = 0x050505;
      
      vantaEffect = HALO({
        el: vantaRef.value,
        THREE: THREE,
        mouseControls: true,
        touchControls: true,
        gyroControls: false,
        minHeight: 200.00,
        minWidth: 200.00,
        backgroundColor: bgColor,
        baseColor: parsedBaseColor,
        amplitudeFactor: 1.5,
        size: 1.5
      });
    };

    watch(isDarkTheme, () => {
      // Background is always black, but we can re-init if we want to change baseColor later
      // initVanta(); 
    });

    onMounted(() => {
      // 启动加载动画进度
      let progress = 0;
      const progressInterval = setInterval(() => {
        // 模拟随机的加载速度，更加真实有机
        progress += Math.floor(Math.random() * 8) + 2; 
        if (progress >= 100) {
          progress = 100;
          loadingProgress.value = progress;
          clearInterval(progressInterval);
          // 加载完成后稍微停顿一下再消失，视觉体验更好
          setTimeout(() => {
            preloaderDone.value = true;
          }, 400);
        } else {
          loadingProgress.value = progress;
        }
      }, 50);

      initVanta();
      
      // Listen for body class changes to detect theme toggle
      observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.attributeName === 'class') {
            isDarkTheme.value = document.body.classList.contains('dark-theme');
          }
        });
      });
      observer.observe(document.body, { attributes: true });
      
      // 启动自定义鼠标引擎
      window.addEventListener('mousemove', onMouseMove);
      cursorRafId = requestAnimationFrame(animateCursor);
    });

    onUnmounted(() => {
      if (vantaEffect) vantaEffect.destroy();
      if (observer) observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      cancelAnimationFrame(cursorRafId);
    });
    
    // 自定义鼠标逻辑
    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let followerX = mouseX;
    let followerY = mouseY;
    let cursorRafId = null;

    const onMouseMove = (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      
      // 检测是否悬停在可点击元素上
      const target = e.target;
      const isClickable = target.closest('a, button, .hero-logo, .scroll-arrow-container, .top-toolbar, .site-title');
      if (isClickable && !isHovering.value) isHovering.value = true;
      else if (!isClickable && isHovering.value) isHovering.value = false;
    };

    const animateCursor = () => {
      // 缓动跟随者
      followerX += (mouseX - followerX) * 0.15;
      followerY += (mouseY - followerY) * 0.15;
      
      if (cursorRef.value) {
        cursorRef.value.style.transform = `translate3d(calc(${mouseX}px - 50%), calc(${mouseY}px - 50%), 0)`;
      }
      if (followerRef.value) {
        followerRef.value.style.transform = `translate3d(calc(${followerX}px - 50%), calc(${followerY}px - 50%), 0)`;
      }
      
      cursorRafId = requestAnimationFrame(animateCursor);
    };
    
    const handleScroll = (e) => {
      if (e.currentTarget === landingPageRef.value && window.scrollY > 100) {
        navigateToLogin();
      }
    };
    
    const handleWheel = (e) => {
      if (e.currentTarget === landingPageRef.value && e.deltaY > 0) {
        navigateToLogin();
      }
    };
    
    const navigateToLogin = () => {
      if (isTransitioning.value) return;
      isTransitioning.value = true;
      document.body.classList.add('page-transitioning');
      setTimeout(() => {
        router.push('/login');
      }, 600);
    };
    
    let touchStartY = 0;
    let handleTouchStart, handleTouchMove;
    
    onMounted(() => {
      handleTouchStart = (e) => {
        if (e.currentTarget === landingPageRef.value || landingPageRef.value.contains(e.target)) {
          touchStartY = e.touches[0].clientY;
        }
      };
      
      handleTouchMove = (e) => {
        if (e.currentTarget === landingPageRef.value || landingPageRef.value.contains(e.target)) {
          const touchY = e.touches[0].clientY;
          if (touchStartY - touchY > 50) { 
            navigateToLogin();
          }
        }
      };
      
      if (landingPageRef.value) {
        landingPageRef.value.addEventListener('touchstart', handleTouchStart, { passive: true });
        landingPageRef.value.addEventListener('touchmove', handleTouchMove, { passive: true });
      }
    });
    
    onUnmounted(() => {
      if (landingPageRef.value) {
        landingPageRef.value.removeEventListener('touchstart', handleTouchStart);
        landingPageRef.value.removeEventListener('touchmove', handleTouchMove);
      }
    });
    
    return {
      landingPageRef,
      vantaRef,
      siteConfig,
      defaultConfig,
      isDarkTheme,
      isTransitioning,
      cursorRef,
      followerRef,
      isHovering,
      loadingProgress,
      preloaderDone,
      navigateToLogin,
      handleScroll,
      handleWheel,
    };
  }
};
</script>

<style lang="scss" scoped>
.landing-page {
  position: relative;
  width: 100%;
  height: 100vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: none; /* 隐藏默认鼠标，使用自定义鼠标 */
  
  @media (max-width: 768px) {
    cursor: auto; /* 移动端恢复默认 */
  }
}

/* 电影级预加载遮罩 */
.cinematic-preloader {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: #ffffff;
  z-index: 2000;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: opacity 0.8s cubic-bezier(0.7, 0, 0.3, 1), transform 0.8s cubic-bezier(0.7, 0, 0.3, 1);
  
  &.dark-mode {
    background-color: #050505;
  }
  
  .counter {
    font-size: 5vw;
    font-weight: 200;
    letter-spacing: 4px;
    color: var(--theme-color);
    font-family: 'Inter', -apple-system, sans-serif;
    text-shadow: 0 0 20px rgba(var(--theme-color-rgb), 0.3);
    position: relative;
    
    @media (max-width: 768px) {
      font-size: 32px;
    }
  }
  
  /* RGB 故障抖动特效 */
  .glitch-effect::before,
  .glitch-effect::after {
    content: attr(data-text);
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0.8;
  }
  
  .glitch-effect::before {
    left: 4px;
    text-shadow: -2px 0 #ff00c1;
    clip-path: inset(10% 0 30% 0);
    animation: glitch-anim-1 2s infinite linear alternate-reverse;
  }
  
  .glitch-effect::after {
    left: -4px;
    text-shadow: -2px 0 #00fff9;
    clip-path: inset(40% 0 10% 0);
    animation: glitch-anim-2 3s infinite linear alternate-reverse;
  }
  
  &.fade-out {
    opacity: 0;
    pointer-events: none;
    transform: scale(1.05); /* 轻微放大淡出 */
  }
}

@keyframes glitch-anim-1 {
  0% { clip-path: inset(20% 0 80% 0); }
  20% { clip-path: inset(60% 0 10% 0); }
  40% { clip-path: inset(40% 0 50% 0); }
  60% { clip-path: inset(80% 0 5% 0); }
  80% { clip-path: inset(10% 0 70% 0); }
  100% { clip-path: inset(30% 0 20% 0); }
}

@keyframes glitch-anim-2 {
  0% { clip-path: inset(10% 0 60% 0); }
  20% { clip-path: inset(30% 0 20% 0); }
  40% { clip-path: inset(70% 0 10% 0); }
  60% { clip-path: inset(20% 0 50% 0); }
  80% { clip-path: inset(90% 0 5% 0); }
  100% { clip-path: inset(40% 0 30% 0); }
}

.vanta-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transition: filter 0.5s ease;
  
  &.light-mode-filter {
    filter: invert(1) hue-rotate(180deg) brightness(2.0) saturate(1.8);
  }
}

/* Active Theory 风格噪点层 */
.noise-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 2;
  opacity: 0.05;
  background-image: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
}

/* Active Theory 风格自定义鼠标 */
.custom-cursor {
  position: fixed;
  top: 0;
  left: 0;
  width: 6px;
  height: 6px;
  background-color: #fff;
  border-radius: 50%;
  pointer-events: none;
  z-index: 9999;
  mix-blend-mode: difference;
  will-change: transform;
  
  @media (max-width: 768px) {
    display: none;
  }
}

.custom-cursor-follower {
  position: fixed;
  top: 0;
  left: 0;
  width: 24px;
  height: 24px;
  background-color: #fff; /* 默认就是实心白，这样反色效果在任何地方都极其明显 */
  border-radius: 50%;
  pointer-events: none;
  z-index: 9998;
  mix-blend-mode: difference;
  will-change: transform;
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1);
  
  &.is-hovering {
    width: 60px;
    height: 60px;
  }
  
  @media (max-width: 768px) {
    display: none;
  }
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.4) 100%);
  pointer-events: none;
  z-index: 1;
  transition: background 0.3s ease;
  
  &.dark-mode {
    background: radial-gradient(circle at center, transparent 0%, rgba(5, 5, 5, 0.7) 100%);
  }
}

.top-toolbar {
  position: fixed;
  top: 20px;
  right: 25px;
  display: flex;
  gap: 12px;
  z-index: 100;
  opacity: 0;
  transform: translateY(-20px);
  transition: opacity 0.8s ease 0.8s, transform 0.8s ease 0.8s;
}

.is-loaded .top-toolbar {
  opacity: 1;
  transform: translateY(0);
}

.content-container {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  pointer-events: none; /* 让鼠标事件穿透到 Vanta */
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  pointer-events: auto;
  margin-top: -5vh; /* 稍微向上偏移一点，视觉中心更好看 */
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s, transform 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s;
}

.is-loaded .hero-content {
  opacity: 1;
  transform: translateY(0);
}

.hero-logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    margin-bottom: 16px;
    border-radius: 16px;
  }
  
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    border-radius: 12px;
  }
}

.site-title {
  font-size: 80px;
  font-weight: 900;
  margin: 0 0 20px 0;
  text-transform: uppercase;
  letter-spacing: 4px;
  filter: drop-shadow(0 0 30px var(--background-color)) drop-shadow(0 5px 15px rgba(0, 0, 0, 0.5));
  
  .title-text {
    background: linear-gradient(135deg, var(--theme-color), #37DEC9, var(--theme-color));
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
    text-shadow: 0 0 20px rgba(var(--theme-color-rgb), 0.4);
    transition: all 0.3s ease;
    animation: title-gradient-flow 4s linear infinite;
  }
  
  @media (max-width: 768px) {
    font-size: 48px;
    letter-spacing: 2px;
  }
  
  @media (max-width: 480px) {
    font-size: 32px;
    letter-spacing: 1px;
  }
}

.landing-text {
  font-size: 1rem;
  letter-spacing: 8px;
  text-transform: uppercase;
  color: var(--text-color);
  opacity: 0.8;
  font-weight: 500;
  text-shadow: 0 0 15px var(--background-color);
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 0.85rem;
    letter-spacing: 4px;
  }
  
  @media (max-width: 480px) {
    font-size: 0.75rem;
    letter-spacing: 2px;
    padding: 0 15px;
  }
}

.scroll-arrow-container {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  flex-direction: column;
  align-items: center;
  cursor: pointer;
  z-index: 10;
  opacity: 0;
  transition: opacity 0.8s ease 1s, transform 0.3s ease;
  
  &:hover {
    transform: translateX(-50%) translateY(5px);
    .scroll-arrow {
      animation-play-state: paused;
    }
  }
}

.is-loaded .scroll-arrow-container {
  opacity: 1;
}

.scroll-arrow {
  color: var(--theme-color);
  animation: bounce 2s infinite;
  margin-bottom: 8px;
  
  .dark-mode & {
    color: #37DEC9;
  }
}

.scroll-text {
  font-size: 0.875rem;
  color: var(--text-color);
  opacity: 0.7;
}

@keyframes bounce {
  0%, 20%, 50%, 80%, 100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-20px);
  }
  60% {
    transform: translateY(-10px);
  }
}

@keyframes title-gradient-flow {
  0% {
    background-position: 0% center;
  }
  100% {
    background-position: -200% center;
  }
}


.page-transition-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: var(--background-color);
  z-index: 1000;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1);
  
  &.active {
    opacity: 1;
    pointer-events: all;
  }
}
</style>
