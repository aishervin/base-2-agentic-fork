const test = require('node:test');
const assert = require('node:assert/strict');
const { assertAutomationEnabled } = require('../src/automation/policyContract');
const {
  buildEndPayload,
  buildGpsPoint,
  buildStartPayload,
  formatOriginalApiTime,
} = require('../src/api/tripContract');

test('start payload matches original field names and API time format', () => {
  const payload = buildStartPayload('doc-1', { longitude: 51.4, latitude: 35.7, speed: null, altitude: null }, true, new Date(2025, 0, 2, 3, 4, 5));
  assert.deepEqual(payload, {
    DocId: 'doc-1', Speed: 0, Altitude: 0, Longitude: 51.4, Latitude: 35.7,
    StartDate: '2025-01-02T03:04:05.000Z', havePermission: true,
  });
});

test('end payload refuses an empty route', () => {
  assert.throws(() => buildEndPayload('doc-1', []), /GPS/);
  assert.equal(buildEndPayload('doc-1', [{ type: 3 }]).docId, 'doc-1');
});

test('GPS point uses original API shape', () => {
  assert.deepEqual(buildGpsPoint({ longitude: 1, latitude: 2, speed: 3, altitude: 4 }, new Date(2025, 0, 2, 3, 4, 5)), {
    type: 3, longitude: 1, latitude: 2, speed: 3, date: '2025-01-02T03:04:05.000Z',
  });
});

test('trip mutations require the global automation policy, not per-action approval', () => {
  assert.throws(() => assertAutomationEnabled(false, 'startTrip'), /اجازه کلی اتوماسیون/);
  assert.throws(() => assertAutomationEnabled(true, 'deleteAccount'), /فهرست مجاز/);
  assert.doesNotThrow(() => assertAutomationEnabled(true, 'startTrip'));
  assert.doesNotThrow(() => assertAutomationEnabled(true, 'finishTrip'));
});

test('original API timestamp helper pads date components', () => {
  assert.equal(formatOriginalApiTime(new Date(2025, 0, 2, 3, 4, 5)), '2025-01-02T03:04:05.000Z');
});
