import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_MODE } from '../config';
import { requireAutomationEnabled } from './automationPolicy';
import { getFreshPosition, isBackgroundTracking, requestTripLocationAccess, startBackgroundTracking, stopBackgroundTracking } from '../services/locationService';
import { cancelScheduledTask, createScheduledTask, listScheduledTasks } from './scheduleStore';
import { finishTrip, getActiveTrip, getRoutePoints, getShipmentDetails, listShipments, startTrip } from '../api/tripService';
import { normalizeDocument, publicDocument } from '../api/documentMapper';

const AUDIT_KEY = 'automation.audit';

async function addAudit(action, documentId) {
  const entries = JSON.parse(await AsyncStorage.getItem(AUDIT_KEY) || '[]');
  entries.unshift({ action, documentId: String(documentId), at: new Date().toISOString() });
  await AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, 200)));
}

export const agentTools = [
  {
    name: 'get_local_time', access: 'read', authorization: 'none',
    description: 'Get the phone local date, time, and IANA time zone.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'list_shipments', access: 'read', authorization: 'globalAutomationPolicy',
    description: 'List currently carrying, issued, or all visible transport documents.',
    parameters: { type: 'OBJECT', properties: { status: { type: 'STRING', enum: ['issued', 'carrying', 'all'] } } },
  },
  {
    name: 'get_shipment_details', access: 'read', authorization: 'globalAutomationPolicy',
    description: 'Get the safe, user-visible details for a document by its ID.',
    parameters: { type: 'OBJECT', properties: { documentId: { type: 'STRING' } }, required: ['documentId'] },
  },
  {
    name: 'get_trip_status', access: 'read', authorization: 'globalAutomationPolicy',
    description: 'Get the active document, GPS tracking state, and number of saved route points without exposing coordinates.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'start_trip', access: 'write', authorization: 'globalAutomationPolicy',
    description: 'Register start of transport for an issued document, using the app API payload and phone GPS.',
    parameters: { type: 'OBJECT', properties: { documentId: { type: 'STRING' } }, required: ['documentId'] },
  },
  {
    name: 'finish_trip', access: 'write', authorization: 'globalAutomationPolicy',
    description: 'Register end of transport for a carrying document and submit the recorded GPS route.',
    parameters: { type: 'OBJECT', properties: { documentId: { type: 'STRING' } }, required: ['documentId'] },
  },
  {
    name: 'schedule_task', access: 'write', authorization: 'globalAutomationPolicy',
    description: 'Schedule a user-requested instruction using the phone local clock. Use YYYY-MM-DDTHH:mm and recurrence once, daily, or weekly.',
    parameters: {
      type: 'OBJECT',
      properties: {
        instruction: { type: 'STRING' },
        localDateTime: { type: 'STRING', description: 'Future local time, e.g. 2026-10-01T09:30.' },
        recurrence: { type: 'STRING', enum: ['once', 'daily', 'weekly'] },
      },
      required: ['instruction', 'localDateTime', 'recurrence'],
    },
  },
  {
    name: 'list_scheduled_tasks', access: 'read', authorization: 'globalAutomationPolicy',
    description: 'List this account device’s scheduled automation tasks.',
    parameters: { type: 'OBJECT', properties: {} },
  },
  {
    name: 'cancel_scheduled_task', access: 'write', authorization: 'globalAutomationPolicy',
    description: 'Cancel a scheduled task by its ID.',
    parameters: { type: 'OBJECT', properties: { taskId: { type: 'STRING' } }, required: ['taskId'] },
  },
  {
    name: 'open_app_section', access: 'navigation', authorization: 'globalAutomationPolicy',
    description: 'Open a section that exists in this app. Some listed sections are placeholders and do not perform service actions.',
    parameters: {
      type: 'OBJECT',
      properties: { section: { type: 'STRING', enum: ['dashboard', 'issued', 'carrying', 'automation', 'settings', 'newdoc', 'daily', 'wallet', 'fuel', 'inbox'] } },
      required: ['section'],
    },
  },
];

export const geminiFunctionDeclarations = agentTools.map(({ name, description, parameters }) => ({ name, description, parameters }));

function phoneTime() {
  const now = new Date();
  return { iso: now.toISOString(), local: now.toLocaleString(), timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'local' };
}

async function getStatusDocuments(status) {
  if (!['issued', 'carrying', 'all'].includes(status)) throw new Error('وضعیت سند پشتیبانی نمی‌شود.');
  if (status === 'all') {
    const [issued, carrying] = await Promise.all([getStatusDocuments('issued'), getStatusDocuments('carrying')]);
    return [...issued, ...carrying];
  }
  const rows = await listShipments(status);
  return rows.map((row, index) => publicDocument(normalizeDocument(row, index, status)));
}

async function findCurrentDocument(documentId, status) {
  if (!documentId) throw new Error('شناسه سند لازم است.');
  const rows = await listShipments(status);
  const document = rows.map((row, index) => normalizeDocument(row, index, status))
    .find(item => item.id === String(documentId));
  if (!document) throw new Error(status === 'issued' ? 'سند صادرشده با این شناسه پیدا نشد.' : 'سند در حال حمل با این شناسه پیدا نشد.');
  return document;
}

export async function executeAgentTool(name, args = {}, context = {}) {
  if (name === 'get_local_time') return phoneTime();
  await requireAutomationEnabled(name);

  if (name === 'list_shipments') return getStatusDocuments(args.status || 'carrying');
  if (name === 'get_shipment_details') {
    const id = String(args.documentId || '');
    if (!id) throw new Error('شناسه سند لازم است.');
    const detail = await getShipmentDetails(id);
    if (!detail) throw new Error('جزئیات سند پیدا نشد.');
    return publicDocument(normalizeDocument({ ...detail, id }, 0, 'unknown'));
  }
  if (name === 'get_trip_status') {
    const [activeTrip, routePoints, tracking] = await Promise.all([getActiveTrip(), getRoutePoints(), isBackgroundTracking()]);
    return {
      activeTrip: activeTrip ? publicDocument(normalizeDocument(activeTrip, 0, 'carrying')) : null,
      tracking,
      savedRoutePointCount: routePoints.length,
    };
  }
  if (name === 'start_trip' || name === 'finish_trip') {
    const documentId = String(args.document?.id || args.documentId || '');
    const status = name === 'start_trip' ? 'issued' : 'carrying';
    const document = await findCurrentDocument(documentId, status);
    let coords = { longitude: 0, latitude: 0, speed: 0, altitude: 0 };

    if (!DEMO_MODE) {
      await requestTripLocationAccess();
      coords = (await getFreshPosition()).coords;
    }

    if (name === 'start_trip') {
      await startTrip({ document: publicDocument(document), coords, havePermission: true });
      if (!DEMO_MODE) await startBackgroundTracking();
    } else {
      await finishTrip({ docId: documentId, coords });
      if (!DEMO_MODE) await stopBackgroundTracking();
    }
    await addAudit(name, documentId);
    return { success: true, documentId, status: name === 'start_trip' ? 'carrying' : 'issued', demoMode: DEMO_MODE };
  }
  if (name === 'schedule_task') return createScheduledTask(args);
  if (name === 'list_scheduled_tasks') return listScheduledTasks();
  if (name === 'cancel_scheduled_task') return cancelScheduledTask(args.taskId);
  if (name === 'open_app_section') {
    if (!['dashboard', 'issued', 'carrying', 'automation', 'settings', 'newdoc', 'daily', 'wallet', 'fuel', 'inbox'].includes(args.section)) {
      throw new Error('بخش درخواستی در برنامه شناخته‌شده نیست.');
    }
    if (typeof context.onNavigate !== 'function') throw new Error('ناوبری برنامه در دسترس نیست.');
    context.onNavigate(args.section);
    return { opened: args.section };
  }

  throw new Error('ابزار درخواستی در فهرست مجاز نیست.');
}

export async function readAutomationAudit() {
  return JSON.parse(await AsyncStorage.getItem(AUDIT_KEY) || '[]');
}
