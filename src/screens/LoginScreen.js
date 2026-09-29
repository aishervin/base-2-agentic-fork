import React, { useState } from 'react';
import { Image, ImageBackground, ScrollView, StyleSheet, Text, View } from 'react-native';
import { login } from '../api/authService';
import { DEMO_MODE } from '../config';
import { colors, font } from '../theme';
import { Field, Notice, OutlineButton, PrimaryButton } from '../components/Ui';

export default function LoginScreen({ onSignedIn, onOpen }) {
  const [nationalCode, setNationalCode] = useState('');
  const [password, setPassword] = useState('');
  const [capToken, setCapToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function submit() {
    setError('');
    setLoading(true);
    try {
      const user = await login({ nationalCode, password, capToken });
      onSignedIn({ mode: 'live', ...user });
    } catch (issue) {
      setError(issue.message || 'ورود انجام نشد.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <ImageBackground source={require('../../assets/images/logintopsectionbg.jpg')} resizeMode="cover" style={styles.background}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.hero}>
          <Image source={require('../../assets/images/loginlogo.png')} style={styles.loginLogo} resizeMode="contain" />
          <Text style={styles.title}>صدور بارنامه شهری</Text>
          <Text style={styles.subtitle}>ورود به سامانه</Text>
        </View>
        <View style={styles.panel}>
          {DEMO_MODE ? (
            <Notice tone="warning">نسخه نمایشی فعال است. ورود آزمایشی فقط داده نمونه را نشان می‌دهد و هیچ اطلاعاتی به سرور ارسال نمی‌کند.</Notice>
          ) : (
            <>
              <Field label="کد ملی / شناسه ملی" value={nationalCode} onChangeText={setNationalCode} keyboardType="number-pad" maxLength={11} />
              <Field label="رمز عبور" value={password} onChangeText={setPassword} secureTextEntry />
              <Field label="کد امنیتی (در صورت درخواست سرویس)" value={capToken} onChangeText={setCapToken} />
            </>
          )}
          {error ? <Notice tone="error">{error}</Notice> : null}
          {DEMO_MODE ? (
            <PrimaryButton title="ورود به نسخه آزمایشی" onPress={() => onSignedIn({ mode: 'demo' })} />
          ) : (
            <PrimaryButton title="ورود" loading={loading} onPress={submit} />
          )}
          <View style={styles.secondaryActions}>
            <OutlineButton title="ثبت نام" onPress={() => onOpen('signup')} style={styles.halfButton} />
            <OutlineButton title="فراموشی رمز عبور" onPress={() => onOpen('forgotPassword')} style={styles.halfButton} />
          </View>
          {!DEMO_MODE ? <Text style={styles.note}>ورود زنده به دسترسی مجاز API و سرآیندهای سرویس نیاز دارد.</Text> : null}
        </View>
        <Text style={styles.footer}>نسخه مستقل آزمایشی · بدون اتصال به درگاه وب</Text>
      </ScrollView>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  background: { flex: 1, backgroundColor: colors.primary },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 18 },
  hero: { alignItems: 'center', paddingTop: 24, paddingBottom: 20 },
  loginLogo: { width: 110, height: 110, marginBottom: 10 },
  title: { color: colors.white, fontFamily: font, fontWeight: '700', fontSize: 22, textAlign: 'center', writingDirection: 'rtl' },
  subtitle: { color: colors.white, fontFamily: font, fontSize: 14, marginTop: 6, textAlign: 'center', writingDirection: 'rtl' },
  panel: { padding: 18, borderRadius: 18, backgroundColor: colors.white, elevation: 4 },
  secondaryActions: { flexDirection: 'row-reverse', gap: 9, marginTop: 10 },
  halfButton: { flex: 1 },
  note: { color: colors.muted, fontFamily: font, fontSize: 11, lineHeight: 18, marginTop: 12, textAlign: 'right', writingDirection: 'rtl' },
  footer: { color: 'rgba(255,255,255,0.88)', fontFamily: font, fontSize: 11, textAlign: 'center', marginTop: 18, writingDirection: 'rtl' },
});
