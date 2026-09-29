export function normalizeDocument(row, index = 0, status = 'unknown') {
  return {
    id: String(row?.id ?? row?.docId ?? row?.DocId ?? row?.documentId ?? row?.ID ?? index),
    docNo: String(row?.docNo ?? row?.DocNo ?? row?.documentNo ?? row?.trackingCode ?? '—'),
    driver: row?.driverName ?? row?.DriverName ?? row?.driver ?? '—',
    plate: row?.carTag ?? row?.CarTag ?? row?.plate ?? row?.nCarTag ?? '—',
    origin: row?.origin ?? row?.Origin ?? row?.senderCity ?? '—',
    destination: row?.destination ?? row?.Destination ?? row?.receiverCity ?? '—',
    cargo: row?.cargoName ?? row?.CargoName ?? row?.goodsName ?? '—',
    status,
    raw: row,
  };
}

export function publicDocument(document) {
  return {
    id: document.id,
    docNo: document.docNo,
    driver: document.driver,
    plate: document.plate,
    origin: document.origin,
    destination: document.destination,
    cargo: document.cargo,
    status: document.status,
  };
}
