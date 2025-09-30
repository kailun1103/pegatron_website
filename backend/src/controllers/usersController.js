// src/controllers/usersController.js
const pool = require('../config/database');
const { isValidDateStr, notFutureDate, trimOrNull } = require('../utils/validators');
const { badRequest } = require('../utils/responses');

const getUsers = async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '6', 10), 1);
    const q     = (req.query.q || '').trim();
    const job   = (req.query.job || '').trim();

    const where = [];
    const params = [];

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where.push(`(LOWER(name) LIKE $${params.length} OR phone LIKE $${params.length})`);
    }
    if (job) {
      params.push(job);
      where.push(`job = $${params.length}`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    const totalSql = `SELECT COUNT(*)::int AS count FROM users ${whereSql}`;
    const total = (await pool.query(totalSql, params)).rows[0].count;

    const offset = (page - 1) * limit;
    const itemsSql = `
      SELECT id,name,gender,birthday,job,phone,avatar_url,created_at,updated_at
      FROM users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const items = (await pool.query(itemsSql, [...params, limit, offset])).rows;

    res.json({ items, page, limit, total, totalPages: Math.ceil(total / limit) });
  } catch (e) {
    console.error('[GET /api/users] error:', e);
    res.status(500).json({ error: { code: 'INTERNAL', message: e.message } });
  }
};

const getUserById = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10); // 若是 UUID，改成直接使用字串
    if (isNaN(id)) return badRequest(res, 'id 必須為數字');
    const sql = `
      SELECT id,name,gender,birthday,job,phone,avatar_url,created_at,updated_at
      FROM users WHERE id = $1
    `;
    const { rows } = await pool.query(sql, [id]);
    if (!rows.length) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '使用者不存在' } });
    res.json(rows[0]);
  } catch (e) {
    console.error('[GET /api/users/:id] error:', e);
    res.status(500).json({ error: { code: 'INTERNAL', message: e.message } });
  }
};

const createUser = async (req, res) => {
  try {
    const name       = trimOrNull(req.body.name);
    const gender     = trimOrNull(req.body.gender);   // male | female | other | null
    const birthday   = trimOrNull(req.body.birthday); // YYYY-MM-DD | null
    const job        = trimOrNull(req.body.job);      // student | engineer | teacher | unemployed
    const phone      = trimOrNull(req.body.phone);
    const avatar_url = trimOrNull(req.body.avatar_url);

    // 基本驗證
    if (!name || !job) {
      return badRequest(res, 'name, job 為必填', { name: !name && 'required', job: !job && 'required' });
    }
    if (name && name.length > 50) {
      return badRequest(res, 'name 最多 50 字', { name: 'max 50' });
    }
    if (birthday && (!isValidDateStr(birthday) || !notFutureDate(birthday))) {
      return badRequest(res, 'birthday 格式錯誤或不能晚於今天', { birthday: 'invalid or future' });
    }

    const sql = `
      INSERT INTO users (name, gender, birthday, job, phone, avatar_url)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id,name,gender,birthday,job,phone,avatar_url,created_at,updated_at
    `;
    const { rows } = await pool.query(sql, [name, gender, birthday, job, phone, avatar_url]);
    res.status(201).json(rows[0]);
  } catch (e) {
    // 先把 PG 錯誤細節印出來，快速定位是哪個唯一鍵/欄位
    console.error('[POST /api/users] pg-error:', {
      code: e.code,               // 例如 23505 (unique_violation)
      constraint: e.constraint,   // 例如 users_phone_key
      detail: e.detail,           // 例如 Key (phone)=(0912345678) already exists.
      table: e.table,
      schema: e.schema,
    });

    // 23505 = unique_violation（例如 phone 唯一）
    if (e.code === '23505') {
      let field = 'unknown';
      if (e.constraint?.includes('phone') || /Key\s+\(phone\)/i.test(e.detail || '')) field = 'phone';
      return res.status(409).json({ error: { code: 'CONFLICT', message: `${field} already exists`, field } });
    }
    // 22P02 = invalid_text_representation（型別不符）
    if (e.code === '22P02') {
      return badRequest(res, '欄位格式不正確');
    }
    console.error('[POST /api/users] error:', e);
    res.status(500).json({ error: { code: 'INTERNAL', message: e.message } });
  }
};

const updateUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return badRequest(res, 'id 必須為數字');

    const name       = trimOrNull(req.body.name);
    const gender     = trimOrNull(req.body.gender);
    const birthday   = trimOrNull(req.body.birthday);
    const job        = trimOrNull(req.body.job);
    const phone      = trimOrNull(req.body.phone);
    const avatar_url = trimOrNull(req.body.avatar_url);

    const fields = { name, gender, birthday, job, phone, avatar_url };
    const setParts = [];
    const params = [];
    Object.entries(fields).forEach(([k, v]) => {
      // 允許把欄位清空：前端傳空字串時會被轉為 null（上面 trimOrNull）
      if (v !== null) {
        params.push(v);
        setParts.push(`${k} = $${params.length}`);
      }
    });

    if (birthday && (!isValidDateStr(birthday) || !notFutureDate(birthday))) {
      return badRequest(res, 'birthday 格式錯誤或不能晚於今天', { birthday: 'invalid or future' });
    }
    if (name && name.length > 50) {
      return badRequest(res, 'name 最多 50 字', { name: 'max 50' });
    }
    if (!setParts.length) {
      return badRequest(res, '至少提供一個可更新欄位');
    }

    // 追加更新時間
    setParts.push(`updated_at = NOW()`);

    const sql = `
      UPDATE users SET ${setParts.join(', ')}
      WHERE id = $${params.length + 1}
      RETURNING id,name,gender,birthday,job,phone,avatar_url,created_at,updated_at
    `;
    params.push(id);

    const { rows } = await pool.query(sql, params);
    if (!rows.length) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '使用者不存在' } });
    res.json(rows[0]);
  } catch (e) {
    console.error('[PUT /api/users/:id] pg-error:', {
      code: e.code,
      constraint: e.constraint,
      detail: e.detail,
      table: e.table,
      schema: e.schema,
    });

    if (e.code === '23505') {
      let field = 'unknown';
      if (e.constraint?.includes('phone') || /Key\s+\(phone\)/i.test(e.detail || '')) field = 'phone';
      return res.status(409).json({ error: { code: 'CONFLICT', message: `${field} already exists`, field } });
    }
    if (e.code === '22P02') {
      return badRequest(res, '欄位格式不正確');
    }
    console.error('[PUT /api/users/:id] error:', e);
    res.status(500).json({ error: { code: 'INTERNAL', message: e.message } });
  }
};

const deleteUser = async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return badRequest(res, 'id 必須為數字');
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (!rowCount) return res.status(404).json({ error: { code: 'USER_NOT_FOUND', message: '使用者不存在' } });
    res.status(204).send();
  } catch (e) {
    console.error('[DELETE /api/users/:id] error:', e);
    res.status(500).json({ error: { code: 'INTERNAL', message: e.message } });
  }
};

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
};
