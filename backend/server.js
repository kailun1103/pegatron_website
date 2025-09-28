// server.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();

/* ------------------------------- 基本中介層 ------------------------------- */
app.use(cors({
  // dev 可先允許全部；正式請鎖定來源，例如：origin: ['https://your.app']
  origin: process.env.CORS_ORIGIN || true,
}));
app.use(express.json());
app.use(morgan('dev'));

/* ---------------------------- 建立資料庫連線池 ---------------------------- */
/**
 * 重點：
 * 1) 支援 DATABASE_URL（常見雲端 PG 會要求 sslmode=require）
 * 2) 支援分欄位設定（DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME）
 * 3) 自動判斷是否開啟 SSL（DATABASE_URL 含 sslmode=require 或 PG_SSL=true）
 * 4) 啟動時印出 DB 連線設定摘要（不含密碼）
 */
const needSSL =
  process.env.PG_SSL === 'true' ||
  /sslmode=require/i.test(process.env.DATABASE_URL || '');

const dbConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: needSSL ? { rejectUnauthorized: false } : false,
    }
  : {
      host: process.env.DB_HOST || 'localhost',
      port: +(process.env.DB_PORT || 5432),
      user: process.env.DB_USER || 'app_user',
      password: process.env.DB_PASSWORD || 'Abcd2937',
      database: process.env.DB_NAME || 'user_mgmt',
      ssl: process.env.PG_SSL === 'true' ? { rejectUnauthorized: false } : false,
    };

console.log('[DB CONFIG] using', {
  from: process.env.DATABASE_URL ? 'DATABASE_URL' : 'split env',
  host: dbConfig.host,
  port: dbConfig.port,
  database: dbConfig.database,
  ssl: !!dbConfig.ssl,
});

const pool = new Pool(dbConfig);
pool.on('error', (err) => {
  console.error('[PG POOL ERROR]', err);
});

/* ------------------------------- 小工具：驗證/清理 ------------------------------- */
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

function badRequest(res, msg, fields) {
  return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: msg, fields: fields || {} } });
}

/* --------------------------------- 健康檢查 --------------------------------- */
// 用 ngrok API 隧道開這個路由來確認 DB 連線狀態：GET /health
app.get('/health', async (req, res) => {
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
});

/* -------------------- 取得使用者列表（分頁/搜尋/職業過濾）-------------------- */
// GET /api/users?page=1&limit=6&q=keyword&job=student|engineer|teacher|unemployed
app.get('/api/users', async (req, res) => {
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
});

/* ------------------------------ 取得單筆使用者 ------------------------------ */
app.get('/api/users/:id', async (req, res) => {
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
});

/* --------------------------------- 新增使用者 -------------------------------- */
app.post('/api/users', async (req, res) => {
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
});

/* ----------------------------- 更新使用者（部分欄位）----------------------------- */
app.put('/api/users/:id', async (req, res) => {
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
});

/* --------------------------------- 刪除使用者 --------------------------------- */
app.delete('/api/users/:id', async (req, res) => {
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
});

/* ------------------------------------ 啟動 ------------------------------------ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API on http://localhost:${PORT}`);
});
