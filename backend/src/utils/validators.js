// src/utils/validators.js
function isValidDateStr(s) {
  // 允許空，或 YYYY-MM-DD
  if (!s) return true;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) return false;
  const d = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
  return !isNaN(d.getTime());
}

function notFutureDate(s) {
  if (!s) return true;
  const today = new Date();
  const d = new Date(`${s}T00:00:00Z`);
  return d.getTime() <= new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate())
  ).getTime();
}

function trimOrNull(v) {
  if (v === undefined || v === null) return null;
  const t = String(v).trim();
  return t === '' ? null : t;
}

module.exports = {
  isValidDateStr,
  notFutureDate,
  trimOrNull,
};
