import React from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colors, font } from '../theme';

export function AppHeader({ title, onBack, onMenu }) {
  return (
    <View style={styles.header}>
      <Pressable onPress={onBack || onMenu} style={styles.headerAction} accessibilityRole="button">
        <Text style={styles.headerActionText}>{onBack ? '‹' : '☰'}</Text>
      </Pressable>
      <View style={styles.headerCenter}>
        <Text numberOfLines={1} style={styles.headerTitle}>{title}</Text>
      </View>
      <Image source={require('../../assets/images/logo_app.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

export function PrimaryButton({ title, onPress, disabled, loading, style }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled || !!loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed, (disabled || loading) && styles.disabled, style]}
    >
      <Text style={styles.primaryText}>{loading ? 'لطفاً صبر کنید…' : title}</Text>
    </Pressable>
  );
}

export function OutlineButton({ title, onPress, disabled, style }) {
  return (
    <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={[styles.outlineButton, disabled && styles.disabled, style]}>
      <Text style={styles.outlineText}>{title}</Text>
    </Pressable>
  );
}

export function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType, maxLength }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        autoCapitalize="none"
        keyboardType={keyboardType || 'default'}
        maxLength={maxLength}
        onChangeText={onChangeText}
        placeholder={placeholder || label}
        placeholderTextColor="#9aa5a8"
        secureTextEntry={secureTextEntry}
        style={styles.field}
        textAlign="right"
        value={value}
      />
    </View>
  );
}

export function Panel({ children, style }) {
  return <View style={[styles.panel, style]}>{children}</View>;
}

export function SectionTitle({ children, action, onAction }) {
  return (
    <View style={styles.sectionRow}>
      {action ? <Pressable onPress={onAction}><Text style={styles.link}>{action}</Text></Pressable> : <View />}
      <Text style={styles.sectionTitle}>{children}</Text>
    </View>
  );
}

export function Notice({ children, tone = 'info' }) {
  const toneStyle = tone === 'warning' ? styles.noticeWarning : tone === 'error' ? styles.noticeError : styles.noticeInfo;
  return <View style={[styles.notice, toneStyle]}><Text style={styles.noticeText}>{children}</Text></View>;
}

export function EmptyState({ title = 'اطلاعاتی برای نمایش وجود ندارد', detail }) {
  return (
    <View style={styles.empty}>
      <Text style={styles.emptyIcon}>▤</Text>
      <Text style={styles.emptyTitle}>{title}</Text>
      {detail ? <Text style={styles.emptyDetail}>{detail}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  header: { minHeight: 58, paddingHorizontal: 14, flexDirection: 'row-reverse', alignItems: 'center', backgroundColor: colors.primary, elevation: 2 },
  headerAction: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  headerActionText: { color: colors.white, fontSize: 27, lineHeight: 32, fontFamily: font },
  headerCenter: { flex: 1, alignItems: 'flex-end', paddingHorizontal: 8 },
  headerTitle: { color: colors.white, fontFamily: font, fontSize: 16, fontWeight: '700' },
  logo: { width: 36, height: 36, marginLeft: 4, borderRadius: 18, backgroundColor: colors.white },
  primaryButton: { minHeight: 48, paddingHorizontal: 18, borderRadius: 8, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: colors.white, fontFamily: font, fontWeight: '700', fontSize: 14, textAlign: 'center', writingDirection: 'rtl' },
  outlineButton: { minHeight: 46, paddingHorizontal: 16, borderWidth: 1, borderColor: colors.primary, borderRadius: 8, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white },
  outlineText: { color: colors.primaryDark, fontFamily: font, fontSize: 13, fontWeight: '600', textAlign: 'center', writingDirection: 'rtl' },
  pressed: { opacity: 0.82 },
  disabled: { opacity: 0.5 },
  fieldWrap: { marginBottom: 14 },
  fieldLabel: { color: colors.text, fontFamily: font, fontSize: 13, marginBottom: 6, textAlign: 'right', writingDirection: 'rtl' },
  field: { minHeight: 48, borderColor: '#b9c9cb', borderWidth: 1, borderRadius: 7, backgroundColor: colors.white, color: colors.text, fontFamily: font, fontSize: 14, paddingHorizontal: 12, writingDirection: 'rtl' },
  panel: { backgroundColor: colors.white, borderColor: '#d7e1e2', borderWidth: 1, borderRadius: 10, padding: 14, marginBottom: 12, elevation: 1 },
  sectionRow: { flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10, marginTop: 8 },
  sectionTitle: { color: colors.text, fontFamily: font, fontWeight: '700', fontSize: 16, textAlign: 'right', writingDirection: 'rtl' },
  link: { color: colors.primary, fontFamily: font, fontSize: 12, textAlign: 'left', writingDirection: 'rtl' },
  notice: { borderRadius: 8, padding: 11, marginBottom: 12, borderWidth: 1 },
  noticeInfo: { borderColor: '#b8dadd', backgroundColor: '#edf8f8' },
  noticeWarning: { borderColor: '#ecd9af', backgroundColor: '#fff8e8' },
  noticeError: { borderColor: '#efc6c6', backgroundColor: '#fff0f0' },
  noticeText: { color: colors.text, fontFamily: font, fontSize: 12, lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  empty: { flex: 1, minHeight: 190, alignItems: 'center', justifyContent: 'center', padding: 24 },
  emptyIcon: { color: colors.primary, fontSize: 36, marginBottom: 8 },
  emptyTitle: { color: colors.text, fontFamily: font, fontSize: 15, fontWeight: '600', textAlign: 'center', writingDirection: 'rtl' },
  emptyDetail: { color: colors.muted, fontFamily: font, fontSize: 12, lineHeight: 20, textAlign: 'center', marginTop: 6, writingDirection: 'rtl' },
});
