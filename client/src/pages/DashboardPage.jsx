import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  AlertTriangle,
  FileText,
  AlertOctagon,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Calendar,
  Layers,
  Award,
  BookOpen,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from 'recharts';
import api from '../api/client';
import { Card, CardHeader } from '../components/UI/Card';
import { ZoneBadge } from '../components/UI/Badge';
import { LoadingSpinner } from '../components/UI/LoadingSpinner';

export const DashboardPage = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const res = await api.get('/dashboard/stats');
        setStats(res.data);
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  if (loading) {
    return <LoadingSpinner text="Memuat data statistik bimbingan konseling..." />;
  }

  const {
    summaryCards,
    trenPelanggaran = [],
    kategoriDistribution = [],
    top5Siswa = [],
    caseStatusData = [],
    classHeatmap = [],
  } = stats || {};

  const pelanggaranDiff =
    (summaryCards?.pelanggaranBulanIni || 0) - (summaryCards?.pelanggaranBulanLalu || 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-primary-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl relative overflow-hidden">
        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-primary-300 text-xs font-semibold mb-3 border border-white/10">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Tata Tertib Resmi: Pasal 18 (Skor) & Pasal 19 (Ketentuan Penanganan)</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Dashboard Bimbingan & Konseling
          </h1>
          <p className="text-slate-300 text-sm mt-1 max-w-xl leading-relaxed">
            Sistem pencatatan tata tertib (A. Kerajinan, B. Kelakuan, C. Kerapian) dan penanganan kasus konseling siswa.
          </p>
        </div>

        <div className="flex items-center gap-3 relative z-10">
          <button
            onClick={() => navigate('/pelanggaran')}
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-semibold shadow-lg shadow-primary-600/30 transition flex items-center gap-2"
          >
            <AlertOctagon className="w-4 h-4" />
            <span>+ Catat Pelanggaran</span>
          </button>
          <button
            onClick={() => navigate('/kasus')}
            className="px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-xl text-sm font-semibold backdrop-blur-md transition flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            <span>+ Catat Kasus BK</span>
          </button>
        </div>

        <div className="absolute -right-10 -bottom-10 w-72 h-72 bg-primary-500/20 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Siswa Terdaftar</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {summaryCards?.totalSiswa || 0}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Aktif dalam database</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Pelanggaran Bulan Ini</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {summaryCards?.pelanggaranBulanIni || 0}
            </div>
            <div className="flex items-center gap-1 text-[11px] font-semibold mt-0.5">
              {pelanggaranDiff >= 0 ? (
                <span className="text-rose-600 flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" /> +{pelanggaranDiff} vs bln lalu
                </span>
              ) : (
                <span className="text-emerald-600 flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" /> {pelanggaranDiff} vs bln lalu
                </span>
              )}
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500">Kasus Konseling Aktif</div>
            <div className="text-2xl font-black text-slate-900 mt-0.5">
              {summaryCards?.kasusAktif || 0}
            </div>
            <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">Status Baru & Pembinaan</div>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-gradient-to-br from-rose-50 to-white border-rose-200 ring-2 ring-rose-500/20 shadow-md shadow-rose-100">
          <div className="w-12 h-12 rounded-2xl bg-rose-600 text-white flex items-center justify-center flex-shrink-0 shadow-lg shadow-rose-600/30">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-rose-700">Perlu Surat / Penanganan</div>
            <div className="text-2xl font-black text-rose-600 mt-0.5">
              {summaryCards?.siswaZonaPeringatan || 0} Siswa
            </div>
            <div className="text-[11px] text-rose-500 font-semibold mt-0.5">Skor Akumulasi &ge; 4 Poin</div>
          </div>
        </Card>
      </div>

      {/* Row 1 Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="Tren Pelanggaran 6 Bulan Terakhir"
            subtitle="Distribusi insiden A. Kerajinan, B. Kelakuan, dan C. Kerapian"
          />
          <div className="h-72 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trenPelanggaran} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ paddingTop: '10px', fontSize: '12px' }} />
                <Line
                  type="monotone"
                  dataKey="total"
                  name="Total Pelanggaran"
                  stroke="#0f172a"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
                <Line
                  type="monotone"
                  dataKey="kerajinan"
                  name="A. Kerajinan"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
                <Line
                  type="monotone"
                  dataKey="kelakuan"
                  name="B. Kelakuan"
                  stroke="#ef4444"
                  strokeWidth={2.5}
                />
                <Line
                  type="monotone"
                  dataKey="kerapian"
                  name="C. Kerapian"
                  stroke="#f59e0b"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Donut Chart: Distribusi 3 Kategori Resmi */}
        <Card>
          <CardHeader
            title="Kategori Pelanggaran"
            subtitle="Persentase Kerajinan vs Kelakuan vs Kerapian"
          />
          <div className="h-60 w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={kategoriDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={85}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {kategoriDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name, item) => [`${value} Kasus (${item.payload.percentage}%)`, name]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 mt-2 pt-3 border-t border-slate-100 text-center">
            {kategoriDistribution.map((k) => (
              <div key={k.name} className="p-2 rounded-xl bg-slate-50">
                <div className="flex items-center justify-center gap-1.5 mb-1">
                  <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: k.color }} />
                  <span className="text-[11px] font-bold text-slate-700">{k.name}</span>
                </div>
                <div className="text-base font-black text-slate-900">{k.value}</div>
                <div className="text-[10px] text-slate-500 font-semibold">{k.percentage}%</div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Row 2: Top 5 Siswa dengan Poin Tertinggi & Kasus per Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader
            title="5 Siswa dengan Skor Pelanggaran Tertinggi"
            subtitle="Klik nama siswa untuk melihat profil dan tindakan penanganan sesuai Pasal 19"
            action={
              <button
                onClick={() => navigate('/siswa')}
                className="text-xs font-bold text-primary-600 hover:text-primary-700 flex items-center gap-1"
              >
                Lihat Semua <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            }
          />

          {top5Siswa.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-400">
              Belum ada data pelanggaran siswa yang tercatat.
            </div>
          ) : (
            <div className="space-y-3 mt-3">
              {top5Siswa.map((siswa, idx) => (
                <div
                  key={siswa.id}
                  onClick={() => navigate(`/siswa/${siswa.id}`)}
                  className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-slate-200/70 hover:border-primary-400 hover:bg-primary-50/30 transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-xs ${
                        idx === 0
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-200'
                          : idx === 1
                          ? 'bg-orange-500 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      #{idx + 1}
                    </div>
                    <div>
                      <div className="text-sm font-bold text-slate-900 group-hover:text-primary-700 transition flex items-center gap-2">
                        {siswa.nama}
                        <span className="text-xs text-slate-400 font-normal">({siswa.kelas} - {siswa.nis})</span>
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {siswa.zoneInfo?.penanganan || siswa.zoneInfo?.description}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-auto">
                    <ZoneBadge zoneInfo={siswa.zoneInfo} size="sm" />
                    <div className="text-right">
                      <span className="text-base font-black text-slate-900">{siswa.totalPoin}</span>
                      <span className="text-xs text-slate-500 ml-1 font-semibold">Skor</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Kasus per Status Bar Chart */}
        <Card>
          <CardHeader
            title="Status Kasus Konseling BK"
            subtitle="Kasus dalam penanganan vs selesai"
          />
          <div className="h-56 w-full mt-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caseStatusData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="status" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                <Tooltip
                  formatter={(val) => [`${val} Kasus`, 'Jumlah']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderRadius: '12px',
                    border: '1px solid #e2e8f0',
                    fontSize: '12px',
                  }}
                />
                <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                  {caseStatusData.map((entry, index) => (
                    <Cell key={`bar-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
            <span>Total: {caseStatusData.reduce((s, c) => s + c.count, 0)} Kasus</span>
            <button
              onClick={() => navigate('/kasus')}
              className="text-primary-600 font-bold hover:underline"
            >
              Buka Kasus BK &rarr;
            </button>
          </div>
        </Card>
      </div>

      {/* Row 3: Heatmap Kelas */}
      <Card>
        <CardHeader
          title="Matriks Pelanggaran per Kelas"
          subtitle="Pemetaan kelas dengan pelanggaran terbanyak untuk evaluasi wali kelas dan kepala sekolah"
        />

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                <th className="py-3 px-4">Kelas</th>
                <th className="py-3 px-4">Tingkat Intensitas</th>
                <th className="py-3 px-4 text-center">A. Kerajinan</th>
                <th className="py-3 px-4 text-center">B. Kelakuan</th>
                <th className="py-3 px-4 text-center">C. Kerapian</th>
                <th className="py-3 px-4 text-right">Total Kejadian</th>
                <th className="py-3 px-4 text-right">Total Skor</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {classHeatmap.map((item) => (
                <tr key={item.kelas} className="hover:bg-slate-50/80 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{item.kelas}</td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-28 bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            item.intensityPercent > 70
                              ? 'bg-rose-600'
                              : item.intensityPercent > 40
                              ? 'bg-orange-500'
                              : item.intensityPercent > 15
                              ? 'bg-amber-500'
                              : 'bg-emerald-500'
                          }`}
                          style={{ width: `${Math.max(item.intensityPercent, 5)}%` }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-medium text-blue-600">{item.kerajinan}</td>
                  <td className="py-3.5 px-4 text-center font-bold text-rose-600">{item.kelakuan}</td>
                  <td className="py-3.5 px-4 text-center font-medium text-amber-600">{item.kerapian}</td>
                  <td className="py-3.5 px-4 text-right font-bold text-slate-800">{item.totalPelanggaran}</td>
                  <td className="py-3.5 px-4 text-right font-black text-slate-900">{item.totalPoin} Skor</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
