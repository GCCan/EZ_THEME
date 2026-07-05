<template>
  <div class="landing-page" :class="{ 'dark-theme': isDarkTheme }" @wheel="handleWheel" @scroll="handleScroll" ref="landingPageRef">
    
    <!-- 3D Vanta Background Container -->
    <div ref="vantaRef" class="vanta-background" :class="{ 'light-mode-filter': !isDarkTheme }"></div>
    <div class="background-overlay" :class="{ 'dark-mode': isDarkTheme }"></div>

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
      const bgColor = 0x0a0a0a;
      
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
    });

    onUnmounted(() => {
      if (vantaEffect) vantaEffect.destroy();
      if (observer) observer.disconnect();
    });
    
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
    filter: invert(1) hue-rotate(180deg);
  }
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 1;
  background: radial-gradient(circle at center, transparent 0%, rgba(255,255,255,0.15) 100%);
  pointer-events: none;
  
  &.dark-mode {
    background: radial-gradient(circle at center, transparent 0%, rgba(0,0,0,0.4) 100%);
  }
}

.top-toolbar {
  position: fixed;
  top: 20px;
  right: 25px;
  display: flex;
  gap: 12px;
  z-index: 100;
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
}

.hero-logo {
  width: 80px;
  height: 80px;
  border-radius: 20px;
  margin-bottom: 24px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.1);
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
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateX(-50%) translateY(5px);
    .scroll-arrow {
      animation-play-state: paused;
    }
  }
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
