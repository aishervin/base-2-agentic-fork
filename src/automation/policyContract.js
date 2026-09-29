const mutationActions = new Set(['startTrip', 'finishTrip']);

function assertAutomationEnabled(enabled, action) {
  if (!mutationActions.has(action)) {
    throw new Error('عملیات تغییردهنده در فهرست مجاز نیست.');
  }
  if (enabled !== true) {
    throw new Error('برای اجرای عملیات، اجازه کلی اتوماسیون را در تنظیمات فعال کنید.');
  }
}

module.exports = { assertAutomationEnabled };
