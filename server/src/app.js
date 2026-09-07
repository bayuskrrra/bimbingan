import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import siswaRoutes from './routes/siswaRoutes.js';
import jenisPelanggaranRoutes from './routes/jenisPelanggaranRoutes.js';
import pelanggaranRoutes from './routes/pelanggaranRoutes.js';
import kasusRoutes from './routes/kasusRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import laporanRoutes from './routes/laporanRoutes.js';
import pengaturanRoutes from './routes/pengaturanRoutes.js';
import guruBkRoutes from './routes/guruBkRoutes.js';

const app = express();

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

// Health check
const handleHealth = (req, res) => {
  res.json({
    status: 'OK',
    app: 'Sistem Informasi Bimbingan Konseling (BK)',
    time: new Date().toISOString(),
  });
};
app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// API Routes (mendukung prefix /api maupun direct path untuk Vercel Serverless)
app.use('/api/auth', authRoutes);
app.use('/auth', authRoutes);

app.use('/api/siswa', siswaRoutes);
app.use('/siswa', siswaRoutes);

app.use('/api/jenis-pelanggaran', jenisPelanggaranRoutes);
app.use('/jenis-pelanggaran', jenisPelanggaranRoutes);

app.use('/api/pelanggaran', pelanggaranRoutes);
app.use('/pelanggaran', pelanggaranRoutes);

app.use('/api/kasus', kasusRoutes);
app.use('/kasus', kasusRoutes);

app.use('/api/dashboard', dashboardRoutes);
app.use('/dashboard', dashboardRoutes);

app.use('/api/laporan', laporanRoutes);
app.use('/laporan', laporanRoutes);

app.use('/api/pengaturan', pengaturanRoutes);
app.use('/pengaturan', pengaturanRoutes);

app.use('/api/guru-bk', guruBkRoutes);
app.use('/guru-bk', guruBkRoutes);

// Error Handling Middleware
app.use(errorHandler);

export default app;
