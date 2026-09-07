import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ShieldCheck,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  Building2,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate('/', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      showToast('Harap masukkan username dan password', 'error');
      return;
    }

    setIsLoading(true);
    try {
      await login(username.trim(), password);
      showToast('Login berhasil! Selamat datang di Sistem BK.', 'success');
      navigate('/');
    } catch (err) {
      showToast(err.message || 'Username atau password salah. Silakan coba lagi.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 sm:p-6 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 relative overflow-hidden font-sans select-none">
      {/* Background Decorative Ambient Lights */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-primary-600/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-600/25 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-sky-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-md w-full relative z-10 my-auto">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-xl mb-3 group hover:scale-105 transition-transform duration-300">
            <img
              src="/logo.png"
              alt="Logo SMP N 6 Denpasar"
              className="w-14 h-14 object-contain drop-shadow-lg"
            />
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            SISTEM INFORMASI BK
          </h1>
          <div className="flex items-center justify-center gap-1.5 mt-1.5 text-primary-300 text-xs sm:text-sm font-medium">
            <Building2 className="w-4 h-4" />
            <span>SMP Negeri 6 Denpasar</span>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl p-7 sm:p-9 shadow-2xl shadow-slate-950/50 border border-white/40">
          <div className="mb-6 text-center sm:text-left">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">
              Masuk ke Akun
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Gunakan kredensial resmi Guru BK untuk mengakses data bimbingan & konseling.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Input Username */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Username
              </label>
              <div className="relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Masukkan username akun"
                  autoComplete="username"
                  className="w-full pl-11 pr-4 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 text-sm font-medium placeholder-slate-400 outline-none transition duration-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  required
                />
                <User className="w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors absolute left-3.5 top-3.5" />
              </div>
            </div>

            {/* Input Password */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Password
              </label>
              <div className="relative group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  autoComplete="current-password"
                  className="w-full pl-11 pr-11 py-3 rounded-xl border border-slate-200 bg-slate-50/70 text-slate-800 text-sm font-medium placeholder-slate-400 outline-none transition duration-200 focus:bg-white focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10"
                  required
                />
                <Lock className="w-5 h-5 text-slate-400 group-focus-within:text-primary-600 transition-colors absolute left-3.5 top-3.5" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full mt-3 py-3.5 px-5 bg-gradient-to-r from-primary-600 via-primary-700 to-indigo-700 hover:from-primary-500 hover:to-indigo-600 active:scale-[0.99] text-white font-bold text-sm rounded-xl shadow-lg shadow-primary-600/30 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Memverifikasi Akses...</span>
                </>
              ) : (
                <>
                  <span>Masuk ke Sistem</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Security & Authenticity Footnote */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center justify-center gap-2 text-[11px] text-slate-500 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>Sesi Terenkripsi &amp; Hak Akses Terproteksi</span>
          </div>
        </div>

        {/* Footer info */}
        <p className="text-center text-xs text-slate-400/80 mt-6 font-medium">
          &copy; {new Date().getFullYear()} SMP Negeri 6 Denpasar &bull; Seluruh Hak Dilindungi
        </p>
      </div>
    </div>
  );
};

export default LoginPage;
