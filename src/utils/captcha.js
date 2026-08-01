/**
 * Add a CAPTCHA token using the field name expected by the backend.
 * Xboard uses different request fields for reCAPTCHA and Turnstile.
 */
export const applyCaptchaToken = (payload, config, token) => {
  if (!token) return payload;

  const captchaType = String(config?.captcha_type || '').toLowerCase();

  if (captchaType === 'turnstile' || captchaType === 'cloudflare') {
    payload.turnstile_token = token;
  } else if (captchaType === 'recaptcha-v3') {
    payload.recaptcha_v3_token = token;
  } else {
    payload.recaptcha_data = token;
  }

  return payload;
};
