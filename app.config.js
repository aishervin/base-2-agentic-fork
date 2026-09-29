const demoMode = process.env.EXPO_PUBLIC_DEMO_MODE !== 'false';

module.exports = {
  expo: {
    name: 'صدور بارنامه شهری',
    slug: 'base-2-agentic-fork',
    version: '0.1.0',
    orientation: 'portrait',
    userInterfaceStyle: 'light',
    newArchEnabled: true,
    icon: './assets/images/logo_app.png',
    assetBundlePatterns: ['assets/**/*'],
    plugins: [
      [
        'expo-location',
        {
          locationWhenInUsePermission: 'برای ثبت و نمایش مسیر حمل به موقعیت شما نیاز داریم.',
          locationAlwaysAndWhenInUsePermission: 'برای ثبت مسیر حمل هنگام قفل بودن صفحه به موقعیت پس‌زمینه نیاز داریم.',
          locationAlwaysPermission: 'برای ثبت مسیر حمل هنگام قفل بودن صفحه به موقعیت پس‌زمینه نیاز داریم.',
          isAndroidBackgroundLocationEnabled: true,
          isAndroidForegroundServiceEnabled: true
        }
      ],
      'expo-secure-store'
    ],
    android: {
      package: 'com.base2.agenticfork',
      versionCode: 1,
      supportsRTL: true,
      permissions: [
        'ACCESS_COARSE_LOCATION',
        'ACCESS_FINE_LOCATION',
        'ACCESS_BACKGROUND_LOCATION',
        'FOREGROUND_SERVICE',
        'FOREGROUND_SERVICE_LOCATION'
      ]
    },
    extra: { demoMode }
  }
};
