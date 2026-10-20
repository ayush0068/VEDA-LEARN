const cors = require('cors');
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const { env } = require('./config/env');
const { errorHandler, notFound } = require('./middleware/errorHandler');
const apiRoutes = require('./routes');
const ApiError = require('./utils/ApiError');

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools without Origin (curl, Postman) and whitelisted frontends
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      return callback(new ApiError(403, `CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
if (!env.isProduction) app.use(morgan('dev'));

app.get('/', (_req, res) => {
  res.json({ success: true, message: 'VedaLearn API is running', health: '/api/health' });
});

app.use('/api', apiRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;