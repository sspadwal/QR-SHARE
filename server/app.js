import express from "express";
import cookieParser from 'cookie-parser';
import sessionRoutes from './src/modules/session/session.routes.js';
import sessionApiRoutes from './src/modules/session/session.api.routes.js';
import fileRoutes from './src/modules/file/file.routes.js';
import cors from 'cors';

const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  // Local network / Wi-Fi origins (10.x.x.x, 172.16.x.x-172.31.x.x, 192.168.x.x, localhost, 127.0.0.1)
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
  if (isLocal) return true;

  const normalizedOrigin = origin.trim().replace(/\/$/, '').toLowerCase();

  // Production client origin(s) configured via env (supports comma-separated list)
  if (process.env.CLIENT_URL) {
    const allowed = process.env.CLIENT_URL.split(',').map(url => url.trim().replace(/\/$/, '').toLowerCase());
    if (allowed.includes(normalizedOrigin)) {
      return true;
    }
  }

  // Hardcoded fallback allowed origins for deployment convenience
  const fallbacks = [
    'https://file-share-system.vercel.app',
    'https://files-sharing-website.vercel.app'
  ];
  if (fallbacks.includes(normalizedOrigin)) {
    return true;
  }

  return false;
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, origin || '*');
    } else {
      console.warn(`Blocked CORS request from origin: ${origin}`);
      callback(null, false);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-session-id', 'Authorization'],
};

const app = express();

// CORS must run first so every response (including errors) gets the right headers
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.get('/ping', (req, res) => {
  res.status(200).json({ status: 'ok', message: 'pong' });
});

app.use('/api/session', sessionApiRoutes);
app.use('/', sessionRoutes);
app.use('/api/files', fileRoutes);

export default app;
