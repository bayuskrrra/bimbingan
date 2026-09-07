import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';
import { AppLayout } from './components/Layout/AppLayout';
import { ProtectedRoute } from './components/Auth/ProtectedRoute';

import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { SiswaListPage } from './pages/Siswa/SiswaListPage';
import { SiswaDetailPage } from './pages/Siswa/SiswaDetailPage';
import { PelanggaranListPage } from './pages/Pelanggaran/PelanggaranListPage';
import { KasusListPage } from './pages/Kasus/KasusListPage';
import { KasusDetailPage } from './pages/Kasus/KasusDetailPage';
import { LaporanPage } from './pages/Laporan/LaporanPage';
import { PengaturanPage } from './pages/Pengaturan/PengaturanPage';

export function App() {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <Routes>
            {/* Rute Publik: Login */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rute Terproteksi: Harus Login */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/siswa" element={<SiswaListPage />} />
                <Route path="/siswa/:id" element={<SiswaDetailPage />} />
                <Route path="/pelanggaran" element={<PelanggaranListPage />} />
                <Route path="/kasus" element={<KasusListPage />} />
                <Route path="/kasus/:id" element={<KasusDetailPage />} />
                <Route path="/laporan" element={<LaporanPage />} />
                <Route path="/pengaturan" element={<PengaturanPage />} />
              </Route>
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
}

export default App;
