import { describe, expect, it } from 'vitest';
import { normalizeLandingPlans } from '../src/views/landing/composables/landingPlans';

describe('public landing catalog', () => {
  it('uses real plan names, sorts by the backend order and converts cents without rounding away decimals', () => {
    const result = normalizeLandingPlans([
      { id: 1, name: 'Gold', month_price: 2500, sort: 2 },
      { id: 2, name: 'Silver', month_price: 1500, sort: 1 },
      { id: 4, name: 'Connect', month_price: 3001, sort: 4 }
    ]);
    expect(result.map(({ name, price }) => [name, price])).toEqual([
      ['Silver', '15'], ['Gold', '25'], ['Connect', '30.01']
    ]);
  });

  it('excludes hidden, renewal-only and unpriced plans while retaining sold-out plans with a disabled purchase state', () => {
    const result = normalizeLandingPlans([
      { id: 1, show: false, month_price: 100 },
      { id: 2, sell: '0', month_price: 100 },
      { id: 3, reset_price: 100 },
      { id: 4, month_price: -1 },
      { id: 5, month_price: 100, capacity_limit: 0 },
      { id: 6, month_price: 100, capacity_limit: null }
    ]);
    expect(result.map(plan => [plan.id, plan.soldOut])).toEqual([[5, true], [6, false]]);
  });

  it('keeps free plans and labels fallback prices with their actual billing period', () => {
    const result = normalizeLandingPlans([
      { id: 1, month_price: 0, year_price: 10000 },
      { id: 2, month_price: null, year_price: 12000 },
      { id: 3, month_price: '', onetime_price: '990' }
    ]);
    expect(result.map(({ price, period }) => [price, period])).toEqual([
      ['0', 'month'], ['120', 'year'], ['9.90', 'onetime']
    ]);
  });

  it('rejects malformed responses instead of presenting invented fallback prices', () => {
    expect(() => normalizeLandingPlans(null)).toThrow();
    expect(normalizeLandingPlans([])).toEqual([]);
  });
});
