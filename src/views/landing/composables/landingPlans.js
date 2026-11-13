const periods = ['month', 'quarter', 'half_year', 'year', 'two_year', 'three_year', 'onetime'];
const enabled = value => value !== false && value !== 0 && value !== '0';

// Prefer monthly pricing; otherwise show the first available billing period as-is.
export const normalizeLandingPlans = (catalog) => {
  if (!Array.isArray(catalog)) throw new Error('Invalid public plan catalog');
  return catalog
    .filter(plan => plan && enabled(plan.show) && enabled(plan.sell))
    .map(plan => {
      const period = periods.find(period => {
        const price = plan[`${period}_price`];
        return price !== null && price !== undefined && price !== '' &&
          Number.isFinite(Number(price)) && Number(price) >= 0;
      });
      if (!period) return null;
      return {
        ...plan,
        period,
        price: (Number(plan[`${period}_price`]) / 100).toFixed(2).replace(/\.00$/, ''),
        soldOut: Number(plan.capacity_limit) === 0 && plan.capacity_limit != null
      };
    })
    .filter(Boolean)
    .sort((a, b) => (Number(a.sort) || 0) - (Number(b.sort) || 0));
};
