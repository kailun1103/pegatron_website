// server.js
const app = require('./app');

/* ------------------------------------ 啟動 ------------------------------------ */
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 API on http://localhost:${PORT}`);
});
