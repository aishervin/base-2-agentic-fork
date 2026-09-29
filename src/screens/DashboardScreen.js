import React, { useEffect, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { getActiveTrip } from '../api/tripService';
import { colors, font } from '../theme';
import { Notice, Panel, SectionTitle } from '../components/Ui';

const tiles = [
  { key: 'newdoc', title: 'بارنامه حقیقی', image: require('../../assets/images/baarbarg_hagigi.png'), color: '#005A7C' },
  { key: 'daily', title: 'بارنامه روزانه', image: require('../../assets/images/baarbarg_daily.png'), color: '#007C25' },
  { key: 'carrying', title: 'اسناد در حال حمل', image: require('../../assets/images/iconcarying.png'), color: '#128591' },
  { key: 'history', title: 'تاریخچه اسناد حمل', image: require('../../assets/images/shipping_doc_history.png'), color: '#4BA8EB' },
  { key: 'wallet', title: 'کیف پول اعتباری', image: require('../../assets/images/wallet.png'), color: '#d1a722' },
  { key: 'fuel', title: 'سهمیه سوخت', image: require('../../assets/images/gas_station.png'), color: '#f77238' },
  { key: 'inbox', title: 'پیام‌ها', image: require('../../assets/images/contactus.png'), color: '#085963' },
  { key: 'settings', title: 'تنظیمات و حساب', image: require('../../assets/images/images_userprofilenoimage.png'), color: '#616161' },
];

export default function DashboardScreen({ session, onOpen }) {
  const [activeTrip, setActiveTrip] = useState(null);

  useEffect(() => {
    getActiveTrip().then(setActiveTrip).catch(() => setActiveTrip(null));
  }, []);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Image source={require('../../assets/images/mainpagebkscreen.jpg')} style={styles.topArt} resizeMode="cover" />
      <View style={styles.greeting}>
        <Text style={styles.eyebrow}>به سامانه خوش آمدید</Text>
        <Text style={styles.name}>{session?.mode === 'demo' ? 'کاربر آزمایشی' : session?.nationalCode || 'کاربر'}</Text>
      </View>
      {session?.mode === 'demo' ? <Notice tone="warning">حالت آزمایشی · هیچ عملیات واقعی روی سند انجام نمی‌شود.</Notice> : null}
      {activeTrip ? (
        <Pressable onPress={() => onOpen('carrying')}>
          <Panel style={styles.activePanel}>
            <Text style={styles.activeTitle}>بارنامه در حال حمل</Text>
            <Text style={styles.activeText}>برای ادامه مسیر و ثبت پایان حمل وارد شوید.</Text>
          </Panel>
        </Pressable>
      ) : null}
      <SectionTitle>خدمات</SectionTitle>
      <View style={styles.grid}>
        {tiles.map(tile => (
          <Pressable key={tile.key} onPress={() => onOpen(tile.key)} style={({ pressed }) => [styles.tile, pressed && styles.pressed]}>
            <View style={[styles.iconFrame, { borderColor: tile.color }]}>
              <Image source={tile.image} style={styles.icon} resizeMode="contain" />
            </View>
            <Text style={styles.tileTitle}>{tile.title}</Text>
          </Pressable>
        ))}
      </View>
      <Panel style={styles.helpPanel}>
        <Text style={styles.helpTitle}>ثبت مسیر حمل</Text>
        <Text style={styles.helpText}>برای محاسبه پیمایش، اینترنت و GPS باید روشن باشد. برنامه در زمان ثبت مسیر اعلان دائمی اندروید نمایش می‌دهد.</Text>
      </Panel>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 14, paddingBottom: 30, backgroundColor: colors.canvas },
  topArt: { height: 108, width: '100%', borderRadius: 12, opacity: 0.92 },
  greeting: { alignItems: 'flex-end', marginTop: -76, height: 70, paddingHorizontal: 16 },
  eyebrow: { color: colors.primaryDark, fontFamily: font, fontSize: 11, textAlign: 'right', writingDirection: 'rtl' },
  name: { color: colors.text, fontFamily: font, fontWeight: '700', fontSize: 18, marginTop: 3, textAlign: 'right', writingDirection: 'rtl' },
  activePanel: { backgroundColor: colors.activeTrip, borderColor: '#a5dce6' },
  activeTitle: { color: colors.primaryDark, fontFamily: font, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  activeText: { color: colors.text, fontFamily: font, fontSize: 12, marginTop: 4, textAlign: 'right', writingDirection: 'rtl' },
  grid: { flexDirection: 'row-reverse', flexWrap: 'wrap', justifyContent: 'space-between' },
  tile: { width: '48.5%', minHeight: 135, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: '#e1e7e8', borderRadius: 11, marginBottom: 10, elevation: 1, padding: 10 },
  iconFrame: { width: 60, height: 60, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderRadius: 30, backgroundColor: colors.white },
  icon: { width: 44, height: 44 },
  tileTitle: { color: colors.text, fontFamily: font, fontSize: 12, fontWeight: '600', marginTop: 8, textAlign: 'center', writingDirection: 'rtl' },
  pressed: { opacity: 0.82 },
  helpPanel: { marginTop: 8 },
  helpTitle: { color: colors.text, fontFamily: font, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  helpText: { color: colors.muted, fontFamily: font, fontSize: 11, lineHeight: 19, marginTop: 6, textAlign: 'right', writingDirection: 'rtl' },
});
