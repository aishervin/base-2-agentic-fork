const test = require('node:test');
const assert = require('node:assert/strict');
const { finishScheduledOccurrence, nextLocalDateTime, parseLocalDateTime } = require('../src/automation/scheduleContract');

test('local schedule time resolves using the device time zone', () => {
  const value = new Date(2030, 0, 2, 3, 4, 0, 0);
  const local = `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}T03:04`;
  const result = parseLocalDateTime(local, new Date(2029, 0, 1));
  assert.equal(result.runAt, value.toISOString());
  assert.equal(result.timeZone, Intl.DateTimeFormat().resolvedOptions().timeZone || 'local');
});

test('schedule rejects malformed, nonexistent, and past local times', () => {
  assert.throws(() => parseLocalDateTime('2030-15-42T28:75'), /معتبر/);
  assert.throws(() => parseLocalDateTime('2030-01-02 03:04'), /شکل/);
  assert.throws(() => parseLocalDateTime('2020-01-02T03:04'), /آینده/);
});

test('recurrence advances in local calendar time and one-time tasks do not repeat', () => {
  assert.equal(nextLocalDateTime('2030-01-02T09:30', 'once'), null);
  const now = new Date(2030, 0, 2, 10, 0);
  const daily = nextLocalDateTime('2030-01-02T09:30', 'daily', now);
  assert.equal(daily.localDateTime, '2030-01-03T09:30');
  const weekly = nextLocalDateTime('2030-01-02T09:30', 'weekly', now);
  assert.equal(weekly.localDateTime, '2030-01-09T09:30');
});

test('a failed recurring occurrence is recorded and remains scheduled for its next local time', () => {
  const now = new Date(2030, 0, 2, 10, 0);
  const task = { recurrence: 'daily', localDateTime: '2030-01-02T09:30', status: 'running' };
  const next = finishScheduledOccurrence(task, { success: false, error: 'temporary network issue' }, now);
  assert.equal(next.status, 'scheduled');
  assert.equal(next.localDateTime, '2030-01-03T09:30');
  assert.equal(next.lastError, 'temporary network issue');
  assert.equal(next.lastRunAt, now.toISOString());

  const once = finishScheduledOccurrence({ ...task, recurrence: 'once' }, { success: false, error: 'failed' }, now);
  assert.equal(once.status, 'failed');
});
