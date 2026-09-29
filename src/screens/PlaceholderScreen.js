import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { hasGeminiApiKey, removeGeminiApiKey, saveGeminiApiKey } from '../api/geminiKeyStore';
import { isAutomationEnabled, setAutomationEnabled } from '../automation/automationPolicy';
import { DEMO_MODE } from '../config';
import { requestTripLocationAccess } from '../services/locationService';
import { colors, font } from '../theme';
import { Field, Notice, OutlineButton, Panel, PrimaryButton } from '../components/Ui';

export default function PlaceholderScreen({ title, description, screenKey }) {
  const isSettings = screenKey === 'settings';
  const [automationEnabled, setAutomationEnabledState] = useState(false);
  const [policyLoaded, setPolicyLoaded] = useState(!isSettings);
  const [saving, setSaving] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiKeySaved, setApiKeySaved] = useState(false);
  const [keyLoaded, setKeyLoaded] = useState(!isSettings);
  const [locationGranted, setLocationGranted] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSettings) return;
    let mounted = true;
    Promise.all([isAutomationEnabled(), hasGeminiApiKey()]).then(([enabled, key]) => {
      if (mounted) {
        setAutomationEnabledState(enabled);
        setApiKeySaved(key);
      }
    }).catch(issue => {
      if (mounted) setError(issue.message || 'خواندن تنظیمات انجام نشد.');
    }).finally(() => {
      if (mounted) {
        setPolicyLoaded(true);
        setKeyLoaded(true);
      }
    });
    return () => { mounted = false; };
  }, [isSettings]);

  async function toggleAutomation() {
    setSaving(true);
    setError('');
    try {
      const enabled = await setAutomationEnabled(!automationEnabled);
      setAutomationEnabledState(enabled);
    } catch (issue) {
      setError(issue.message || 'ذخیره تنظیمات انجام نشد.');
    } finally {
      setSaving(false);
    }
  }

  async function saveKey() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await saveGeminiApiKey(apiKey);
      setApiKey('');
      setApiKeySaved(true);
      setSuccess('کلید Gemini به‌صورت امن روی همین دستگاه ذخیره شد.');
    } catch (issue) {
      setError(issue.message || 'ذخیره کلید Gemini انجام نشد.');
    } finally {
      setSaving(false);
    }
  }

  async function removeKey() {
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await removeGeminiApiKey();
      setApiKeySaved(false);
      setSuccess('کلید Gemini از دستگاه حذف شد.');
    } catch (issue) {
      setError(issue.message || 'حذف کلید Gemini انجام نشد.');
    } finally {
      setSaving(false);
    }
  }

  async function grantLocation() {
    setError('');
    setSuccess('');
    try {
      await requestTripLocationAccess();
      setLocationGranted(true);
      setSuccess('مجوز GPS برای این دستگاه فعال شد.');
    } catch (issue) {
      setError(issue.message || 'مجوز GPS فعال نشد.');
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {isSettings ? (
        <>
          <Panel>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </Panel>
          <Panel>
            <Text style={styles.policyTitle}>کلید Gemini 2.5 Flash</Text>
            <Text style={styles.description}>کلید فقط روی همین دستگاه و در فضای امن Android ذخیره می‌شود؛ در پیام‌ها یا APK قرار نمی‌گیرد. متن گفتگو و اطلاعات سندی که برای پاسخ لازم است به Google Gemini ارسال می‌شود.</Text>
            <Field label="کلید API Gemini" value={apiKey} onChangeText={setApiKey} secureTextEntry placeholder={apiKeySaved ? 'کلید ذخیره شده؛ برای جایگزینی وارد کنید' : 'کلید API را وارد کنید'} />
            {apiKeySaved ? <Notice>یک کلید Gemini روی این دستگاه ذخیره شده است؛ مقدار آن نمایش داده نمی‌شود.</Notice> : null}
            <PrimaryButton title="ذخیره کلید روی دستگاه" loading={saving} disabled={!keyLoaded || !apiKey.trim()} onPress={saveKey} />
            {apiKeySaved ? <OutlineButton title="حذف کلید ذخیره‌شده" disabled={saving} onPress={removeKey} style={styles.secondaryButton} /> : null}
          </Panel>
          <Notice tone="warning">با فعال‌سازی این اجازه، Gemini می‌تواند از ابزارهای فعلی برنامه برای خواندن اسناد، جابه‌جایی بین بخش‌ها، زمان‌بندی و شروع/پایان حمل استفاده کند؛ برای هر عملیات تأیید جداگانه نمی‌پرسد. رمز ورود و token در اختیار مدل نیستند. هر زمان بخواهید می‌توانید این اجازه را خاموش کنید.</Notice>
          <Panel>
            <Text style={styles.policyTitle}>{automationEnabled ? 'اجازه کلی اتوماسیون فعال است' : 'اجازه کلی اتوماسیون خاموش است'}</Text>
            <PrimaryButton
              title={automationEnabled ? 'لغو اجازه اتوماسیون' : 'اجازه یک‌باره به ایجنت'}
              loading={saving}
              disabled={!policyLoaded}
              onPress={toggleAutomation}
              style={automationEnabled ? styles.revokeButton : undefined}
            />
          </Panel>
          {success ? <Notice>{success}</Notice> : null}
          {!DEMO_MODE ? (
            <Panel>
              <Text style={styles.policyTitle}>دسترسی موقعیت مکانی</Text>
              <Text style={styles.description}>برای اجرای زمان‌بندی‌شده شروع یا پایان حمل، مجوزهای GPS را همین‌جا و در زمان بازبودن برنامه به Android بدهید. این اجازه‌ها را سیستم‌عامل از شما می‌گیرد.</Text>
              {locationGranted ? <Notice>مجوز GPS فعال است.</Notice> : null}
              <PrimaryButton title="درخواست مجوز GPS از Android" onPress={grantLocation} />
            </Panel>
          ) : null}
          {error ? <Notice tone="error">{error}</Notice> : null}
        </>
      ) : (
        <>
          <Panel>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </Panel>
          <Notice tone="warning">این بخش در فورک فعلی به UI و API واقعی وصل نشده است. مسیرهای اصلی اسناد و شروع/پایان حمل آماده‌اند.</Notice>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 14, backgroundColor: colors.canvas },
  title: { color: colors.text, fontFamily: font, fontWeight: '700', fontSize: 18, textAlign: 'right', writingDirection: 'rtl' },
  description: { color: colors.muted, fontFamily: font, fontSize: 13, lineHeight: 23, marginTop: 10, textAlign: 'right', writingDirection: 'rtl' },
  policyTitle: { color: colors.text, fontFamily: font, fontWeight: '700', fontSize: 14, marginBottom: 12, textAlign: 'right', writingDirection: 'rtl' },
  revokeButton: { backgroundColor: colors.danger },
  secondaryButton: { marginTop: 8 },
});
