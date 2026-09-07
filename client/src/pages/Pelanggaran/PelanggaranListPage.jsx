import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  AlertOctagon,
  Plus,
  Search,
  Calendar,
  Filter,
  Trash2,
  Settings,
  RefreshCw,
  Clock,
  ShieldCheck,
  BookOpen,
} from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/UI/Card';
import { Modal } from '../../components/UI/Modal';
import { KategoriPelanggaranBadge } from '../../components/UI/Badge';
import { Pagination } from '../../components/UI/Pagination';
import { SearchSelectSiswa } from '../../components/UI/SearchSelect';
import { ConfirmDialog, LoadingSpinner } from '../../components/UI/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

export const PelanggaranListPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const { isAdmin } = useAuth();

  const [pelanggaranList, setPelanggaranList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [allSiswaOptions, setAllSiswaOptions] = useState([]);
  const [jenisPelanggaranList, setJenisPelanggaranList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 15, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('SEMUA');
  const [selectedKategori, setSelectedKategori] = useState('SEMUA');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modal State: Catat Pelanggaran
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSiswaId, setSelectedSiswaId] = useState('');
  const [selectedJenisId, setSelectedJenisId] = useState('');
  const [tanggalInput, setTanggalInput] = useState(new Date().toISOString().slice(0, 10));
  const [keteranganInput, setKeteranganInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete State
  const [deletingId, setDeletingId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchAuxData = async () => {
    try {
      const [classRes, siswaRes, jenisRes] = await Promise.all([
        api.get('/siswa/kelas'),
        api.get('/siswa?all=true'),
        api.get('/jenis-pelanggaran'),
      ]);
      setClassList(classRes.data || []);
      setAllSiswaOptions(siswaRes.data || []);
      setJenisPelanggaranList(jenisRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchPelanggaran = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '15');
      if (search) params.append('search', search);
      if (selectedClass !== 'SEMUA') params.append('kelas', selectedClass);
      if (selectedKategori !== 'SEMUA') params.append('kategori', selectedKategori);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/pelanggaran?${params.toString()}`);
      setPelanggaranList(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      showToast(err.message || 'Gagal memuat catatan pelanggaran', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedClass, selectedKategori, startDate, endDate, showToast]);

  useEffect(() => {
    fetchAuxData();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchPelanggaran(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchPelanggaran]);

  useEffect(() => {
    const siswaIdFromQuery = searchParams.get('siswaId');
    const openAdd = searchParams.get('openAdd');
    if (siswaIdFromQuery) {
      setSelectedSiswaId(siswaIdFromQuery);
    }
    if (openAdd === 'true') {
      setIsAddModalOpen(true);
    }
  }, [searchParams]);

  const handleSubmitPelanggaran = async (e) => {
    e.preventDefault();
    if (!selectedSiswaId) {
      showToast('Harap pilih siswa terlebih dahulu', 'error');
      return;
    }
    if (!selectedJenisId) {
      showToast('Harap pilih jenis pelanggaran', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/pelanggaran', {
        siswaId: selectedSiswaId,
        jenisPelanggaranId: selectedJenisId,
        tanggal: tanggalInput,
        keteranganTambahan: keteranganInput,
      });

      showToast(res.message || 'Pelanggaran berhasil dicatat!', 'success');
      setIsAddModalOpen(false);
      setSelectedJenisId('');
      setKeteranganInput('');
      fetchPelanggaran(1);
      fetchAuxData();
    } catch (err) {
      showToast(err.message || 'Gagal mencatat pelanggaran', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/pelanggaran/${deletingId}`);
      showToast('Catatan pelanggaran berhasil dihapus.', 'success');
      setDeletingId(null);
      fetchPelanggaran(pagination.page);
      fetchAuxData();
    } catch (err) {
      showToast(err.message || 'Gagal menghapus pelanggaran', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const selectedJenisObj = jenisPelanggaranList.find((j) => j.id === selectedJenisId);

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Pelanggaran Tata Tertib Sekolah
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pencatatan pelanggaran berdasarkan Pasal 18 (A. Kerajinan, B. Kelakuan, C. Kerapian)
          </p>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          <button
            onClick={() => navigate('/pengaturan')}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 text-sm font-semibold shadow-sm transition"
          >
            <BookOpen className="w-4 h-4 text-slate-500" />
            <span>Master Skor Pelanggaran</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-md shadow-primary-600/30 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Pelanggaran</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari siswa atau NIS..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
            />
          </div>

          <div>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition bg-white"
            >
              <option value="SEMUA">Semua Kelas</option>
              {classList.map((cls) => (
                <option key={cls} value={cls}>
                  Kelas {cls}
                </option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedKategori}
              onChange={(e) => setSelectedKategori(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition bg-white"
            >
              <option value="SEMUA">Semua Kategori</option>
              <option value="A. KERAJINAN">A. Kerajinan</option>
              <option value="B. KELAKUAN">B. Kelakuan</option>
              <option value="C. KERAPIAN">C. Kerapian</option>
            </select>
          </div>

          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:border-primary-500 outline-none bg-white"
            />
          </div>

          <div>
            <button
              onClick={() => {
                setSearch('');
                setSelectedClass('SEMUA');
                setSelectedKategori('SEMUA');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-3.5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Memuat riwayat pelanggaran..." />
        ) : pelanggaranList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Tidak ada catatan pelanggaran yang sesuai filter.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3.5 px-4">Tanggal</th>
                  <th className="py-3.5 px-4">Nama Siswa & Kelas</th>
                  <th className="py-3.5 px-4">Pelanggaran (Pasal 18)</th>
                  <th className="py-3.5 px-4">Kategori</th>
                  <th className="py-3.5 px-4">Skor Poin</th>
                  <th className="py-3.5 px-4">Keterangan</th>
                  <th className="py-3.5 px-4">Dicatat Oleh</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pelanggaranList.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-xs font-mono text-slate-600">
                      {new Date(p.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => navigate(`/siswa/${p.siswa.id}`)}
                        className="font-bold text-slate-900 hover:text-primary-600 text-left transition"
                      >
                        {p.siswa.nama}
                      </button>
                      <div className="text-xs text-slate-400 font-medium">
                        {p.siswa.kelas} &bull; NIS: {p.siswa.nis}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {p.jenisPelanggaran.namaPelanggaran}
                    </td>
                    <td className="py-3.5 px-4">
                      <KategoriPelanggaranBadge kategori={p.jenisPelanggaran.kategori} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-600">
                      +{p.poinSaatItu} Skor
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs truncate">
                      {p.keteranganTambahan || '-'}
                    </td>
                    <td className="py-3.5 px-4 text-xs font-medium text-slate-700">
                      {p.dicatatOleh.nama}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => setDeletingId(p.id)}
                        title="Hapus Catatan Pelanggaran"
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Pagination
          page={pagination.page}
          totalPages={pagination.totalPages}
          total={pagination.total}
          limit={pagination.limit}
          onPageChange={(p) => fetchPelanggaran(p)}
        />
      </Card>

      {/* Modal Input Pelanggaran */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Catat Pelanggaran Siswa (Pasal 18)"
      >
        <form onSubmit={handleSubmitPelanggaran} className="space-y-4">
          <SearchSelectSiswa
            options={allSiswaOptions}
            value={selectedSiswaId}
            onChange={(val) => setSelectedSiswaId(val)}
            label="Pilih Siswa Pelanggar"
            placeholder="Cari nama atau NIS siswa..."
          />

          {/* Grouped by A. Kerajinan, B. Kelakuan, C. Kerapian */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Pilih Jenis Pelanggaran Tata Tertib
            </label>
            <select
              value={selectedJenisId}
              onChange={(e) => setSelectedJenisId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition bg-white"
              required
            >
              <option value="">-- Pilih Jenis Pelanggaran --</option>
              <optgroup label="A. KERAJINAN (Skor 1 - 4)">
                {jenisPelanggaranList
                  .filter((j) => j.kategori.includes('KERAJINAN') || j.kategori.includes('A.'))
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.namaPelanggaran} (+{j.poin} Skor)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="B. KELAKUAN (Skor 2 - 30+)">
                {jenisPelanggaranList
                  .filter((j) => j.kategori.includes('KELAKUAN') || j.kategori.includes('B.'))
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.namaPelanggaran} (+{j.poin} Skor)
                    </option>
                  ))}
              </optgroup>
              <optgroup label="C. KERAPIAN (Skor 2 - 10)">
                {jenisPelanggaranList
                  .filter((j) => j.kategori.includes('KERAPIAN') || j.kategori.includes('C.'))
                  .map((j) => (
                    <option key={j.id} value={j.id}>
                      {j.namaPelanggaran} (+{j.poin} Skor)
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {selectedJenisObj && (
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2">
                <KategoriPelanggaranBadge kategori={selectedJenisObj.kategori} size="sm" />
                <span className="text-xs text-slate-600 font-medium">{selectedJenisObj.namaPelanggaran}</span>
              </div>
              <div className="font-black text-rose-600 text-sm">+{selectedJenisObj.poin} Skor Poin</div>
            </div>
          )}

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Tanggal Pelanggaran
            </label>
            <input
              type="date"
              value={tanggalInput}
              onChange={(e) => setTanggalInput(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition bg-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Keterangan Tambahan / Kronologi (Opsional)
            </label>
            <textarea
              rows={3}
              value={keteranganInput}
              onChange={(e) => setKeteranganInput(e.target.value)}
              placeholder="Contoh: Terjaring razia guru piket di gerbang sekolah pukul 07.15 WITA"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-200 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Pelanggaran'}
            </button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Catatan Pelanggaran"
        message="Apakah Anda yakin ingin menghapus catatan pelanggaran ini? Skor poin siswa akan otomatis dihitung ulang."
        confirmText="Ya, Hapus"
      />
    </div>
  );
};
