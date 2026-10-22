import 'dotenv/config';
import express from 'express';
import http from 'http';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';
import { Server } from 'socket.io';
import connectDB from './config/db.js';
import { notFound, errorHandler } from './middleware/error.js';
import User from './models/User.js';

import authRoutes from './routes/auth.js';
import usersRoutes from './routes/users.js';
import courseRoutes from './routes/courses.js';
import applicationRoutes from './routes/applications.js';
import paymentRoutes from './routes/payments.js';
import cutoffRoutes from './routes/cutoffs.js';
import scholarshipRoutes from './routes/scholarships.js';
import notificationRoutes from './routes/notifications.js';
import statsRoutes from './routes/stats.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const server = http.createServer(app);

const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map((s) => s.trim());

const io = new Server(server, {
  cors: { origin: allowedOrigins, credentials: true },
});

io.use(async (socket, next) => {
  try {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error('Unauthorized'));
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('name role');
    if (!user) return next(new Error('Unauthorized'));
    socket.user = { id: user._id.toString(), name: user.name, role: user.role };
    next();
  } catch {
    next(new Error('Unauthorized'));
  }
});

io.on('connection', (socket) => {
  socket.join(`user:${socket.user.id}`);
  if (socket.user.role === 'admin') socket.join('admins');
  socket.emit('connected', { userId: socket.user.id, role: socket.user.role });
});

app.set('io', io);

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

const uploadsDir = path.join(__dirname, 'uploads');
fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

app.get('/api/health', (req, res) =>
  res.json({ ok: true, service: 'Meridian Admissions API', time: new Date().toISOString() })
);

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/cutoffs', cutoffRoutes);
app.use('/api/scholarships', scholarshipRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
connectDB()
  .then(() => {
    server.listen(PORT, () => console.log(`Meridian Admissions API + Socket.IO listening on :${PORT}`));
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', err.message);
    process.exit(1);
  });
