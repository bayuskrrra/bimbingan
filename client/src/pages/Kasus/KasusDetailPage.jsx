import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  FileText,
  Users,
  Calendar,
  Clock,
  CheckCircle2,
  Plus,
  Send,
  User,
  ShieldCheck,
  AlertCircle,
  Trash2,
} from 'lucide-react';
import api from '../../api/client';
import { Card, CardHeader } from '../../components/UI/Card';
import { StatusKasusBadge } from '../../components/UI/Badge';
import { ConfirmDialog, LoadingSpinner } from '../../components/UI/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export const KasusDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [kasus, setKasus] = useState(null);
  const [loading, setLoading] = useState(true);

  // New Follow-up log form
  const [catatan, setCatatan] = useState('');
  const [statusSetelah, setStatusSetelah] = useState('');
  const [tanggalTindakLanjut, setTanggalTindakLanjut] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchKasusDetail = async () => {
    try {
      const res = await api.get(`/kasus/${id}`);
      setKasus(res.data);
      setStatusSetelah(res.data?.status || 'PROSES');
    } catch (err) {
      showToast(err.message || 'Gagal memuat data kasus', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKasusDetail();
  }, [id]);

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.put(`/kasus/${id}/status`, { status: newStatus });
      showToast(`Status kasus diubah menjadi ${newStatus}`, 'success');
      fetchKasusDetail();
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui status', 'error');
    }
  };

  const handleAddTindakLanjut = async (e) => {
    e.preventDefault();
    if (!catatan.trim()) {
      showToast('Harap tuliskan catatan tindak lanjut', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.post(`/kasus/${id}/tindak-lanjut`, {
        catatan: catatan.trim(),
        tanggal: tanggalTindakLanjut,
        statusSetelah: statusSetelah || undefined,
      });

      showToast('Catatan tindak lanjut berhasil ditambahkan!', 'success');
      setCatatan('');
      fetchKasusDetail();
    } catch (err) {
      showToast(err.message || 'Gagal menambahkan tindak lanjut', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteKasus = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/kasus/${id}`);
      showToast('Kasus berhasil dihapus.', 'success');
      navigate('/kasus');
    } catch (err) {
      showToast(err.message || 'Gagal menghapus kasus', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner text="Memuat detail kasus dan riwayat tindak lanjut..." />;
  }

  if (!kasus) {
    return (
      <div className="p-8 text-center text-slate-500">
        Kasus tidak ditemukan.{' '}
        <button onClick={() => navigate('/kasus')} className="text-primary-600 font-bold underline ml-2">
          Kembali ke daftar kasus
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/kasus')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Kasus</span>
        </button>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <span className="text-xs font-bold text-slate-500 px-2">Status:</span>
            {['BARU', 'PROSES', 'SELESAI'].map((st) => (
              <button
                key={st}
                onClick={() => handleUpdateStatus(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                  kasus.status === st
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white'
                }`}
              >
                {st === 'BARU' ? 'Baru' : st === 'PROSES' ? 'Dalam Pembinaan' : 'Selesai'}
              </button>
            ))}
          </div>

          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="flex items-center gap-1 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Kasus</span>
          </button>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Kasus Info & Follow-up History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Narrative Card */}
          <Card>
            <div className="flex items-center justify-between gap-2 mb-3 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <StatusKasusBadge status={kasus.status} size="lg" />
                <span className="text-xs text-slate-400 font-medium">
                  Kejadian: {new Date(kasus.tanggalKejadian).toLocaleDateString('id-ID', { dateStyle: 'full' })}
                </span>
              </div>
            </div>

            <h1 className="text-xl font-black text-slate-900 tracking-tight mb-3">
              {kasus.judulKasus}
            </h1>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                Deskripsi Kasus & Kronologi Lengkap
              </div>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line font-normal">
                {kasus.deskripsiLengkap}
              </p>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
              <span>
                Dicatat pertama kali oleh: <strong className="text-slate-800">{kasus.dicatatOleh.nama}</strong>
              </span>
              <span>
                Dibuat pada: {new Date(kasus.createdAt).toLocaleDateString('id-ID')}
              </span>
            </div>
          </Card>

          {/* Append-only Follow-up Timeline */}
          <Card>
            <CardHeader
              title={`Riwayat Log Tindak Lanjut (${kasus.tindakLanjutList?.length || 0})`}
              subtitle="Catatan sesi konseling, mediasi, atau pemanggilan yang diarsipkan secara kronologis"
            />

            {/* Form Tambah Tindak Lanjut */}
            <form onSubmit={handleAddTindakLanjut} className="bg-primary-50/50 p-4 rounded-2xl border border-primary-100 mb-6 space-y-3">
              <div className="font-bold text-xs uppercase tracking-wider text-primary-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4" />
                <span>Tambah Catatan Tindak Lanjut Susulan</span>
              </div>

              <div>
                <textarea
                  rows={3}
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  placeholder="Tuliskan hasil mediasi, konseling individu, kesepakatan orang tua, atau perkembangan perilaku siswa..."
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition bg-white"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Tanggal Tindak Lanjut
                  </label>
                  <input
                    type="date"
                    value={tanggalTindakLanjut}
                    onChange={(e) => setTanggalTindakLanjut(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-primary-500 outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Update Status Kasus Setelahnya
                  </label>
                  <select
                    value={statusSetelah}
                    onChange={(e) => setStatusSetelah(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:border-primary-500 outline-none bg-white font-medium"
                  >
                    <option value="BARU">Status: Kasus Baru</option>
                    <option value="PROSES">Status: Dalam Pembinaan / Mediasi</option>
                    <option value="SELESAI">Status: Selesai</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex items-center gap-1.5 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-md shadow-primary-500/20 transition disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSubmitting ? 'Menyimpan...' : 'Simpan Tindak Lanjut'}</span>
                </button>
              </div>
            </form>

            {/* List Logs */}
            {kasus.tindakLanjutList?.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-xs">
                Belum ada catatan tindak lanjut susulan.
              </div>
            ) : (
              <div className="relative border-l-2 border-primary-200 ml-4 pl-5 space-y-4">
                {kasus.tindakLanjutList.map((log) => (
                  <div key={log.id} className="relative group">
                    <div className="absolute -left-[27px] top-1 w-3.5 h-3.5 rounded-full bg-primary-600 ring-4 ring-primary-100 border-2 border-white" />
                    <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-sm space-y-1.5">
                      <div className="flex items-center justify-between text-xs text-slate-400">
                        <span className="font-semibold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary-600" />
                          {new Date(log.tanggal).toLocaleDateString('id-ID', {
                            weekday: 'long',
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </span>
                        {log.statusSetelah && <StatusKasusBadge status={log.statusSetelah} size="sm" />}
                      </div>

                      <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-line">
                        {log.catatan}
                      </p>

                      <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-100">
                        Dicatat oleh: <strong className="text-slate-700">{log.dicatatOleh.nama}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column: Involved Parties */}
        <div className="space-y-6">
          {/* Siswa Utama Card */}
          <Card>
            <CardHeader title="Siswa Utama Kasus" />
            <div
              onClick={() => navigate(`/siswa/${kasus.siswaUtama.id}`)}
              className="flex items-start gap-3 p-3.5 rounded-xl border border-slate-200 hover:border-primary-400 hover:bg-primary-50/20 cursor-pointer transition"
            >
              <div className="w-10 h-10 rounded-xl bg-primary-100 text-primary-700 flex items-center justify-center font-bold text-sm flex-shrink-0">
                {kasus.siswaUtama.nama.slice(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm hover:text-primary-600 transition">
                  {kasus.siswaUtama.nama}
                </div>
                <div className="text-xs text-slate-500">
                  Kelas {kasus.siswaUtama.kelas} &bull; NIS: {kasus.siswaUtama.nis}
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Wali: {kasus.siswaUtama.namaWali} ({kasus.siswaUtama.kontakWali})
                </div>
              </div>
            </div>
          </Card>

          {/* Pihak Terlibat Lainnya */}
          <Card>
            <CardHeader
              title={`Siswa Lain Terlibat (${kasus.pihakTerlibat?.length || 0})`}
              subtitle="Siswa yang berstatus sebagai saksi, korban, atau terlapor bersama"
            />

            {kasus.pihakTerlibat?.length === 0 ? (
              <div className="p-4 text-center text-slate-400 text-xs">
                Tidak ada pihak lain yang dilibatkan dalam kasus ini.
              </div>
            ) : (
              <div className="space-y-2.5">
                {kasus.pihakTerlibat.map((pt) => (
                  <div
                    key={pt.id}
                    onClick={() => navigate(`/siswa/${pt.siswa.id}`)}
                    className="flex items-center justify-between p-3 rounded-xl border border-slate-200/80 hover:bg-slate-50 transition cursor-pointer"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900">{pt.siswa.nama}</div>
                      <div className="text-[11px] text-slate-400">
                        {pt.siswa.kelas} &bull; NIS: {pt.siswa.nis}
                      </div>
                    </div>
                    <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100">
                      {pt.peran || 'Terlibat'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleDeleteKasus}
        isLoading={isDeleting}
        title="Hapus Kasus Ini"
        message="Apakah Anda yakin ingin menghapus kasus ini secara permanen beserta semua riwayat tindak lanjutnya?"
        confirmText="Ya, Hapus"
      />
    </div>
  );
};
