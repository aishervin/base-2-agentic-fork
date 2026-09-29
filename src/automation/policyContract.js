const authorizedActions = new Set([
  'list_shipments',
  'get_shipment_details',
  'get_trip_status',
  'start_trip',
  'finish_trip',
  'schedule_task',
  'list_scheduled_tasks',
  'cancel_scheduled_task',
  'open_app_section',
]);

function assertAutomationEnabled(enabled, action) {
  if (!authorizedActions.has(action)) {
    throw new Error('ابزار درخواستی در فهرست مجاز نیست.');
  }
  if (enabled !== true) {
    throw new Error('برای دسترسی Gemini به ابزارهای برنامه، اجازه کلی اتوماسیون را در تنظیمات فعال کنید.');
  }
}

module.exports = { assertAutomationEnabled };
