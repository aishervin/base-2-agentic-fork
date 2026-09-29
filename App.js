import React, { useEffect, useState } from 'react';
import { Alert, BackHandler, Modal, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { clearSession, getAccessToken } from './src/api/client';
import { DEMO_MODE } from './src/config';
import { AppHeader } from './src/components/Ui';
import DashboardScreen from './src/screens/DashboardScreen';
import LoginScreen from './src/screens/LoginScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import ShipmentDetailsScreen from './src/screens/ShipmentDetailsScreen';
import ShipmentsScreen from './src/screens/ShipmentsScreen';
import { colors, font } from './src/theme';

const placeholderCopy = {
  newdoc: ['صدور بارنامه حقیقی', 'فرم چندمرحله‌ای صدور در ادامه بازسازی می‌شود.'],
  daily: ['بارنامه روزانه', 'انتخاب خودرو، تاریخ و محدوده فعالیت به اتصال مجاز API نیاز دارد.'],
  wallet: ['کیف پول اعتباری', 'اطلاعات کیف پول در این نسخه به API وصل نشده است.'],
  fuel: ['سهمیه سوخت', 'استعلام سهمیه پس از اتصال سرویس اجرا خواهد شد.'],
  inbox: ['پیام‌ها', 'فهرست پیام‌ها پس از اتصال سرویس نمایش داده می‌شود.'],
  settings: ['حساب و تنظیمات', 'تنظیمات محلی فورک. توکن ورود در فضای امن دستگاه نگه‌داری می‌شود.'],
  signup: ['ثبت نام', 'ثبت نام و کپچا به تأیید قرارداد API واقعی نیاز دارند.'],
  forgotPassword: ['فراموشی رمز عبور', 'بازیابی رمز بعد از اتصال سرویس پیامکی پیاده‌سازی می‌شود.'],
};

export default function App() {
  const [fontsLoaded] = useFonts({
    IRANSansMobile: require('./assets/fonts/IRANSansMobile.ttf'),
    IRANSansMobileBold: require('./assets/fonts/IRANSansMobile_Bold.ttf'),
  });
  const [stack, setStack] = useState([{ name: 'login', params: {} }]);
  const [session, setSession] = useState(null);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const route = stack[stack.length - 1];

  useEffect(() => {
    let mounted = true;
    if (!DEMO_MODE) {
      getAccessToken().then(token => {
        if (mounted && token) {
          setSession({ mode: 'live' });
          setStack([{ name: 'dashboard', params: {} }]);
        }
      }).catch(() => {});
    }
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (drawerVisible) {
        setDrawerVisible(false);
        return true;
      }
      if (stack.length > 1) {
        setStack(current => current.slice(0, -1));
        return true;
      }
      return route.name !== 'dashboard';
    });
    return () => subscription.remove();
  }, [drawerVisible, route.name, stack.length]);

  function navigate(name, params = {}) {
    setStack(current => [...current, { name, params }]);
  }

  function resetTo(name, params = {}) {
    setStack([{ name, params }]);
  }

  function openService(key) {
    if (key === 'carrying') navigate('shipments', { status: 'carrying' });
    else if (key === 'history') navigate('shipments', { status: 'issued' });
    else navigate('placeholder', { key, title: placeholderCopy[key]?.[0] || 'خدمات', description: placeholderCopy[key]?.[1] || '' });
  }

  async function signOut() {
    setDrawerVisible(false);
    Alert.alert('خروج از برنامه', 'از حساب خارج شوید؟', [
      { text: 'انصراف', style: 'cancel' },
      { text: 'خروج', style: 'destructive', onPress: async () => {
        await clearSession();
        setSession(null);
        resetTo('login');
      } },
    ]);
  }

  if (!fontsLoaded) return <View style={styles.loading}><Text style={styles.loadingText}>در حال آماده‌سازی برنامه…</Text></View>;

  const title = route.name === 'dashboard' ? 'صدور بارنامه شهری'
    : route.name === 'shipments' ? (route.params.status === 'carrying' ? 'اسناد در حال حمل' : 'تاریخچه اسناد حمل')
      : route.name === 'shipment' ? 'جزئیات سند'
        : route.params.title || 'خدمات';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" backgroundColor={colors.primary} />
      {route.name !== 'login' ? <AppHeader title={title} onBack={stack.length > 1 ? () => setStack(current => current.slice(0, -1)) : undefined} onMenu={() => setDrawerVisible(true)} /> : null}
      <View style={styles.body}>
        {route.name === 'login' ? (
          <LoginScreen
            onSignedIn={value => { setSession(value); resetTo('dashboard'); }}
            onOpen={key => navigate('placeholder', {
              key,
              title: placeholderCopy[key]?.[0] || 'خدمات',
              description: placeholderCopy[key]?.[1] || '',
            })}
          />
        ) : null}
        {route.name === 'dashboard' ? <DashboardScreen session={session} onOpen={openService} /> : null}
        {route.name === 'shipments' ? <ShipmentsScreen initialStatus={route.params.status} mode={session?.mode} onSelect={document => navigate('shipment', { document })} /> : null}
        {route.name === 'shipment' ? <ShipmentDetailsScreen document={route.params.document} mode={session?.mode} onTripChanged={status => resetTo('shipments', { status })} /> : null}
        {route.name === 'placeholder' ? <PlaceholderScreen title={route.params.title} description={route.params.description} /> : null}
      </View>
      <Modal visible={drawerVisible} transparent animationType="fade" onRequestClose={() => setDrawerVisible(false)}>
        <View style={styles.drawerOverlay}>
          <View style={styles.drawer}>
            <View style={styles.drawerTitleWrap}>
              <Text style={styles.drawerTitle}>صدور بارنامه شهری</Text>
              <Text style={styles.drawerSub}>{session?.mode === 'demo' ? 'نسخه آزمایشی' : 'حساب کاربری'}</Text>
            </View>
            <ScrollView>
              <DrawerItem title="صفحه اصلی" onPress={() => { setDrawerVisible(false); resetTo('dashboard'); }} />
              <DrawerItem title="اسناد در حال حمل" onPress={() => { setDrawerVisible(false); resetTo('shipments', { status: 'carrying' }); }} />
              <DrawerItem title="تاریخچه اسناد حمل" onPress={() => { setDrawerVisible(false); resetTo('shipments', { status: 'issued' }); }} />
              <DrawerItem title="کیف پول اعتباری" onPress={() => { setDrawerVisible(false); openService('wallet'); }} />
              <DrawerItem title="تنظیمات و حساب" onPress={() => { setDrawerVisible(false); openService('settings'); }} />
              <DrawerItem title="خروج از برنامه" onPress={signOut} danger />
            </ScrollView>
          </View>
          <Pressable style={styles.drawerScrim} onPress={() => setDrawerVisible(false)} />
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function DrawerItem({ title, onPress, danger }) {
  return <Pressable onPress={onPress} style={styles.drawerItem}><Text style={[styles.drawerItemText, danger && styles.danger]}>{title}</Text></Pressable>;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.canvas },
  body: { flex: 1 },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.primary },
  loadingText: { color: colors.white, fontFamily: font, fontSize: 14, writingDirection: 'rtl' },
  drawerOverlay: { flex: 1, flexDirection: 'row-reverse', backgroundColor: 'rgba(0,0,0,0.42)' },
  drawer: { width: '78%', maxWidth: 330, backgroundColor: colors.white, paddingTop: 38 },
  drawerScrim: { flex: 1 },
  drawerTitleWrap: { backgroundColor: colors.primary, padding: 22, marginBottom: 10 },
  drawerTitle: { color: colors.white, fontFamily: font, fontSize: 17, fontWeight: '700', textAlign: 'right', writingDirection: 'rtl' },
  drawerSub: { color: '#e0f1f2', fontFamily: font, fontSize: 11, marginTop: 4, textAlign: 'right', writingDirection: 'rtl' },
  drawerItem: { minHeight: 48, justifyContent: 'center', paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#eef0f0' },
  drawerItemText: { color: colors.text, fontFamily: font, fontSize: 13, textAlign: 'right', writingDirection: 'rtl' },
  danger: { color: colors.danger },
});
