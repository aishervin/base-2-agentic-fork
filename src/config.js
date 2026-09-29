export const DEMO_MODE = process.env.EXPO_PUBLIC_DEMO_MODE === 'true';
export const API_BASE_URL = (
  process.env.EXPO_PUBLIC_API_BASE_URL ||
  'https://mobservices-barname.utcms.ir/baarnameh_sd/API'
).replace(/\/$/, '');
export const API_TIMEOUT_MS = 20000;
export const GPS_INTERVAL_MS = 20000;
export const GPS_FIX_TIMEOUT_MS = 18000;
