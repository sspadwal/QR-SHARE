import express from "express";
import cookieParser from 'cookie-parser';
import sessionRoutes from './src/modules/session/session.routes.js';
import sessionApiRoutes from './src/modules/session/session.api.routes.js';
import fileRoutes from './src/modules/file/file.routes.js';
import cors from 'cors';

const isAllowedOrigin = (origin) => {
  // Local network / Wi-Fi origins (10.x.x.x, 172.16.x.x-172.31.x.x, 192.168.x.x, localhost, 127.0.0.1)
  const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|192\.168\.\d{1,3}\.\d{1,3}|172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}|10\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/.test(origin);
  
  // Production client origin configured via env
  const isProdClient = process.env.CLIENT_URL && origin === process.env.CLIENT_URL;
  
  return isLocal || isProdClient;
};

const corsOptions = {
  origin(origin, callback) {
    if (!origin || isAllowedOrigin(origin)) {
      callback(null, origin || 'http://localhost:5173');
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'x-session-id'],
};

const app = express();

// CORS must run first so every response (including errors) gets the right headers
app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static('public'));

app.use('/api/session', sessionApiRoutes);
app.use('/', sessionRoutes);
app.use('/api/files', fileRoutes);

export default app;
