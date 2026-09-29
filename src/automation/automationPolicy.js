import AsyncStorage from '@react-native-async-storage/async-storage';
import { assertAutomationEnabled } from './policyContract';

const POLICY_KEY = 'automation.policy.enabled';

export async function isAutomationEnabled() {
  return (await AsyncStorage.getItem(POLICY_KEY)) === 'true';
}

export async function setAutomationEnabled(enabled) {
  if (typeof enabled !== 'boolean') throw new Error('مقدار اجازه اتوماسیون معتبر نیست.');
  if (enabled) await AsyncStorage.setItem(POLICY_KEY, 'true');
  else await AsyncStorage.removeItem(POLICY_KEY);
  return enabled;
}

export async function requireAutomationEnabled(action) {
  assertAutomationEnabled(await isAutomationEnabled(), action);
}
