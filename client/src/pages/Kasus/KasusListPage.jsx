import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  FileText,
  Plus,
  Search,
  Users,
  Clock,
  ArrowRight,
  UserPlus,
  Trash2,
  HelpCircle,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  CheckCircle2,
  X,
} from 'lucide-react';
import api from '../../api/client';
import { Card } from '../../components/UI/Card';
import { Modal } from '../../components/UI/Modal';
import { StatusKasusBadge } from '../../components/UI/Badge';
import { Pagination } from '../../components/UI/Pagination';
import { SearchSelectSiswa } from '../../components/UI/SearchSelect';
import { ConfirmDialog, LoadingSpinner } from '../../components/UI/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export const KasusListPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [kasusList, setKasusList] = useState([]);
  const [allSiswaOptions, setAllSiswaOptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });

  // Filters
  const [search, setSearch] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('SEMUA');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Delete States
  const [deletingId, setDeletingId] = useState(null);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal Input Kasus State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [siswaUtamaId, setSiswaUtamaId] = useState('');
  const [judulKasus, setJudulKasus] = useState('');
  const [deskripsiLengkap, setDeskripsiLengkap] = useState('');
  const [tanggalKejadian, setTanggalKejadian] = useState(new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState('BARU');
  const [tindakLanjutAwal, setTindakLanjutAwal] = useState('');
  const [pihakTerlibatList, setPihakTerlibatList] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Helper for involved student
  const [tempInvolvedSiswaId, setTempInvolvedSiswaId] = useState('');
  const [tempInvolvedPeran, setTempInvolvedPeran] = useState('Terlibat');

  const fetchAuxSiswa = async () => {
    try {
      const res = await api.get('/siswa?all=true');
      setAllSiswaOptions(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchKasus = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (selectedStatus !== 'SEMUA') params.append('status', selectedStatus);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/kasus?${params.toString()}`);
      setKasusList(res.data || []);
      if (res.pagination) setPagination(res.pagination);
    } catch (err) {
      showToast(err.message || 'Gagal memuat daftar kasus', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedStatus, startDate, endDate, showToast]);

  useEffect(() => {
    fetchAuxSiswa();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchKasus(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchKasus]);

  useEffect(() => {
    const siswaIdFromQuery = searchParams.get('siswaId');
    const openAdd = searchParams.get('openAdd');
    if (siswaIdFromQuery) setSiswaUtamaId(siswaIdFromQuery);
    if (openAdd === 'true') setIsModalOpen(true);
  }, [searchParams]);

  const handleAddInvolved = () => {
    if (!tempInvolvedSiswaId) return;
    if (tempInvolvedSiswaId === siswaUtamaId) {
      showToast('Siswa utama tidak perlu ditambahkan ke pihak terlibat.', 'error');
      return;
    }
    if (pihakTerlibatList.some((p) => p.siswaId === tempInvolvedSiswaId)) {
      showToast('Siswa tersebut sudah ditambahkan.', 'error');
      return;
    }

    const siswaObj = allSiswaOptions.find((s) => s.id === tempInvolvedSiswaId);
    setPihakTerlibatList((prev) => [
      ...prev,
      {
        siswaId: tempInvolvedSiswaId,
        peran: tempInvolvedPeran || 'Terlibat',
        nama: siswaObj?.nama,
        kelas: siswaObj?.kelas,
      },
    ]);
    setTempInvolvedSiswaId('');
    setTempInvolvedPeran('Terlibat');
  };

  const handleRemoveInvolved = (id) => {
    setPihakTerlibatList((prev) => prev.filter((p) => p.siswaId !== id));
  };

  const handleSubmitKasus = async (e) => {
    e.preventDefault();
    if (!siswaUtamaId) {
      showToast('Harap pilih siswa utama kasus', 'error');
      return;
    }
    if (!judulKasus.trim() || !deskripsiLengkap.trim()) {
      showToast('Harap isi judul dan deskripsi lengkap kasus', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        siswaUtamaId,
        judulKasus,
        deskripsiLengkap,
        tanggalKejadian,
        status,
        tindakLanjutAwal: tindakLanjutAwal.trim() || undefined,
        pihakTerlibat: pihakTerlibatList.map((p) => ({
          siswaId: p.siswaId,
          peran: p.peran,
        })),
      };

      await api.post('/kasus', payload);
      showToast('Kasus bimbingan konseling berhasil dicatat!', 'success');
      setIsModalOpen(false);
      setJudulKasus('');
      setDeskripsiLengkap('');
      setTindakLanjutAwal('');
      setPihakTerlibatList([]);
      fetchKasus(1);
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan kasus', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteSingle = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/kasus/${deletingId}`);
      showToast('Data kasus berhasil dihapus.', 'success');
      setDeletingId(null);
      fetchKasus(pagination.page);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus kasus', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeleting(true);
    try {
      await api.delete('/kasus/all');
      showToast('Semua data kasus bimbingan berhasil dihapus/dibersihkan!', 'success');
      setIsDeletingAll(false);
      fetchKasus(1);
    } catch (err) {
      showToast(err.message || 'Gagal membersihkan data kasus', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Kasus & Konseling Bimbingan (BK)
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Pencatatan kasus non-poin (konseling pribadi, mediasi konflik, masalah keluarga, dll) beserta riwayat tindak lanjut bertahap
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
          {kasusList.length > 0 && (
            <button
              onClick={() => setIsDeletingAll(true)}
              className="flex items-center gap-1.5 px-3.5 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl font-bold transition text-xs shadow-sm"
            >
              <Trash2 className="w-4 h-4 text-rose-600" />
              <span>Hapus Semua Kasus (Reset)</span>
            </button>
          )}

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-md shadow-primary-600/30 transition text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>+ Catat Kasus Baru</span>
          </button>
        </div>
      </div>

      {/* Penjelasan Sistem Kasus Bimbingan */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-white border border-blue-200/80 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center flex-shrink-0 shadow-md shadow-blue-500/20">
            <HelpCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Perbedaan "Pelanggaran" vs "Kasus Bimbingan" di Sistem BK:
            </h3>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              <strong>Pelanggaran Tata Tertib</strong> = Pelanggaran terstandar dengan bobot skor (misal: Terlambat, Merokok, Bolos).<br />
              <strong>Kasus Bimbingan</strong> = Insiden/konseling khusus yang butuh <u>cerita bebas naratif</u> (contoh: perselisihan antar siswa, anak sering murung/menangis, masalah keluarga, dll). Kasus memiliki <strong>Riwayat Tindak Lanjut</strong> yang bisa ditambah terus seiring perkembangan konseling siswa.
            </p>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari judul kasus atau nama siswa..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
            />
          </div>

          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition bg-white"
            >
              <option value="SEMUA">Semua Status Kasus</option>
              <option value="BARU">Status: Kasus Baru</option>
              <option value="PROSES">Status: Dalam Pembinaan / Mediasi</option>
              <option value="SELESAI">Status: Selesai / Ditutup</option>
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
                setSelectedStatus('SEMUA');
                setStartDate('');
                setEndDate('');
              }}
              className="w-full px-3.5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Kasus List */}
      {loading ? (
        <LoadingSpinner text="Memuat daftar kasus konseling..." />
      ) : kasusList.length === 0 ? (
        <Card>
          <div className="p-12 text-center text-slate-400 text-sm">
            Tidak ada catatan kasus bimbingan yang tercatat.{' '}
            <button onClick={() => setIsModalOpen(true)} className="text-primary-600 font-bold underline ml-1">
              Catat kasus pertama sekarang
            </button>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {kasusList.map((k) => (
            <Card
              key={k.id}
              hover
              onClick={() => navigate(`/kasus/${k.id}`)}
              className="group border border-slate-200 hover:border-primary-400 relative"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-2">
                <div className="flex items-center gap-2.5">
                  <StatusKasusBadge status={k.status} />
                  <span className="text-xs text-slate-400 font-medium">
                    Tanggal Kejadian: {new Date(k.tanggalKejadian).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setDeletingId(k.id);
                    }}
                    title="Hapus Kasus Ini"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <span className="text-xs font-bold text-primary-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    Buka Detail & Tindak Lanjut <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 group-hover:text-primary-700 transition mb-2">
                {k.judulKasus}
              </h3>

              <div className="flex items-center gap-2 text-xs text-slate-600 mb-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <Users className="w-4 h-4 text-primary-600 flex-shrink-0" />
                <div>
                  Siswa Utama:{' '}
                  <strong className="text-slate-900">{k.siswaUtama.nama}</strong> ({k.siswaUtama.kelas})
                  {k.pihakTerlibat.length > 0 && (
                    <span className="text-slate-500 ml-2 font-medium">
                      + {k.pihakTerlibat.length} siswa lain terlibat
                    </span>
                  )}
                </div>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
                {k.deskripsiLengkap}
              </p>

              <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                <span>Dicatat oleh: <strong>{k.dicatatOleh.nama}</strong></span>
                <span className="font-semibold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg border border-indigo-100">
                  {k._count?.tindakLanjutList || 0} Riwayat Log Tindak Lanjut
                </span>
              </div>
            </Card>
          ))}

          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            total={pagination.total}
            limit={pagination.limit}
            onPageChange={(p) => fetchKasus(p)}
          />
        </div>
      )}

      {/* Modal Input Kasus Baru */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Catat Kasus Konseling Bimbingan Siswa"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleSubmitKasus} className="space-y-4">
          <SearchSelectSiswa
            options={allSiswaOptions}
            value={siswaUtamaId}
            onChange={(val) => setSiswaUtamaId(val)}
            label="Siswa Utama Kasus *"
            placeholder="Cari nama atau NIS siswa..."
          />

          {/* Multi-select Pihak Terlibat */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Pihak / Siswa Lain yang Terlibat (Opsional)
            </label>

            <div className="flex flex-col sm:flex-row gap-2 mb-3">
              <div className="flex-1">
                <SearchSelectSiswa
                  options={allSiswaOptions.filter((s) => s.id !== siswaUtamaId)}
                  value={tempInvolvedSiswaId}
                  onChange={(val) => setTempInvolvedSiswaId(val)}
                  label=""
                  placeholder="Pilih siswa lain..."
                />
              </div>
              <input
                type="text"
                value={tempInvolvedPeran}
                onChange={(e) => setTempInvolvedPeran(e.target.value)}
                placeholder="Peran (Saksi/Korban/Terlapor)"
                className="px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-primary-500 outline-none sm:w-44 bg-white"
              />
              <button
                type="button"
                onClick={handleAddInvolved}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Tambah</span>
              </button>
            </div>

            {pihakTerlibatList.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-200">
                {pihakTerlibatList.map((p) => (
                  <div
                    key={p.siswaId}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <span className="font-bold text-slate-800">{p.nama}</span>
                    <span className="text-slate-400">({p.kelas})</span>
                    <span className="px-1.5 py-0.2 text-[10px] font-semibold bg-indigo-50 text-indigo-700 rounded">
                      {p.peran}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveInvolved(p.siswaId)}
                      className="text-slate-400 hover:text-rose-600 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Judul Kasus / Masalah Konseling *
            </label>
            <input
              type="text"
              value={judulKasus}
              onChange={(e) => setJudulKasus(e.target.value)}
              placeholder="Contoh: Mediasi perselisihan verbal di luar jam sekolah / Konseling penurunan motivasi belajar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Tanggal Kejadian *
              </label>
              <input
                type="date"
                value={tanggalKejadian}
                onChange={(e) => setTanggalKejadian(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition bg-white"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Status Kasus
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition bg-white"
              >
                <option value="BARU">Baru</option>
                <option value="PROSES">Dalam Pembinaan / Mediasi</option>
                <option value="SELESAI">Selesai</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Deskripsi Lengkap / Kronologi Kasus *
            </label>
            <textarea
              rows={4}
              value={deskripsiLengkap}
              onChange={(e) => setDeskripsiLengkap(e.target.value)}
              placeholder="Jelaskan latar belakang, kronologi kejadian, situasi siswa, atau hasil laporan dari pihak terkait..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Catatan Tindak Lanjut Pertama (Opsional)
            </label>
            <textarea
              rows={2}
              value={tindakLanjutAwal}
              onChange={(e) => setTindakLanjutAwal(e.target.value)}
              placeholder="Contoh: Pemanggilan siswa ke ruang BK jam istirahat untuk konseling individual..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md shadow-primary-200 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Kasus BK'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Single Case Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDeleteSingle}
        isLoading={isDeleting}
        title="Hapus Catatan Kasus"
        message="Apakah Anda yakin ingin menghapus catatan kasus ini beserta seluruh riwayat tindak lanjutnya?"
        confirmText="Ya, Hapus Kasus"
      />

      {/* Delete ALL Cases Dialog */}
      <ConfirmDialog
        isOpen={isDeletingAll}
        onClose={() => setIsDeletingAll(false)}
        onConfirm={handleDeleteAll}
        isLoading={isDeleting}
        title="Hapus SEMUA Data Kasus (Reset Total)"
        message="PERINGATAN: Tindakan ini akan menghapus SEMUA data kasus bimbingan dan seluruh log tindak lanjutnya di sistem. Data yang dihapus tidak dapat dikembalikan. Yakin ingin melanjutkan?"
        confirmText="Ya, Hapus Semua Kasus"
      />
    </div>
  );
};
