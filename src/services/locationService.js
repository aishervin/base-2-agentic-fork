import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { GPS_FIX_TIMEOUT_MS, GPS_INTERVAL_MS } from '../config';
import { buildGpsPoint } from '../api/tripContract';
import { appendRoutePoints } from '../api/tripService';

const TASK_NAME = 'barnameh-trip-location';
const TASK_RUNNING_KEY = 'trip.tracking';

function toCoordinates(location) {
  return {
    longitude: location.coords.longitude,
    latitude: location.coords.latitude,
    speed: location.coords.speed,
    altitude: location.coords.altitude,
  };
}

TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error || !data?.locations?.length) return;
  const points = data.locations.map(location =>
    buildGpsPoint(toCoordinates(location), new Date(location.timestamp)),
  );
  await appendRoutePoints(points);
});

export async function requestTripLocationAccess() {
  const foreground = await Location.requestForegroundPermissionsAsync();
  if (foreground.status !== 'granted') {
    throw new Error('برای شروع حمل، مجوز موقعیت مکانی لازم است.');
  }
  const background = await Location.requestBackgroundPermissionsAsync();
  if (background.status !== 'granted') {
    throw new Error('برای ثبت مسیر در زمان قفل بودن صفحه، مجوز موقعیت پس‌زمینه را فعال کنید.');
  }
}

export async function getFreshPosition() {
  const permission = await Location.getForegroundPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('مجوز موقعیت مکانی فعال نیست.');
  let timeoutId;
  try {
    const location = await Promise.race([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
      new Promise((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('دریافت GPS در ۱۸ ثانیه انجام نشد.')), GPS_FIX_TIMEOUT_MS);
      }),
    ]);
    return { coords: toCoordinates(location), timestamp: location.timestamp };
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function startBackgroundTracking() {
  const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (running) await Location.stopLocationUpdatesAsync(TASK_NAME);
  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: GPS_INTERVAL_MS,
    distanceInterval: 0,
    pausesUpdatesAutomatically: false,
    foregroundService: {
      notificationTitle: 'ثبت مسیر بارنامه شهری',
      notificationBody: 'موقعیت مسیر حمل در حال ثبت است.',
      notificationColor: '#128591',
    },
  });
  await AsyncStorage.setItem(TASK_RUNNING_KEY, 'true');
}

export async function stopBackgroundTracking() {
  const running = await Location.hasStartedLocationUpdatesAsync(TASK_NAME);
  if (running) await Location.stopLocationUpdatesAsync(TASK_NAME);
  await AsyncStorage.removeItem(TASK_RUNNING_KEY);
}

export async function isBackgroundTracking() {
  return Location.hasStartedLocationUpdatesAsync(TASK_NAME);
}
