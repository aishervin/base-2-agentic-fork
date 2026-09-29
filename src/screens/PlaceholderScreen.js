import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { isAutomationEnabled, setAutomationEnabled } from '../automation/automationPolicy';
import { colors, font } from '../theme';
import { Notice, Panel, PrimaryButton } from '../components/Ui';

export default function PlaceholderScreen({ title, description, screenKey }) {
  const isSettings = screenKey === 'settings';
  const [automationEnabled, setAutomationEnabledState] = useState(false);
  const [policyLoaded, setPolicyLoaded] = useState(!isSettings);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isSettings) return;
    let mounted = true;
    isAutomationEnabled().then(enabled => {
      if (mounted) setAutomationEnabledState(enabled);
    }).catch(issue => {
      if (mounted) setError(issue.message || 'خواندن تنظیمات انجام نشد.');
    }).finally(() => {
      if (mounted) setPolicyLoaded(true);
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

  return (
    <ScrollView contentContainerStyle={styles.content}>
      {isSettings ? (
        <>
          <Panel>
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.description}>{description}</Text>
          </Panel>
          <Notice tone="warning">با فعال‌سازی این اجازه، ایجنت می‌تواند شروع و پایان حمل را بدون تأیید جداگانه انجام دهد. موقعیت مکانی در طول حمل ثبت می‌شود و اجازه GPS اندروید همچنان لازم است. هر زمان بخواهید می‌توانید این اجازه را خاموش کنید.</Notice>
          <Panel>
            <Text style={styles.policyTitle}>{automationEnabled ? 'اجازه کلی اتوماسیون فعال است' : 'اجازه کلی اتوماسیون خاموش است'}</Text>
            {error ? <Notice tone="error">{error}</Notice> : null}
            <PrimaryButton
              title={automationEnabled ? 'لغو اجازه اتوماسیون' : 'اجازه یک‌باره به ایجنت'}
              loading={saving}
              disabled={!policyLoaded}
              onPress={toggleAutomation}
              style={automationEnabled ? styles.revokeButton : undefined}
            />
          </Panel>
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
});
