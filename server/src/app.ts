import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';
import { env } from './config/env';
import { errorHandler, notFound } from './middleware/errorHandler';
import apiRoutes from './routes';

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // allow tools without Origin (curl, Postman) and whitelisted frontends
      if (!origin || env.clientUrls.includes(origin)) return callback(null, true);
      return callback(new Error(`CORS blocked for origin: ${origin}`));
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

export default app;
