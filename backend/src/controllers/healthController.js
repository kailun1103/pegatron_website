// src/controllers/healthController.js
const pool = require('../config/database');

const checkHealth = async (req, res) => {
  try {
    const r = await pool.query('SELECT 1 as ok');
    res.json({ ok: true, db: r.rows[0]?.ok === 1 ? 'up' : 'unknown' });
  } catch (e) {
    // 印出更完整的 PG 錯誤，方便判斷是 SSL/認證/host 等問題
    console.error('[GET /health] DB error:', {
      code: e.code,
      message: e.message,
      detail: e.detail,
      where: e.where,
      schema: e.schema,
      table: e.table,
      hint: e.hint,
    });
    res.status(500).json({ ok: false, error: e.message });
  }
};

module.exports = {
  checkHealth,
};
