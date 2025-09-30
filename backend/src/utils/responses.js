// src/utils/responses.js
function badRequest(res, msg, fields) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: msg, fields: fields || {} } });
}

module.exports = {
  badRequest,
};
