import React, { useState, useEffect } from 'react';
import {
  FileSpreadsheet,
  FileDown,
  Calendar,
  Filter,
  Users,
  CheckCircle2,
  Printer,
  FileText,
} from 'lucide-react';
import api from '../../api/client';
import { Card, CardHeader } from '../../components/UI/Card';
import { SearchSelectSiswa } from '../../components/UI/SearchSelect';
import { useToast } from '../../context/ToastContext';

export const LaporanPage = () => {
  const { showToast } = useToast();
  const [classList, setClassList] = useState([]);
  const [allSiswaOptions, setAllSiswaOptions] = useState([]);

  // Filters
  const [scopeType, setScopeType] = useState('SEMUA'); // SEMUA | KELAS | SISWA
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    const fetchInit = async () => {
      try {
        const [clsRes, sswRes] = await Promise.all([
          api.get('/siswa/kelas'),
          api.get('/siswa?all=true'),
        ]);
        setClassList(clsRes.data || []);
        setAllSiswaOptions(sswRes.data || []);
        if (clsRes.data?.length > 0) {
          setSelectedClass(clsRes.data[0]);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchInit();
  }, []);

  const buildQueryString = () => {
    const params = new URLSearchParams();
    if (scopeType === 'KELAS' && selectedClass) {
      params.append('kelas', selectedClass);
    } else if (scopeType === 'SISWA' && selectedSiswaId) {
      params.append('siswaId', selectedSiswaId);
    }
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);

    const token = localStorage.getItem('guru_bk_token');
    if (token) params.append('token', token);

    return params.toString();
  };

  const handleExportExcel = () => {
    const qs = buildQueryString();
    window.open(`/api/laporan/excel?${qs}`, '_blank');
    showToast('Mengunduh file rekap Excel...', 'success');
  };

  const handleExportPdf = () => {
    const qs = buildQueryString();
    window.open(`/api/laporan/pdf?${qs}`, '_blank');
    showToast('Membuka dokumen laporan PDF resmi...', 'success');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Laporan & Rekapitulasi Data BK
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Generate dokumen resmi bimbingan konseling dalam format Microsoft Excel dan PDF siap cetak
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Filter Configuration */}
        <Card className="lg:col-span-2 space-y-5">
          <CardHeader
            title="Konfigurasi Parameter Laporan"
            subtitle="Tentukan cakupan data dan rentang periode yang ingin diekspor"
          />

          {/* Scope Selector */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Cakupan Laporan
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'SEMUA', label: 'Semua Siswa', desc: 'Seluruh angkatan & kelas' },
                { id: 'KELAS', label: 'Per Kelas', desc: 'Filter kelas tertentu' },
                { id: 'SISWA', label: 'Per Siswa', desc: 'Individu spesifik' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setScopeType(tab.id)}
                  className={`p-3 rounded-2xl border text-left transition ${
                    scopeType === tab.id
                      ? 'bg-primary-50 border-primary-500 text-primary-900 font-bold shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <div className="text-xs font-black">{tab.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 font-normal">{tab.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Scope Input */}
          {scopeType === 'KELAS' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Pilih Kelas
              </label>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 outline-none text-sm bg-white"
              >
                {classList.map((cls) => (
                  <option key={cls} value={cls}>
                    Kelas {cls}
                  </option>
                ))}
              </select>
            </div>
          )}

          {scopeType === 'SISWA' && (
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <SearchSelectSiswa
                options={allSiswaOptions}
                value={selectedSiswaId}
                onChange={(val) => setSelectedSiswaId(val)}
                label="Pilih Siswa Tertentu"
                placeholder="Cari nama atau NIS siswa..."
              />
            </div>
          )}

          {/* Date Range */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Periode Tanggal (Opsional)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <span className="text-[11px] text-slate-500 mb-1 block font-medium">Dari Tanggal:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 outline-none text-sm bg-white"
                />
              </div>

              <div>
                <span className="text-[11px] text-slate-500 mb-1 block font-medium">Sampai Tanggal:</span>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 outline-none text-sm bg-white"
                />
              </div>
            </div>
          </div>
        </Card>

        {/* Right: Export Format Cards */}
        <div className="space-y-4">
          {/* Excel Export Card */}
          <Card className="hover:border-emerald-400 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-3">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Rekapitulasi Excel (.xlsx)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                File spreadsheet rapi dengan multi-sheet: Rekap Poin Siswa, Histori Pelanggaran, dan Daftar Kasus BK.
              </p>
            </div>

            <button
              onClick={handleExportExcel}
              className="mt-5 w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-md shadow-emerald-600/20 flex items-center justify-center gap-2 transition"
            >
              <FileDown className="w-4 h-4" />
              <span>Download Format Excel</span>
            </button>
          </Card>

          {/* PDF Export Card */}
          <Card className="hover:border-rose-400 transition flex flex-col justify-between">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-3">
                <Printer className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">Laporan Resmi PDF (.pdf)</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Dokumen formal lengkap dengan KOP Surat, tabel ringkasan terstruktur, dan lembar tanda tangan Kepala Sekolah & Guru BK.
              </p>
            </div>

            <button
              onClick={handleExportPdf}
              className="mt-5 w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-600/20 flex items-center justify-center gap-2 transition"
            >
              <FileText className="w-4 h-4" />
              <span>Buka & Cetak PDF</span>
            </button>
          </Card>
        </div>
      </div>
    </div>
  );
};
