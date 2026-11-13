import request from './request';

// Public catalog: this endpoint does not require an authenticated session.
export const fetchGuestPlans = (signal) => request({
  url: '/guest/plan/fetch',
  method: 'get',
  signal
});
