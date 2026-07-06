<template>
  <div class="landing-page" :class="{ 'dark-theme': isDarkTheme, 'is-loaded': preloaderDone }" @wheel="handleWheel" ref="landingPageRef">
    
    <!-- 电影级加载动画 -->
    <div class="cinematic-preloader" :class="{ 'fade-out': preloaderDone, 'dark-mode': isDarkTheme }">
      <div class="counter glitch-effect" :data-text="loadingProgress + '%'">{{ loadingProgress }}%</div>
    </div>

    <!-- 3D Vanta Background Container -->
    <div ref="vantaRef" class="vanta-background" :class="{ 'light-mode-filter': !isDarkTheme }"></div>
    <div class="background-overlay" :class="{ 'dark-mode': isDarkTheme, 'is-dimmed': currentSection === 1 || currentSection === 2 }"></div>
    
    <!-- 电影胶片级噪点纹理 (Active Theory 风格) -->
    <div class="noise-overlay"></div>

    <!-- 高级交互式跟随鼠标 (Active Theory 风格) -->
    <div ref="cursorRef" class="custom-cursor"></div>
    <div ref="followerRef" class="custom-cursor-follower" :class="{ 'is-hovering': isHovering }"></div>

    <!-- 顶部工具栏 -->
    <div class="top-toolbar">
      <button class="enter-btn" ref="enterBtnRef"
              @click="navigateToLogin"
              @mouseenter="onBtnEnter"
              @mousemove="onBtnMove"
              @mouseleave="onBtnLeave">
        <span class="pulse-dot"></span>
        <span class="enter-btn-text">{{ $t('landing.enterPanel') }}</span>
        <span class="enter-btn-shine"></span>
      </button>
      <ThemeToggle />
      <LanguageSelector />
    </div>
    
    <!-- 全屏分页滚动容器 -->
    <div class="sections-wrapper" :style="{ transform: `translateY(-${currentSection * 100}vh)` }">
      
      <!-- 第一屏：Hero -->
      <section class="fullpage-section section-hero">
        <div class="content-container">
          <div class="hero-content">
            <img v-if="siteConfig.showLogo" src="/images/logo.png" alt="Logo" class="hero-logo" />
            <h1 class="site-title">
              <span class="title-text">{{ siteConfig.siteName }}</span>
            </h1>
            <p class="landing-text">{{ $t('landing.mainText') }}</p>
          </div>
        </div>
      </section>

      <!-- 第二屏：介绍页 -->
      <section class="fullpage-section section-intro">
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
      <section class="fullpage-section section-plans">
        <div class="plans-container" :class="{ 'is-visible': currentSection === 2 }">
          <h2 class="intro-title">{{ $t('landing.plansTitle') }}</h2>
          <p class="intro-subtitle">{{ $t('landing.plansSubtitle') }}</p>
          
          <div class="plans-grid">
            <div class="plan-card" v-for="(plan, index) in plans" :key="index"
                 :class="{ 'is-featured': plan.featured }"
                 :style="{ transitionDelay: currentSection === 2 ? `${0.2 + index * 0.15}s` : '0s' }">
              <div class="plan-badge" v-if="plan.featured">Recommend</div>
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
          
          <div class="mobile-swipe-hint">
            <div class="swipe-icon"></div>
          </div>
        </div>
      </section>

    </div>
    
    <!-- 分页指示器 -->
    <div class="page-indicators">
      <span class="indicator-dot" :class="{ active: currentSection === 0 }" @click="goToSection(0)"></span>
      <span class="indicator-dot" :class="{ active: currentSection === 1 }" @click="goToSection(1)"></span>
      <span class="indicator-dot" :class="{ active: currentSection === 2 }" @click="goToSection(2)"></span>
    </div>

    <!-- 底部箭头 -->
    <div class="scroll-arrow-container" @click="handleArrowClick">
      <div class="scroll-arrow">
        <IconChevronDown :size="32" :stroke-width="1.5" />
      </div>
      <div class="scroll-text">{{ currentSection < totalSections - 1 ? $t('landing.scrollMore') : $t('landing.enterPanel') }}</div>
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
import { IconChevronDown, IconBolt, IconWorld, IconShieldLock, IconCheck } from '@tabler/icons-vue';

export default {
  name: 'LandingPage',
  components: {
    ThemeToggle,
    LanguageSelector,
    DomainAuthAlert,
    IconChevronDown,
    IconBolt,
    IconWorld,
    IconShieldLock,
    IconCheck
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
    
    // 全屏分页状态
    const currentSection = ref(0);
    const totalSections = 3;
    let isScrolling = false; // 节流锁
    
    // 特性卡片数据
    const features = [
      { icon: IconBolt, titleKey: 'landing.featureSpeed', descKey: 'landing.featureSpeedDesc' },
      { icon: IconWorld, titleKey: 'landing.featureGlobal', descKey: 'landing.featureGlobalDesc' },
      { icon: IconShieldLock, titleKey: 'landing.featureSecurity', descKey: 'landing.featureSecurityDesc' }
    ];

    // 套餐数据
    const plans = [
      {
        nameKey: 'landing.planStandard',
        price: '25',
        featuresKey: ['landing.planFeature1', 'landing.planFeature2', 'landing.planFeature3'],
        featured: true
      },
      {
        nameKey: 'landing.planBasic',
        price: '15',
        featuresKey: ['landing.planFeature1', 'landing.planFeature2']
      },
      {
        nameKey: 'landing.planPro',
        price: '50',
        featuresKey: ['landing.planFeature1', 'landing.planFeature2', 'landing.planFeature3', 'landing.planFeature4']
      }
    ];
    
    let observer = null;

    // Initialize Vanta Background
    const initVanta = async () => {
      if (vantaEffect) vantaEffect.destroy();
      
      // 读取当前的 CSS 主题色变量
      const rootStyle = getComputedStyle(document.documentElement);
      let themeColorHex = rootStyle.getPropertyValue('--theme-color').trim();
      
      // 默认绿色作为兜底
      let parsedBaseColor = 0x10b981; 
      if (themeColorHex && themeColorHex.startsWith('#')) {
        parsedBaseColor = parseInt(themeColorHex.replace('#', '0x'), 16);
      }
      
      // 避免使用纯黑或过深的颜色，改用稍浅的深色，使光环内部不会显得像个黑洞
      const bgColor = 0x222222;
      
      // 移动端检测
      const isMobile = window.innerWidth <= 768;
      
      try {
        // 动态导入，避免阻塞首屏电影级 Loader
        const [THREE, { default: HALO }] = await Promise.all([
          import('three'),
          import('vanta/src/vanta.halo')
        ]);
        
        // 降低像素比例，极大地减少 GPU 计算量，肉眼几乎看不出区别
        const pixelRatio = window.devicePixelRatio > 1 ? 1.5 : 1;
        
        vantaEffect = HALO({
          el: vantaRef.value,
          THREE: THREE,
          mouseControls: !isMobile, // 移动端关闭以节省性能
          touchControls: !isMobile,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          backgroundColor: bgColor,
          baseColor: parsedBaseColor,
          amplitudeFactor: isMobile ? 1.0 : 2.0, // 移动端降级，PC端增加灵动感
          size: isMobile ? 1.2 : 2.5, // 增大光环体积，更有压迫感和视觉冲击力
          xOffset: 0,
          yOffset: 0 // 视觉中心完全居中
        });
      } catch (err) {
        console.error('Failed to load Vanta/Three.js', err);
      }
    };

    watch(isDarkTheme, () => {
      // Background is always black, but we can re-init if we want to change baseColor later
      // initVanta(); 
    });

    const handleVisibilityChange = () => {
      if (document.hidden) {
        if (vantaRef.value) vantaRef.value.style.display = 'none'; // 暂停后台渲染
      } else {
        if (vantaRef.value) vantaRef.value.style.display = 'block';
      }
    };

    onMounted(() => {
      document.addEventListener('visibilitychange', handleVisibilityChange);
      // 真实加载状态追踪
      let currentProgress = 0;
      let targetProgress = document.readyState === 'complete' ? 100 : 10;
      
      // 监听资源加载完成
      const onLoadComplete = () => {
        targetProgress = 100;
      };
      
      if (document.readyState === 'complete') {
        onLoadComplete();
      } else {
        window.addEventListener('load', onLoadComplete);
        // 另外也等待字体加载
        if (document.fonts) {
          document.fonts.ready.then(() => {
            if (targetProgress < 80) targetProgress = 80;
          });
        }
        // 模拟一个保底的渐进式加载，最多卡在 90%
        const fakeProgress = setInterval(() => {
          if (targetProgress < 90 && document.readyState !== 'complete') {
            targetProgress += Math.floor(Math.random() * 15) + 5;
            if (targetProgress > 90) targetProgress = 90;
          } else {
            clearInterval(fakeProgress);
          }
        }, 300);
      }

      // 平滑渲染进度条
      const renderProgress = () => {
        currentProgress += (targetProgress - currentProgress) * 0.1; // 缓动逼近目标
        // 如果目标比当前大，强制至少+1防止无限逼近
        if (targetProgress > currentProgress && targetProgress - currentProgress < 1) {
          currentProgress = targetProgress;
        }
        
        loadingProgress.value = Math.floor(currentProgress);
        
        if (loadingProgress.value >= 100) {
          loadingProgress.value = 100;
          window.removeEventListener('load', onLoadComplete);
          setTimeout(() => {
            preloaderDone.value = true;
          }, 400);
        } else {
          requestAnimationFrame(renderProgress);
        }
      };
      
      requestAnimationFrame(renderProgress);

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
      window.addEventListener('mousemove', onMouseMove, { passive: true });
      window.addEventListener('mouseover', onMouseOver, { passive: true });
      window.addEventListener('mouseout', onMouseOut, { passive: true });
      cursorRafId = requestAnimationFrame(animateCursor);
    });

    onUnmounted(() => {
      if (vantaEffect) vantaEffect.destroy();
      if (observer) observer.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseover', onMouseOver);
      window.removeEventListener('mouseout', onMouseOut);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (cursorRafId) cancelAnimationFrame(cursorRafId);
      if (btnRafId) cancelAnimationFrame(btnRafId); // 修复 btnRafId 内存泄漏
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
    };

    const clickableSelector = 'a, button, .hero-logo, .scroll-arrow-container, .top-toolbar, .site-title, .feature-card, .indicator-dot';

    const onMouseOver = (e) => {
      if (e.target.closest(clickableSelector)) {
        isHovering.value = true;
      }
    };

    const onMouseOut = (e) => {
      if (e.target.closest(clickableSelector)) {
        isHovering.value = false;
      }
    };

    const animateCursor = () => {
      // 移动端根本没有鼠标，直接掐断 requestAnimationFrame 循环节省 CPU
      if (window.innerWidth <= 768) return;
      
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
    
    // 全屏分页滚动逻辑
    const goToSection = (index) => {
      if (isScrolling || index === currentSection.value) return;
      if (index < 0 || index >= totalSections) return;
      isScrolling = true;
      currentSection.value = index;
      
      // 滚动休眠机制：滑到下方区域时，直接隐藏 Vanta 容器。
      // display: none 会被浏览器检测到，从而暂停 WebGL 内部的 requestAnimationFrame 渲染循环，让手机和电脑显卡彻底休息
      if (vantaRef.value) {
        if (index > 0) {
          vantaRef.value.style.opacity = '0';
          setTimeout(() => {
            if (currentSection.value > 0) vantaRef.value.style.display = 'none';
          }, 800);
        } else {
          vantaRef.value.style.display = 'block';
          // 给浏览器 50ms 的时间处理 DOM display:block，然后再恢复透明度
          setTimeout(() => {
            if (currentSection.value === 0) vantaRef.value.style.opacity = '1';
          }, 50);
        }
      }
      
      setTimeout(() => { isScrolling = false; }, 800); // 对应 CSS transition 时长
    };
    
    const handleScroll = (e) => {
      // 不再需要原有的 scroll 逻辑
    };
    
    const handleWheel = (e) => {
      if (isScrolling || isTransitioning.value) return;
      
      // 增加死区阈值，避免轻微滚动触发
      if (Math.abs(e.deltaY) < 30) return;
      
      if (e.deltaY > 0) {
        // 向下滚动
        if (currentSection.value < totalSections - 1) {
          goToSection(currentSection.value + 1);
        } else {
          // 已经是最后一屏，跳转登录
          navigateToLogin();
        }
      } else {
        // 向上滚动
        if (currentSection.value > 0) {
          goToSection(currentSection.value - 1);
        }
      }
    };
    
    const handleArrowClick = () => {
      if (currentSection.value < totalSections - 1) {
        goToSection(currentSection.value + 1);
      } else {
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
        if (isScrolling || isTransitioning.value) return;
        if (e.currentTarget === landingPageRef.value || landingPageRef.value.contains(e.target)) {
          const touchY = e.touches[0].clientY;
          const deltaY = touchStartY - touchY;
          
          if (Math.abs(deltaY) < 50) return; // 死区
          
          if (deltaY > 0) {
            // 向上滑（向下翻页）
            if (currentSection.value < totalSections - 1) {
              goToSection(currentSection.value + 1);
            } else {
              navigateToLogin();
            }
          } else {
            // 向下滑（向上翻页）
            if (currentSection.value > 0) {
              goToSection(currentSection.value - 1);
            }
          }
          // 重置起始点防止连续触发
          touchStartY = touchY;
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
    
    // 3D 按钮交互
    const enterBtnRef = ref(null);
    let btnRafId = null;
    let btnMouseX = 0;
    let btnMouseY = 0;
    let isBtnHovered = false;
    
    const onBtnEnter = () => {
      if (!enterBtnRef.value) return;
      isBtnHovered = true;
      enterBtnRef.value.style.transition = 'none';
      updateBtnTransform();
    };
    
    const onBtnMove = (e) => {
      if (!enterBtnRef.value) return;
      const rect = enterBtnRef.value.getBoundingClientRect();
      btnMouseX = e.clientX - rect.left;
      btnMouseY = e.clientY - rect.top;
    };
    
    const updateBtnTransform = () => {
      if (!isBtnHovered || !enterBtnRef.value) return;
      
      const btn = enterBtnRef.value;
      const rect = btn.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = rect.height / 2;
      const rotateX = ((btnMouseY - centerY) / centerY) * -12; // 最大倾斜12度
      const rotateY = ((btnMouseX - centerX) / centerX) * 12;
      
      btn.style.transform = `perspective(300px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.05, 1.05, 1.05)`;
      
      // 动态光斑跟随
      const shine = btn.querySelector('.enter-btn-shine');
      if (shine) {
        shine.style.background = `radial-gradient(circle at ${btnMouseX}px ${btnMouseY}px, rgba(255,255,255,0.25) 0%, transparent 60%)`;
      }
      
      btnRafId = requestAnimationFrame(updateBtnTransform);
    };
    
    const onBtnLeave = () => {
      isBtnHovered = false;
      if (btnRafId) cancelAnimationFrame(btnRafId);
      
      if (!enterBtnRef.value) return;
      enterBtnRef.value.style.transition = 'transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)';
      enterBtnRef.value.style.transform = 'perspective(300px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
      const shine = enterBtnRef.value.querySelector('.enter-btn-shine');
      if (shine) shine.style.background = 'transparent';
    };
    
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
      currentSection,
      totalSections,
      features,
      plans,
      enterBtnRef,
      navigateToLogin,
      handleScroll,
      handleWheel,
      handleArrowClick,
      goToSection,
      onBtnEnter,
      onBtnMove,
      onBtnLeave,
    };
  }
};
</script>

<style lang="scss" scoped>
.landing-page {
  position: relative;
  width: 100%;
  height: 100vh;
  height: 100dvh; /* 修复移动端地址栏导致的视觉偏下问题 */
  overflow: hidden;
  display: flex;
  flex-direction: column;
  justify-content: flex-start;
  align-items: center;
  background-color: var(--background-color);
  color: var(--text-color);
  transition: background-color 0.3s ease, color 0.3s ease;
  cursor: none; /* 隐藏默认鼠标，使用自定义鼠标 */
  
  @media (max-width: 768px) {
    cursor: auto; /* 移动端恢复默认 */
    touch-action: none; /* 必须禁用移动端默认下拉刷新和滑动历史记录，否则无法往回划 */
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
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  transition: filter 0.5s ease, opacity 0.8s cubic-bezier(0.65, 0, 0.35, 1);
  
  &.light-mode-filter {
    /* 适度压缩高光，保留一定的深色层次（呈现为深灰色），避免泛白的同时杜绝纯黑死区 */
    filter: brightness(0.85) invert(1) hue-rotate(180deg) brightness(1.5) saturate(2.0);
  }
}

/* Active Theory 风格噪点层 */
.noise-overlay {
  position: fixed;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  pointer-events: none;
  z-index: 2;
  opacity: 0.05; /* 降低一点透明度，静态噪点不需要太重 */
  /* numOctaves 改为 1 大幅降低 SVG 渲染计算量，且移除 animation 让 GPU/CPU 彻底休息 */
  background-image: url('data:image/svg+xml;utf8,%3Csvg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg"%3E%3Cfilter id="noiseFilter"%3E%3CfeTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="1" stitchTiles="stitch"/%3E%3C/filter%3E%3Crect width="100%25" height="100%25" filter="url(%23noiseFilter)"/%3E%3C/svg%3E');
  /* animation: noise-anim 0.2s steps(2) infinite;  移除恐怖的全屏高频重绘动画 */
}

@keyframes noise-anim {
  0% { transform: translate(0, 0); }
  10% { transform: translate(-2%, -2%); }
  20% { transform: translate(-4%, 2%); }
  30% { transform: translate(2%, -4%); }
  40% { transform: translate(-2%, 6%); }
  50% { transform: translate(-4%, 2%); }
  60% { transform: translate(6%, 0); }
  70% { transform: translate(0, 4%); }
  80% { transform: translate(-6%, 0); }
  90% { transform: translate(4%, 2%); }
  100% { transform: translate(2%, 0); }
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
  transition: width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1), 
              height 0.3s cubic-bezier(0.2, 0.8, 0.2, 1),
              background-color 0.3s ease;
  
  &.is-hovering {
    width: 64px;
    height: 64px;
    background-color: rgba(255, 255, 255, 0.8); /* 强化磁性吸附质感 */
  }
  
  @media (max-width: 768px) {
    display: none;
  }
}

.background-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  /* 白天模式下减弱暗角，保留少许深色质感避免完全泛白，同时不至于产生脏脏的黑边 */
  background: radial-gradient(circle at center, transparent 0%, rgba(0, 0, 0, 0.15) 100%);
  pointer-events: none;
  z-index: 1;
  
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    transition: opacity 0.8s cubic-bezier(0.4, 0, 0.2, 1);
    background: radial-gradient(circle at center, rgba(255, 255, 255, 0.4) 0%, rgba(255, 255, 255, 0.75) 100%);
  }
  
  &.dark-mode {
    /* 黑夜模式极深暗角，光环更神秘 */
    background: radial-gradient(circle at center, transparent 0%, rgba(3, 3, 3, 0.85) 100%);
    
    &::after {
      background: radial-gradient(circle at center, rgba(5, 5, 5, 0.45) 0%, rgba(5, 5, 5, 0.9) 100%);
    }
  }
  
  &.is-dimmed::after {
    opacity: 1;
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

/* 统一右上角辅助按钮的风格（毛玻璃 + 主题色高光） */
.top-toolbar :deep(.theme-toggle),
.top-toolbar :deep(.language-btn) {
  background: rgba(var(--theme-color-rgb), 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border: 1px solid transparent;
  color: #fff;
  box-shadow: none;
  transition: all 0.3s ease;
}

.top-toolbar :deep(.theme-toggle):hover,
.top-toolbar :deep(.language-btn):hover {
  background: rgba(var(--theme-color-rgb), 0.15);
  border-color: rgba(var(--theme-color-rgb), 0.5);
  box-shadow: 0 0 15px rgba(var(--theme-color-rgb), 0.4);
}

.landing-page:not(.dark-theme) .top-toolbar :deep(.theme-toggle),
.landing-page:not(.dark-theme) .top-toolbar :deep(.language-btn) {
  background: rgba(var(--theme-color-rgb), 0.05);
  border: 1px solid transparent;
  color: #333;
}

.landing-page:not(.dark-theme) .top-toolbar :deep(.theme-toggle):hover,
.landing-page:not(.dark-theme) .top-toolbar :deep(.language-btn):hover {
  background: rgba(var(--theme-color-rgb), 0.1);
  border-color: rgba(var(--theme-color-rgb), 0.4);
  box-shadow: 0 0 12px rgba(var(--theme-color-rgb), 0.2);
}

/* ============ 全屏分页滚动系统 ============ */
.sections-wrapper {
  position: relative;
  z-index: 10;
  width: 100%;
  will-change: transform;
  transition: transform 0.8s cubic-bezier(0.65, 0, 0.35, 1);
}

.fullpage-section {
  width: 100%;
  height: 100vh;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

/* ============ 第一屏：Hero ============ */
.section-hero .content-container {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100vh;
  height: 100dvh;
  pointer-events: none; /* 让鼠标事件穿透到 Vanta */
  
  @media (max-width: 768px) {
    padding-top: 7vh; /* 仅针对第一屏（内容少）进行视觉居中补偿，不影响二三屏 */
  }
}

.hero-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  pointer-events: auto;
  margin-top: -3vh;
  padding: 0 20px;
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s, transform 1s cubic-bezier(0.2, 0.8, 0.2, 1) 0.4s;
  
  @media (max-width: 768px) {
    margin-top: 0; /* 采用终极解决方案后，不需要再用魔法数字补偿高度了，回归绝对居中 */
  }
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
  margin-right: -4px; /* 修复 letter-spacing 导致的视觉不居中 */
  filter: drop-shadow(0 0 30px var(--background-color)) drop-shadow(0 5px 15px rgba(0, 0, 0, 0.5));
  
  .title-text {
    background-image: linear-gradient(135deg, color-mix(in srgb, var(--theme-color), white 40%), color-mix(in srgb, var(--theme-color), white 80%), color-mix(in srgb, var(--theme-color), white 40%));
    background-size: 200% auto;
    -webkit-background-clip: text;
    background-clip: text;
    color: transparent;
    -webkit-text-stroke: 1px rgba(255, 255, 255, 0.1);
    text-shadow: 0 0 10px rgba(var(--theme-color-rgb), 0.3); /* 发光也稍微减弱一点 */
    transition: all 0.3s ease;
    animation: title-gradient-flow 4s linear infinite;
  }
  
  @media (max-width: 768px) {
    font-size: 48px;
    letter-spacing: 2px;
    margin-right: -2px;
    word-break: break-word;
    padding: 0 10px;
    width: 100%;
    text-align: center;
    
    /* 终极解决方案：固定最小高度并内部居中 */
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 120px; /* 预留出两行文字的高度 */
  }
  
  @media (max-width: 480px) {
    font-size: 36px;
    letter-spacing: 1px;
    margin-right: -1px;
    width: 100%;
    text-align: center;
    
    min-height: 90px; /* 预留出两行文字的高度 */
  }
}

/* 浅色主题下第一页标题恢复较深的渐变色 */
.landing-page:not(.dark-theme) .site-title .title-text {
  background-image: linear-gradient(135deg, var(--theme-color), color-mix(in srgb, var(--theme-color), white 35%), var(--theme-color));
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

/* ============ 第二屏：介绍页 ============ */
.section-intro {
  position: relative;
}

.intro-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 0 40px;
  max-width: 1100px;
  width: 100%;
  pointer-events: auto;
}

.intro-title {
  font-size: 2.5rem;
  font-weight: 800;
  margin: 0 0 12px 0;
  letter-spacing: 2px;
  background-image: linear-gradient(135deg, color-mix(in srgb, var(--theme-color), white 40%), color-mix(in srgb, var(--theme-color), white 80%), color-mix(in srgb, var(--theme-color), white 40%));
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  opacity: 0;
  transform: translateY(30px);
  transition: opacity 0.7s ease, transform 0.7s ease;
  
  .is-visible & {
    opacity: 1;
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    font-size: 1.75rem;
  }
  
  @media (max-width: 480px) {
    font-size: 1.4rem;
    letter-spacing: 1px;
  }
}

/* 浅色主题下介绍页标题恢复较深的渐变色 */
.landing-page:not(.dark-theme) .intro-title {
  background-image: linear-gradient(135deg, var(--theme-color), color-mix(in srgb, var(--theme-color), white 40%));
}
  


.intro-subtitle {
  font-size: 1rem;
  color: var(--text-color);
  opacity: 0;
  margin: 0 0 50px 0;
  font-weight: 400;
  letter-spacing: 1px;
  max-width: 600px;
  line-height: 1.6;
  transform: translateY(20px);
  transition: opacity 0.7s ease 0.1s, transform 0.7s ease 0.1s;
  
  .is-visible & {
    opacity: 0.7;
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    font-size: 0.9rem;
    margin-bottom: 24px;
  }
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
  width: 100%;
  margin-bottom: 48px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 12px;
    max-width: 100%;
    margin-bottom: 24px;
  }
}

.feature-card {
  position: relative;
  padding: 36px 28px;
  border-radius: 20px;
  text-align: center;
  
  /* 毛玻璃效果 */
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top-color: rgba(255, 255, 255, 0.15);
  border-left-color: rgba(255, 255, 255, 0.12);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  
  /* 入场动画 */
  opacity: 0;
  transform: translateY(40px);
  transition: opacity 0.6s ease, transform 0.6s ease, border-color 0.3s ease, box-shadow 0.3s ease;
  
  .is-visible & {
    opacity: 1;
    transform: translateY(0);
  }
  
  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.3);
    box-shadow: 0 8px 32px rgba(var(--theme-color-rgb), 0.1);
  }
  
  @media (max-width: 768px) {
    display: grid;
    grid-template-columns: auto 1fr;
    grid-template-areas: 
      "icon title"
      "icon desc";
    gap: 4px 16px;
    align-items: center;
    text-align: left;
    padding: 16px 20px;
    border-radius: 16px;
  }
}

/* 浅色主题下卡片调整 */
.landing-page:not(.dark-theme) .feature-card {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  
  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.4);
    box-shadow: 0 8px 32px rgba(var(--theme-color-rgb), 0.08);
  }
}

.feature-icon-wrapper {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 56px;
  height: 56px;
  border-radius: 16px;
  margin-bottom: 20px;
  background: linear-gradient(135deg, rgba(var(--theme-color-rgb), 0.15), rgba(var(--theme-color-rgb), 0.05));
  color: var(--theme-color);
  
  @media (max-width: 768px) {
    grid-area: icon;
    width: 44px;
    height: 44px;
    border-radius: 12px;
    margin-bottom: 0;
  }
}

.feature-title {
  font-size: 1.1rem;
  font-weight: 700;
  margin: 0 0 10px 0;
  color: var(--text-color);
  letter-spacing: 0.5px;
  
  @media (max-width: 768px) {
    grid-area: title;
    font-size: 1rem;
    margin: 0;
  }
}

.feature-desc {
  font-size: 0.875rem;
  color: var(--text-color);
  opacity: 0.85;
  margin: 0;
  line-height: 1.6;
  
  @media (max-width: 768px) {
    grid-area: desc;
    font-size: 0.82rem;
    line-height: 1.4;
  }
}

/* ============ 右上角进入按钮 ============ */
.enter-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 24px;
  border: none; /* 使用伪元素画流动边框 */
  border-radius: 50px;
  font-size: 0.82rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  cursor: pointer;
  color: #fff;
  background: rgba(var(--theme-color-rgb), 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  transform-style: preserve-3d;
  transform: perspective(300px) rotateX(0) rotateY(0) scale3d(1, 1, 1);
  transition: background 0.3s ease, box-shadow 0.3s ease;
  
  /* 流动发光边框 */
  &::before {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(
      90deg,
      rgba(var(--theme-color-rgb), 0.1),
      rgba(var(--theme-color-rgb), 1),
      rgba(var(--theme-color-rgb), 0.1)
    );
    background-size: 200% 100%;
    animation: border-flow 3s linear infinite;
    -webkit-mask: 
      linear-gradient(#fff 0 0) content-box, 
      linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask-composite: exclude;
    pointer-events: none;
    z-index: 0;
  }
  
  .enter-btn-text {
    position: relative;
    z-index: 1;
    text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
  }
  
  /* 在线脉冲点 */
  .pulse-dot {
    position: relative;
    z-index: 1;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background-color: var(--theme-color);
    box-shadow: 0 0 8px var(--theme-color), 0 0 12px var(--theme-color);
    animation: pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }
  
  /* 鼠标跟随光斑 */
  .enter-btn-shine {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    border-radius: inherit;
    pointer-events: none;
    z-index: 1;
    transition: background 0.15s ease;
  }
  
  &:hover {
    background: rgba(var(--theme-color-rgb), 0.15);
    box-shadow: 0 8px 32px rgba(var(--theme-color-rgb), 0.4),
                0 0 15px rgba(var(--theme-color-rgb), 0.6),
                inset 0 0 20px rgba(var(--theme-color-rgb), 0.15);
    
    .pulse-dot {
      animation: none;
      transform: scale(1.2);
      box-shadow: 0 0 12px var(--theme-color), 0 0 20px var(--theme-color);
    }
    
    &::before {
      animation: border-flow 1.5s linear infinite;
      background: linear-gradient(
        90deg,
        rgba(var(--theme-color-rgb), 0.3),
        #ffffff,
        rgba(var(--theme-color-rgb), 0.3)
      );
      background-size: 200% 100%;
    }
  }
  
  &:active {
    transform: perspective(300px) rotateX(0) rotateY(0) scale3d(0.95, 0.95, 0.95) !important;
  }
  
  @media (max-width: 768px) {
    padding: 7px 18px;
    font-size: 0.75rem;
  }
}

/* 浅色主题下按钮调整 */
.landing-page:not(.dark-theme) .enter-btn {
  color: #333;
  background: rgba(var(--theme-color-rgb), 0.05);
  
  .enter-btn-text {
    text-shadow: none;
  }
  
  &::before {
    background: linear-gradient(
      90deg,
      rgba(var(--theme-color-rgb), 0.2),
      var(--theme-color),
      rgba(var(--theme-color-rgb), 0.2)
    );
    background-size: 200% 100%;
  }
  
  &:hover {
    background: rgba(var(--theme-color-rgb), 0.1);
    box-shadow: 0 8px 24px rgba(var(--theme-color-rgb), 0.25),
                0 0 12px rgba(var(--theme-color-rgb), 0.4);
                
    &::before {
      background: linear-gradient(
        90deg,
        rgba(var(--theme-color-rgb), 0.5),
        var(--theme-color),
        rgba(var(--theme-color-rgb), 0.5)
      );
      background-size: 200% 100%;
    }
  }
}

@keyframes border-flow {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}

@keyframes pulse-glow {
  0%, 100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.5; transform: scale(0.8); }
}

/* ============ 分页指示器 ============ */
.page-indicators {
  position: fixed;
  right: 30px;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  flex-direction: column;
  gap: 12px;
  z-index: 100;
  opacity: 0;
  transition: opacity 0.8s ease 1s;
  
  @media (max-width: 768px) {
    right: 16px;
    gap: 10px;
  }
}

.is-loaded .page-indicators {
  opacity: 1;
}

.indicator-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  cursor: pointer;
  transition: background 0.3s ease, transform 0.3s ease, box-shadow 0.3s ease;
  
  &.active {
    background: var(--theme-color);
    border-color: var(--theme-color);
    box-shadow: 0 0 10px rgba(var(--theme-color-rgb), 0.4);
    transform: scale(1.3);
  }
  
  &:hover:not(.active) {
    background: rgba(255, 255, 255, 0.4);
    transform: scale(1.15);
  }
}

/* 浅色主题下指示器调整 */
.landing-page:not(.dark-theme) .indicator-dot {
  background: rgba(0, 0, 0, 0.12);
  border-color: rgba(0, 0, 0, 0.2);
  
  &.active {
    background: var(--theme-color);
    border-color: var(--theme-color);
  }
  
  &:hover:not(.active) {
    background: rgba(0, 0, 0, 0.25);
  }
}

/* ============ 底部箭头 ============ */
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
  opacity: 1;}

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

/* ============ 套餐页样式 ============ */
.section-plans {
  /* 移除原本的 padding-top 避免整体偏下，利用 fullpage-section 的居中即可 */
}

.plans-container {
  max-width: 1200px;
  width: 100%;
  margin: 0 auto;
  padding: 0 24px;
  opacity: 0;
  transform: translateY(30px);
  transition: all 0.8s cubic-bezier(0.2, 0.8, 0.2, 1);
  
  &.is-visible {
    opacity: 1;
    transform: translateY(0);
  }
}

.plans-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
  margin-top: 50px;
  
  @media (max-width: 992px) {
    grid-template-columns: repeat(2, 1fr);
  }
  @media (max-width: 768px) {
    display: flex;
    flex-wrap: nowrap;
    overflow-x: auto;
    overflow-y: hidden;
    scroll-snap-type: x mandatory;
    margin: 20px -24px 0 -24px;
    padding: 20px 24px;
    gap: 16px;
    -ms-overflow-style: none;
    scrollbar-width: none;
    &::-webkit-scrollbar {
      display: none;
    }
  }
}

.mobile-swipe-hint {
  display: none;
  
  @media (max-width: 768px) {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 5px;
    opacity: 0;
    animation: swipeHintPulse 2s infinite, swipeHintFadeIn 1s ease forwards 1s;
    pointer-events: none;
  }
}

.swipe-icon {
  width: 36px;
  height: 20px;
  border: 1.5px solid rgba(255, 255, 255, 0.3);
  border-radius: 10px;
  position: relative;
  
  .landing-page:not(.dark-theme) & {
    border-color: rgba(0, 0, 0, 0.3);
  }
  
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 6px;
    width: 6px;
    height: 6px;
    background: var(--theme-color);
    border-radius: 50%;
    transform: translateY(-50%);
    animation: swipeLeftRight 2s ease-in-out infinite;
  }
}

@keyframes swipeLeftRight {
  0%, 100% { left: 5px; }
  50% { left: 22px; }
}
@keyframes swipeHintPulse {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 0.7; }
}
@keyframes swipeHintFadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

.plan-card {
  position: relative;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-top-color: rgba(255, 255, 255, 0.15);
  border-left-color: rgba(255, 255, 255, 0.12);
  border-radius: 24px;
  padding: 40px 30px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.05);
  text-align: left;
  opacity: 0;
  transform: translateY(40px);
  transition: all 0.6s cubic-bezier(0.2, 0.8, 0.2, 1);
  display: flex;
  flex-direction: column;
  
  &:hover {
    border-color: rgba(var(--theme-color-rgb), 0.3);
    transform: translateY(30px);
    box-shadow: 0 10px 40px -10px rgba(var(--theme-color-rgb), 0.2);
    
    @media (max-width: 992px) {
      transform: translateY(40px);
    }
    
    .plan-btn {
      background: rgba(var(--theme-color-rgb), 0.25);
      border-color: rgba(var(--theme-color-rgb), 0.6);
      color: #fff;
      box-shadow: 0 0 20px rgba(var(--theme-color-rgb), 0.4);
    }
  }
  
  @media (max-width: 768px) {
    min-width: 85vw;
    scroll-snap-align: center;
    padding: 24px 20px;
    
    /* On mobile, reset initial translate so it doesn't break horizontal flow */
    transform: translateY(0);
    opacity: 1; /* Disable fade-in on scroll to avoid glitching during horizontal swipe */
    
    &:hover {
      transform: translateY(0);
    }
  }
  
  &.is-featured {
    border: 1px solid rgba(var(--theme-color-rgb), 0.4);
    border-top-color: rgba(var(--theme-color-rgb), 0.6);
    border-left-color: rgba(var(--theme-color-rgb), 0.5);
    background: rgba(var(--theme-color-rgb), 0.12); /* 恢复原版透亮的主题色玻璃 */
    box-shadow: 0 8px 32px rgba(var(--theme-color-rgb), 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    transform: scale(1.05) translateY(38px);
    
    &:hover {
      transform: scale(1.05) translateY(28px);
      box-shadow: 0 15px 50px -10px rgba(var(--theme-color-rgb), 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1);
    }
    
    @media (max-width: 992px) {
      transform: translateY(40px);
      &:hover {
        transform: translateY(30px);
      }
    }
  }
}

.is-visible .plan-card {
  opacity: 1;
  transform: translateY(0);
  
  &.is-featured {
    transform: scale(1.05) translateY(0);
    
    @media (max-width: 992px) {
      transform: translateY(0);
    }
    @media (max-width: 768px) {
      transform: scale(1) translateY(0); /* Disable scale on mobile for smooth swiping */
    }
  }
  
  &:hover {
    transform: translateY(-10px);
    
    &.is-featured {
      transform: scale(1.05) translateY(-10px);
      
      @media (max-width: 992px) {
        transform: translateY(-10px);
      }
      @media (max-width: 768px) {
        transform: scale(1) translateY(0); /* Disable hover translate on mobile */
      }
    }
  }
  
  @media (max-width: 768px) {
    transform: translateY(0);
    
    &:hover {
      transform: translateY(0);
    }
  }
}

.plan-badge {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translate(-50%, -50%);
  background: var(--theme-color);
  color: #fff;
  padding: 6px 16px;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 700;
  letter-spacing: 1px;
  text-transform: uppercase;
  box-shadow: 0 4px 12px rgba(var(--theme-color-rgb), 0.4);
}

.plan-name {
  font-size: 1.25rem;
  font-weight: 600;
  color: #fff;
  margin: 0 0 15px;
  
  @media (max-width: 768px) {
    font-size: 1.1rem;
    margin-bottom: 10px;
  }
}

.landing-page:not(.dark-theme) .plan-name {
  color: #333;
}

.plan-price {
  margin-bottom: 30px;
  color: #fff;
  
  .currency {
    font-size: 1.5rem;
    font-weight: 500;
    vertical-align: super;
  }
  
  .amount {
    font-size: 3.5rem;
    font-weight: 700;
    line-height: 1;
    letter-spacing: -1px;
  }
  
  .period {
    font-size: 1rem;
    opacity: 0.7;
    margin-left: 4px;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
    
    .currency { font-size: 1.2rem; }
    .amount { font-size: 2.8rem; }
    .period { font-size: 0.85rem; }
  }
}

.landing-page:not(.dark-theme) .plan-price {
  color: var(--theme-color);
}

.plan-features-list {
  list-style: none;
  padding: 0;
  margin: 0 0 40px;
  flex-grow: 1;
  
  li {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
    color: rgba(255, 255, 255, 0.85);
    font-size: 0.95rem;
    
    .check-icon {
      color: var(--theme-color);
      margin-right: 12px;
      flex-shrink: 0;
    }
  }
  
  @media (max-width: 768px) {
    margin-bottom: 24px;
    
    li {
      margin-bottom: 12px;
      font-size: 0.85rem;
      
      .check-icon {
        margin-right: 8px;
        width: 16px;
        height: 16px;
      }
    }
  }
}

.landing-page:not(.dark-theme) .plan-features-list li {
  color: #555;
}

/* 浅色主题下套餐卡片调整 */
.landing-page:not(.dark-theme) .plan-card {
  background: rgba(255, 255, 255, 0.35);
  border-color: rgba(255, 255, 255, 0.5);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.4);
  
  &.is-featured {
    background: rgba(var(--theme-color-rgb), 0.15);
    border-color: rgba(var(--theme-color-rgb), 0.3);
    box-shadow: 0 8px 32px rgba(var(--theme-color-rgb), 0.1), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  }
}

.plan-btn {
  width: 100%;
  padding: 14px;
  border-radius: 12px;
  border: 1px solid transparent;
  background: rgba(var(--theme-color-rgb), 0.08);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  color: #fff;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  
  .is-featured & {
    background: rgba(var(--theme-color-rgb), 0.15);
    border-color: rgba(var(--theme-color-rgb), 0.4);
    box-shadow: 0 0 15px rgba(var(--theme-color-rgb), 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 12px;
    font-size: 0.95rem;
  }
}

.landing-page:not(.dark-theme) .plan-btn {
  background: rgba(var(--theme-color-rgb), 0.05);
  color: #333;
}

.landing-page:not(.dark-theme) .is-featured .plan-btn {
  background: rgba(var(--theme-color-rgb), 0.1);
  color: var(--theme-color);
}

.landing-page:not(.dark-theme) .plan-card:hover .plan-btn {
  background: rgba(var(--theme-color-rgb), 0.15);
  color: var(--theme-color);
}

.hide-arrow {
  opacity: 0 !important;
  pointer-events: none;
}
</style>
