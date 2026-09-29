import * as BackgroundTask from 'expo-background-task';
import * as TaskManager from 'expo-task-manager';
import { hasGeminiApiKey } from '../api/geminiKeyStore';
import { isAutomationEnabled } from './automationPolicy';
import { runScheduledInstruction } from './geminiService';
import { claimDueScheduledTasks, finishScheduledTask, listScheduledTasks } from './scheduleStore';

const TASK_NAME = 'barnameh-gemini-schedule-runner';
let running = false;

TaskManager.defineTask(TASK_NAME, async ({ error }) => {
  if (error) return BackgroundTask.BackgroundTaskResult.Failed;
  try {
    await runDueScheduledTasks();
    return BackgroundTask.BackgroundTaskResult.Success;
  } catch {
    return BackgroundTask.BackgroundTaskResult.Failed;
  }
});

export async function ensureScheduledTaskRunner() {
  const tasks = await listScheduledTasks();
  const registered = await TaskManager.isTaskRegisteredAsync(TASK_NAME);
  if (!tasks.some(task => task.status === 'scheduled')) {
    if (registered) await BackgroundTask.unregisterTaskAsync(TASK_NAME);
    return false;
  }
  if ((await BackgroundTask.getStatusAsync()) !== BackgroundTask.BackgroundTaskStatus.Available) return false;
  if (!registered) {
    await BackgroundTask.registerTaskAsync(TASK_NAME, { minimumInterval: 15 });
  }
  return true;
}

export async function runDueScheduledTasks() {
  if (running || !(await isAutomationEnabled()) || !(await hasGeminiApiKey())) return;
  running = true;
  try {
    const dueTasks = await claimDueScheduledTasks();
    for (const task of dueTasks) {
      try {
        const result = await runScheduledInstruction(task.instruction);
        await finishScheduledTask(task.id, { success: true, result });
      } catch (error) {
        await finishScheduledTask(task.id, { success: false, error: error.message });
      }
    }
  } finally {
    running = false;
  }
}

export { TASK_NAME as SCHEDULE_RUNNER_TASK_NAME };
