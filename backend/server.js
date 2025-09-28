// server.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// 健康檢查
app.get('/health', async (req, res) => {
  try {
    const r = await pool.query('SELECT 1');
    res.json({ ok: true, db: r.rows[0] ? 'up' : 'unknown' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

// 取得使用者列表（含分頁與搜尋/職業過濾）
app.get('/api/users', async (req, res) => {
  try {
    const page  = Math.max(parseInt(req.query.page || '1', 10), 1);
    const limit = Math.max(parseInt(req.query.limit || '6', 10), 1);
    const q     = (req.query.q || '').trim();
    const job   = (req.query.job || '').trim(); // 'student' | 'engineer' | 'teacher' | 'unemployed'

    const where = [];
    const params = [];

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      // name 或 phone 模糊
      where.push(`(LOWER(name) LIKE $${params.length} OR phone LIKE $${params.length})`);
    }
    if (job) {
      params.push(job);
      where.push(`job = $${params.length}::job_enum`);
    }

    const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // total
    const totalSql = `SELECT COUNT(*)::int AS count FROM users ${whereSql}`;
    const total = (await pool.query(totalSql, params)).rows[0].count;

    // items
    const offset = (page - 1) * limit;
    const itemsSql = `
      SELECT id,name,gender,birthday,job,phone,avatar_url,created_at,updated_at
      FROM users
      ${whereSql}
      ORDER BY created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;
    const items = (await pool.query(itemsSql, [...params, limit, offset])).rows;

    res.json({
      items,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    });
  } catch (e) {
    res.status(500).json({ error: { code: 'INTERNAL', message: e.message } });
  }
});

// 新增使用者（最小版：先做必要欄位）
app.post('/api/users', async (req, res) => {
  try {
    const { name, gender, birthday, job, phone, avatar_url } = req.body;
    if (!name || !job) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'name, job 為必填' } });
    }
    const sql = `
      INSERT INTO users (name, gender, birthday, job, phone, avatar_url)
      VALUES ($1, $2, $3, $4::job_enum, $5, $6)
      RETURNING id,name,gender,birthday,job,phone,avatar_url,created_at,updated_at
    `;
    const { rows } = await pool.query(sql, [name.trim(), gender || null, birthday || null, job, phone || null, avatar_url || null]);
    res.status(201).json(rows[0]);
  } catch (e) {
    if (e.code === '23505') {
      // unique_violation (phone)
      return res.status(409).json({ error: { code: 'CONFLICT', message: 'phone 已存在' } });
    }
    if (e.code === '22P02') {
      // enum/型別錯誤
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: '欄位格式不正確' } });
    }
    res.status(500).json({ error: { code: 'INTERNAL', message: e.message } });
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`🚀 API on http://localhost:${PORT}`));