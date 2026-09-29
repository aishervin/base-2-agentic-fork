import { apiRequest, clearSession, saveAccessToken } from './client';

export async function login({ nationalCode, password, capToken = '' }) {
  if (!nationalCode?.trim() || !password) throw new Error('کد ملی و رمز عبور را وارد کنید.');
  const response = await apiRequest('/Account/UserLoginV2', {
    body: { nationalCode: nationalCode.trim(), password, capToken },
  });
  const user = response?.obj;
  const token = typeof user === 'string' ? user : user?.token || user?.accessToken;
  if (!token) throw new Error('پاسخ ورود token قابل استفاده نداشت.');
  await saveAccessToken(token);
  return { nationalCode: nationalCode.trim(), user };
}

export async function logout() {
  await clearSession();
}
