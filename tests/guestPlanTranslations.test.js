import { describe, expect, it, vi } from 'vitest';
import { createI18n } from 'vue-i18n';
import guestMessages from '../src/i18n/locales/auth/index';

vi.mock('../src/utils/baseConfig', () => ({ SITE_CONFIG: { siteName: 'Test', landingText: {} } }));

const fullLocaleModules = import.meta.glob('../src/i18n/locales/*.js', { eager: true });
const periods = ['month', 'quarter', 'half_year', 'year', 'two_year', 'three_year', 'onetime'];
const planKeys = [
  ...periods.map(period => `shop.plan.periods.${period}`),
  'shop.loading', 'shop.no_plans_found', 'shop.plan.sold_out_btn',
  'payment.traffic', 'dashboard.deviceLimit', 'dashboard.unlimited',
  'common.viewDetails', 'common.retry'
];

describe('guest landing plan translations', () => {
  it.each(Object.keys(guestMessages))('%s renders every plan label without a signed-in language bundle', locale => {
    const i18n = createI18n({ legacy: false, locale, fallbackLocale: false, messages: { [locale]: guestMessages[locale] } });
    const full = fullLocaleModules[`../src/i18n/locales/${locale}.js`].default;
    for (const key of planKeys) {
      expect(i18n.global.te(key, locale), `${locale}: ${key}`).toBe(true);
      const expected = key.split('.').reduce((value, part) => value[part], full);
      expect(i18n.global.t(key), `${locale}: ${key}`).toBe(expected);
    }
  });
});
