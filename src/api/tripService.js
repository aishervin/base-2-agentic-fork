import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_MODE } from '../config';
import { requireAutomationEnabled } from '../automation/automationPolicy';
import { apiRequest } from './client';
import {
  buildEndPayload,
  buildGpsPoint,
  buildStartPayload,
} from './tripContract';

const ACTIVE_TRIP_KEY = 'trip.active';
const ROUTE_POINTS_KEY = 'trip.routePoints';

export const demoShipments = [
  { id: 'D-24051', docNo: '۱۴۰۴۰۱۲۴۰۵۱', driver: 'راننده نمونه', plate: '۱۲ الف ۳۴۵ ایران ۶۶', origin: 'تهران', destination: 'کرج', status: 'issued', cargo: 'کالای نمونه' },
  { id: 'D-24052', docNo: '۱۴۰۴۰۱۲۴۰۵۲', driver: 'راننده نمونه', plate: '۴۵ ب ۷۸۹ ایران ۲۲', origin: 'تهران', destination: 'قم', status: 'carrying', cargo: 'بار شهری' },
];

export async function listShipments(status = 'carrying', pageNumber = 1) {
  if (DEMO_MODE) return demoShipments.filter(item => status === 'all' || item.status === status);
  const endpoint = status === 'issued' ? '/Document/GetIssuedDocuments' : '/Document/GetShippingDocuments';
  const response = await apiRequest(endpoint, {
    body: { nCarTag: null, driverNationalCode: null, docNo: null, pageNumber, pageSize: 10 },
  });
  return Array.isArray(response?.obj) ? response.obj : [];
}

export async function getShipmentDetails(docId) {
  if (DEMO_MODE) return demoShipments.find(item => item.id === docId) || demoShipments[0];
  const response = await apiRequest('/Document/GetShippingDocumentByID', { body: { data: docId } });
  return response?.obj;
}

export async function startTrip({ document, coords, havePermission }) {
  await requireAutomationEnabled('startTrip');
  const payload = buildStartPayload(document.id, coords, havePermission);
  if (DEMO_MODE) {
    await AsyncStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify({ ...document, startedAt: payload.StartDate }));
    await AsyncStorage.setItem(ROUTE_POINTS_KEY, JSON.stringify([buildGpsPoint(coords)]));
    return { demo: true, obj: { resultCode: 200 } };
  }
  const response = await apiRequest('/Document/RegisterStartOfShipping', { body: payload });
  await AsyncStorage.setItem(ACTIVE_TRIP_KEY, JSON.stringify({ ...document, startedAt: payload.StartDate }));
  await AsyncStorage.setItem(ROUTE_POINTS_KEY, JSON.stringify([buildGpsPoint(coords)]));
  return response;
}

export async function finishTrip({ docId, coords }) {
  await requireAutomationEnabled('finishTrip');
  const points = JSON.parse(await AsyncStorage.getItem(ROUTE_POINTS_KEY) || '[]');
  if (DEMO_MODE && points.length === 0) points.push(buildGpsPoint(coords));
  points.unshift(buildGpsPoint(coords));
  const payload = buildEndPayload(docId, points);
  if (DEMO_MODE) {
    await Promise.all([AsyncStorage.removeItem(ACTIVE_TRIP_KEY), AsyncStorage.removeItem(ROUTE_POINTS_KEY)]);
    return { demo: true, obj: { resultCode: 200 } };
  }
  const detail = await getShipmentDetails(docId);
  if (detail?.serverDateTime) payload.gpsList[0].date = `${detail.serverDateTime}Z`;
  const response = await apiRequest('/Document/RegisterEndOfShipping', { body: payload });
  await Promise.all([AsyncStorage.removeItem(ACTIVE_TRIP_KEY), AsyncStorage.removeItem(ROUTE_POINTS_KEY)]);
  return response;
}

export async function getActiveTrip() {
  const raw = await AsyncStorage.getItem(ACTIVE_TRIP_KEY);
  return raw ? JSON.parse(raw) : null;
}

export async function appendRoutePoints(points) {
  const current = JSON.parse(await AsyncStorage.getItem(ROUTE_POINTS_KEY) || '[]');
  await AsyncStorage.setItem(ROUTE_POINTS_KEY, JSON.stringify(current.concat(points)));
}

export async function getRoutePoints() {
  return JSON.parse(await AsyncStorage.getItem(ROUTE_POINTS_KEY) || '[]');
}
