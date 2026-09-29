import * as SecureStore from 'expo-secure-store';
import { API_BASE_URL, API_TIMEOUT_MS, DEMO_MODE } from '../config';

const ACCESS_TOKEN_KEY = 'auth.accessToken';
const SERVICE_PASSWORD_KEY = 'service.password';
const SECURITY_KEY_KEY = 'service.securityKey';

export async function saveAccessToken(token) {
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, token);
}

export async function getAccessToken() {
  return SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
}

async function getServiceHeaders() {
  const [servicePassword, securityKey] = await Promise.all([
    SecureStore.getItemAsync(SERVICE_PASSWORD_KEY),
    SecureStore.getItemAsync(SECURITY_KEY_KEY),
  ]);
  return {
    ...(servicePassword ? { ServicePassword: servicePassword } : {}),
    ...(securityKey ? { SecurityKey: securityKey } : {}),
  };
}

export async function apiRequest(path, { method = 'POST', body, params, token } = {}) {
  if (DEMO_MODE) {
    throw new Error('حالت نمایشی فعال است؛ هیچ درخواستی به سرویس ارسال نشد.');
  }
  if (!API_BASE_URL) throw new Error('نشانی API تنظیم نشده است.');

  const accessToken = token || await getAccessToken();
  const serviceHeaders = await getServiceHeaders();
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
    ...serviceHeaders,
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
  };
  const url = new URL(`${API_BASE_URL}${path}`);
  Object.entries(params || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') url.searchParams.set(key, String(value));
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
  try {
    const response = await fetch(url.toString(), {
      method,
      headers,
      signal: controller.signal,
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    });
    const payload = await response.json().catch(() => null);
    if (!response.ok) throw new Error(payload?.resultMessage || `خطای ارتباط با سرویس (${response.status})`);
    if (payload?.resultCode !== undefined && Number(payload.resultCode) !== 200) {
      throw new Error(payload.resultMessage || 'سرویس درخواست را نپذیرفت.');
    }
    return payload;
  } catch (error) {
    if (error.name === 'AbortError') throw new Error('پاسخی از سرویس دریافت نشد؛ مهلت ۲۰ ثانیه تمام شد.');
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const serviceCredentialKeys = { SERVICE_PASSWORD_KEY, SECURITY_KEY_KEY };
