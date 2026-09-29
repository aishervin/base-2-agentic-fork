import AsyncStorage from '@react-native-async-storage/async-storage';
import { DEMO_MODE } from '../config';
import { consumeUserApproval } from './approvalGate';
import { getFreshPosition, requestTripLocationAccess, startBackgroundTracking, stopBackgroundTracking } from '../services/locationService';
import { finishTrip, listShipments, startTrip } from '../api/tripService';

const AUDIT_KEY = 'automation.audit';

async function addAudit(action, documentId) {
  const entries = JSON.parse(await AsyncStorage.getItem(AUDIT_KEY) || '[]');
  entries.unshift({ action, documentId: String(documentId), at: new Date().toISOString() });
  await AsyncStorage.setItem(AUDIT_KEY, JSON.stringify(entries.slice(0, 200)));
}

export const agentTools = [
  { name: 'listShipments', access: 'read' },
  { name: 'prepareTripStart', access: 'prepare' },
  { name: 'startTrip', access: 'write', requiresUserApproval: true },
  { name: 'prepareTripEnd', access: 'prepare' },
  { name: 'finishTrip', access: 'write', requiresUserApproval: true },
];

export async function executeAgentTool(name, args = {}, approvalNonce) {
  if (name === 'listShipments') return listShipments(args.status || 'carrying');
  if (name === 'prepareTripStart' || name === 'prepareTripEnd') {
    if (!DEMO_MODE) {
      await requestTripLocationAccess();
      await getFreshPosition();
    }
    return { ready: true, documentId: args.document?.id || args.documentId, demoMode: DEMO_MODE };
  }

  if (name === 'startTrip') {
    const documentId = args.document?.id;
    consumeUserApproval('startTrip', documentId, approvalNonce);
    let coords = { longitude: 0, latitude: 0, speed: 0, altitude: 0 };
    if (!DEMO_MODE) {
      await requestTripLocationAccess();
      coords = (await getFreshPosition()).coords;
    }
    const result = await startTrip({
      document: args.document,
      coords,
      havePermission: true,
      approval: { action: 'startTrip', approved: true, byUser: true },
    });
    if (!DEMO_MODE) await startBackgroundTracking();
    await addAudit('startTrip', documentId);
    return result;
  }

  if (name === 'finishTrip') {
    const documentId = args.documentId;
    consumeUserApproval('finishTrip', documentId, approvalNonce);
    let coords = { longitude: 0, latitude: 0, speed: 0, altitude: 0 };
    if (!DEMO_MODE) coords = (await getFreshPosition()).coords;
    const result = await finishTrip({
      docId: documentId,
      coords,
      approval: { action: 'finishTrip', approved: true, byUser: true },
    });
    if (!DEMO_MODE) await stopBackgroundTracking();
    await addAudit('finishTrip', documentId);
    return result;
  }

  throw new Error('ابزار درخواستی در فهرست مجاز نیست.');
}

export async function readAutomationAudit() {
  return JSON.parse(await AsyncStorage.getItem(AUDIT_KEY) || '[]');
}
