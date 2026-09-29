const recurrenceValues = new Set(['once', 'daily', 'weekly']);

function parseLocalDateTime(value, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(String(value || ''));
  if (!match) throw new Error('زمان باید به شکل YYYY-MM-DDTHH:mm و بر اساس ساعت گوشی باشد.');

  const [, year, month, day, hour, minute] = match.map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  if (
    date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day ||
    date.getHours() !== hour || date.getMinutes() !== minute
  ) {
    throw new Error('زمان محلی انتخاب‌شده معتبر نیست.');
  }
  if (date.getTime() <= now.getTime()) throw new Error('زمان‌بندی باید در آینده باشد.');
  return {
    localDateTime: `${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}`,
    runAt: date.toISOString(),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'local',
  };
}

function nextLocalDateTime(localDateTime, recurrence, now = new Date()) {
  if (!recurrenceValues.has(recurrence)) throw new Error('الگوی تکرار پشتیبانی نمی‌شود.');
  if (recurrence === 'once') return null;

  const [datePart, timePart] = localDateTime.split('T');
  const [year, month, day] = datePart.split('-').map(Number);
  const [hour, minute] = timePart.split(':').map(Number);
  const date = new Date(year, month - 1, day, hour, minute, 0, 0);
  const increment = recurrence === 'daily' ? 1 : 7;
  do {
    date.setDate(date.getDate() + increment);
  } while (date.getTime() <= now.getTime());

  const pad = value => String(value).padStart(2, '0');
  const local = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  return { localDateTime: local, runAt: date.toISOString() };
}

function finishScheduledOccurrence(task, { success, error, result } = {}, now = new Date()) {
  if (task.recurrence === 'once') {
    return {
      ...task,
      status: success ? 'completed' : 'failed',
      lastResult: success ? String(result || '').slice(0, 240) : undefined,
      lastError: success ? undefined : String(error || 'اجرای کار ناموفق بود.').slice(0, 240),
    };
  }

  return {
    ...task,
    ...nextLocalDateTime(task.localDateTime, task.recurrence, now),
    timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'local',
    status: 'scheduled',
    lastRunAt: now.toISOString(),
    lastResult: success ? String(result || '').slice(0, 240) : undefined,
    lastError: success ? undefined : String(error || 'اجرای کار ناموفق بود.').slice(0, 240),
  };
}

module.exports = { finishScheduledOccurrence, nextLocalDateTime, parseLocalDateTime, recurrenceValues };
