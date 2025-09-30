// src/config/database.js
const { Pool } = require('pg');

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

module.exports = pool;
