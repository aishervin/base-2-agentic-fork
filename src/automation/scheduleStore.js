import AsyncStorage from '@react-native-async-storage/async-storage';
import { finishScheduledOccurrence, parseLocalDateTime, recurrenceValues } from './scheduleContract';

const STORAGE_KEY = 'automation.scheduledTasks';

async function readTasks() {
  return JSON.parse(await AsyncStorage.getItem(STORAGE_KEY) || '[]');
}

async function writeTasks(tasks) {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function makeId() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function createScheduledTask({ instruction, localDateTime, recurrence = 'once' }) {
  const text = String(instruction || '').trim();
  if (text.length < 2 || text.length > 1000) throw new Error('شرح کار زمان‌بندی‌شده باید بین ۲ تا ۱۰۰۰ نویسه باشد.');
  if (!recurrenceValues.has(recurrence)) throw new Error('الگوی تکرار پشتیبانی نمی‌شود.');

  const scheduled = parseLocalDateTime(localDateTime);
  const task = {
    id: makeId(),
    instruction: text,
    ...scheduled,
    recurrence,
    status: 'scheduled',
    createdAt: new Date().toISOString(),
  };
  const tasks = await readTasks();
  tasks.unshift(task);
  await writeTasks(tasks.slice(0, 100));
  return task;
}

export async function listScheduledTasks() {
  return readTasks();
}

export async function claimDueScheduledTasks(now = new Date()) {
  const tasks = await readTasks();
  const due = [];
  for (const task of tasks) {
    if (task.status === 'scheduled' && Date.parse(task.runAt) <= now.getTime()) {
      task.status = 'running';
      task.startedAt = now.toISOString();
      due.push(task);
    }
  }
  if (due.length) await writeTasks(tasks);
  return due;
}

export async function recoverInterruptedScheduledTasks(now = new Date()) {
  const tasks = await readTasks();
  let changed = false;
  for (const task of tasks) {
    if (task.status === 'running' && now.getTime() - Date.parse(task.startedAt) > 3 * 60 * 1000) {
      task.status = 'failed';
      task.lastError = 'اجرای قبلی قطع شد و نتیجه آن نامشخص است؛ برای جلوگیری از ثبت تکراری دوباره اجرا نشد.';
      changed = true;
    }
  }
  if (changed) await writeTasks(tasks);
}

export async function finishScheduledTask(id, { success, error, result } = {}) {
  const tasks = await readTasks();
  const task = tasks.find(item => item.id === id);
  if (!task || task.status !== 'running') return;
  Object.assign(task, finishScheduledOccurrence(task, { success, error, result }));
  await writeTasks(tasks);
}

export async function cancelScheduledTask(id) {
  const tasks = await readTasks();
  const task = tasks.find(item => item.id === id);
  if (!task) throw new Error('زمان‌بندی پیدا نشد.');
  if (task.status === 'running') throw new Error('این کار در حال اجراست و اکنون قابل لغو نیست.');
  await writeTasks(tasks.filter(item => item.id !== id));
  return { cancelled: true, id };
}

export async function clearScheduledTasks() {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
