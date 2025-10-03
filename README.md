# 使用者管理系統

前後端分離的使用者管理系統，提供**使用者清單、分頁、搜尋(含輸入防抖動)、表單驗證**與 **Cloudinary 圖片上傳**。

[![示範影片](https://img.youtube.com/vi/JnKfA4ATJuo/0.jpg)](https://youtu.be/JnKfA4ATJuo)

---

## 技術棧

### 前端 (React + Vite)

- React 18、Vite
- React Router（URL 查詢參數同步）
- @tanstack/react-query（資料快取 / 請求狀態）
- react-hook-form + zod（表單驗證）
- Bootstrap / react-bootstrap（UI 元件）
- **DebouncedInput**（輸入防抖動，降低搜尋時的 API 呼叫）
- 自訂 Hooks：`UserCard, UsersTable, PaginationBar, UserFormModal`

### 後端 (Node.js + Express)

- pg（PostgreSQL 連線池）
- cors、morgan（CORS / 開發日誌）
- multer（multipart 檔案處理）
- streamifier + cloudinary（串流上傳圖片）

---

## 功能

- **使用者清單**：卡片 / 表格雙視圖。
- **篩選與搜尋**：姓名 / 電話關鍵字、職業（student/engineer/teacher/unemployed），含防抖動機制。
- **分頁**：`PaginationBar` 元件，同步 URL 參數（`tab` / `page` / `q` / `job`）。
- **表單驗證**：`react-hook-form + zod` 驗證。
- **圖片上傳**：前端檔案上傳 → 後端 Cloudinary 串流處理 → 以 `secure_url` 儲存為 `avatar_url`。
- **CRUD**：透過後端 REST API 進行新增 / 讀取 / 更新 / 刪除。

---

## 快速開始（安裝與啟動）

### 後端

1. 安裝套件
   ```bash
   cd backend && npm i
   ```
2. 建立 `backend/.env`
   ```env
   PORT=8080
   DB_HOST=localhost
   DB_PORT=5432
   DB_USER=app_user
   DB_PASSWORD=Abcd2937
   DB_NAME=user_mgmt
   PG_SSL=false
   CORS_ORIGIN=http://localhost:5173
   CLOUDINARY_CLOUD_NAME=你的_cloud_name
   CLOUDINARY_API_KEY=你的_api_key
   CLOUDINARY_API_SECRET=你的_api_secret
   ```
3. 啟動
   ```bash
   node server.js
   ```

### 前端

1. 安裝套件
   
   ```bash
   cd frontend && npm i
   ```
2. 建立 `frontend/.env.local`
   
   ```env
   VITE_API_BASE=http://localhost:8080
   VITE_DEMO_VIDEO_URL=https://youtu.be/zHZEzFSHQK4?si=tMJhKXvimCyuiGbv
   ```
   
   或於 `vite.config.js` 加入開發代理：
   
   ```js
   export default {
     server: {
       proxy: {
         '/api': { target: 'http://localhost:8080', changeOrigin: true }
       }
     }
   }
   ```
3. 啟動
   
   ```bash
   npm run dev
   ```

---

## 資料庫初始化（PostgreSQL）

```sql
CREATE DATABASE user_mgmt;

CREATE TABLE IF NOT EXISTS users (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(50) NOT NULL,
  gender      VARCHAR(10),
  birthday    DATE,
  job         VARCHAR(20) NOT NULL,
  phone       VARCHAR(20) UNIQUE,
  avatar_url  TEXT,
  created_at  TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## API 端點

- `GET /health`：健康檢查
- `GET /api/users?page=1&limit=6&q=keyword&job=student|engineer|teacher|unemployed`：取得使用者清單（分頁/篩選）
- `GET /api/users/:id`：取得單一使用者
- `POST /api/users`：新增使用者
- `PUT /api/users/:id`：更新使用者
- `DELETE /api/users/:id`：刪除使用者
- `POST /api/upload`（`multipart/form-data`，欄位：`file`）：上傳圖片至 Cloudinary，回傳 `secure_url`

---

## 環境需求

- Node.js 18+
- PostgreSQL 14+
- Cloudinary 帳號與 API 金鑰

---

## 備註

- 專案提供 `DebouncedInput` 元件以降低搜尋輸入帶來的頻繁請求，建議將等待時間（debounce delay）與頁面大小（page size）依據實際 API 響應時間調整。
- 前端透過 URL 查詢參數同步狀態（頁籤 / 分頁 / 搜尋 / 篩選），利於分享與回訪。
