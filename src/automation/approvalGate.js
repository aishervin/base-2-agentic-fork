const approvals = new Map();

function makeNonce() {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

export function grantUserApproval(action, documentId) {
  const nonce = makeNonce();
  approvals.set(nonce, { action, documentId: String(documentId), expiresAt: Date.now() + 90000 });
  return nonce;
}

export function consumeUserApproval(action, documentId, nonce) {
  const approval = approvals.get(nonce);
  approvals.delete(nonce);
  if (!approval || approval.expiresAt < Date.now() || approval.action !== action || approval.documentId !== String(documentId)) {
    throw new Error('تأیید کاربر معتبر نیست یا زمان آن گذشته است.');
  }
}
