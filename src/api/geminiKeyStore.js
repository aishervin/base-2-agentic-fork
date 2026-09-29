import * as SecureStore from 'expo-secure-store';

const GEMINI_KEY = 'gemini.apiKey';

export async function getGeminiApiKey() {
  return SecureStore.getItemAsync(GEMINI_KEY);
}

export async function hasGeminiApiKey() {
  return Boolean(await getGeminiApiKey());
}

export async function saveGeminiApiKey(value) {
  const key = String(value || '').trim();
  if (key.length < 20) throw new Error('کلید Gemini معتبر به نظر نمی‌رسد.');
  await SecureStore.setItemAsync(GEMINI_KEY, key);
}

export async function removeGeminiApiKey() {
  await SecureStore.deleteItemAsync(GEMINI_KEY);
}
