function pad(value) {
  return String(value).padStart(2, '0');
}

function formatOriginalApiTime(date = new Date()) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}.000Z`;
}

function finiteOrZero(value) {
  return Number.isFinite(value) ? value : 0;
}

function buildStartPayload(docId, coords, havePermission, date = new Date()) {
  if (docId === undefined || docId === null || docId === '') {
    throw new Error('شناسه سند برای شروع حمل لازم است.');
  }
  if (!coords || !Number.isFinite(coords.longitude) || !Number.isFinite(coords.latitude)) {
    throw new Error('موقعیت GPS معتبر دریافت نشد.');
  }
  if (havePermission !== true) {
    throw new Error('برای شروع حمل، مجوز موقعیت مکانی لازم است.');
  }

  return {
    DocId: docId,
    Speed: finiteOrZero(coords.speed),
    Altitude: finiteOrZero(coords.altitude),
    Longitude: coords.longitude,
    Latitude: coords.latitude,
    StartDate: formatOriginalApiTime(date),
    havePermission: true,
  };
}

function buildGpsPoint(coords, date = new Date()) {
  if (!coords || !Number.isFinite(coords.longitude) || !Number.isFinite(coords.latitude)) {
    throw new Error('نقطه GPS نامعتبر است.');
  }
  return {
    type: 3,
    longitude: coords.longitude,
    latitude: coords.latitude,
    speed: finiteOrZero(coords.speed),
    date: formatOriginalApiTime(date),
  };
}

function buildEndPayload(docId, gpsList) {
  if (docId === undefined || docId === null || docId === '') {
    throw new Error('شناسه سند برای پایان حمل لازم است.');
  }
  if (!Array.isArray(gpsList) || gpsList.length === 0) {
    throw new Error('برای پایان حمل، مسیر GPS خالی است.');
  }
  return { docId, gpsList };
}

module.exports = {
  buildEndPayload,
  buildGpsPoint,
  buildStartPayload,
  formatOriginalApiTime,
};
