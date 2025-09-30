// app.js
require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const cors = require('cors');
const routes = require('./src/routes');

const app = express();

/* ------------------------------- 基本中介層 ------------------------------- */
app.use(cors({
  // dev 可先允許全部；正式請鎖定來源，例如：origin: ['https://your.app']
  origin: process.env.CORS_ORIGIN || true,
}));
app.use(express.json());
app.use(morgan('dev'));

/* --------------------------------- 路由 --------------------------------- */
app.use('/', routes);

module.exports = app;
