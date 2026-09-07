import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  AlertOctagon,
  Plus,
  Edit2,
  Trash2,
  Save,
} from 'lucide-react';
import api from '../../api/client';
import { Card, CardHeader } from '../../components/UI/Card';
import { Modal } from '../../components/UI/Modal';
import { KategoriPelanggaranBadge } from '../../components/UI/Badge';
import { ConfirmDialog, LoadingSpinner } from '../../components/UI/ConfirmDialog';
import { useToast } from '../../context/ToastContext';

export const PengaturanPage = () => {
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('THRESHOLDS'); // THRESHOLDS | MASTER_PELANGGARAN
  const [loading, setLoading] = useState(true);

  // Thresholds State
  const [thresholds, setThresholds] = useState({ amanMax: 25, perhatianMax: 50, peringatanMax: 75 });
  const [savingThresholds, setSavingThresholds] = useState(false);

  // Master Jenis Pelanggaran State
  const [jenisList, setJenisList] = useState([]);
  const [isJenisModalOpen, setIsJenisModalOpen] = useState(false);
  const [editingJenis, setEditingJenis] = useState(null);
  const [jenisForm, setJenisForm] = useState({ namaPelanggaran: '', kategori: 'RINGAN', poin: 5 });
  const [deletingJenisId, setDeletingJenisId] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [pengaturanRes, jenisRes] = await Promise.all([
        api.get('/pengaturan'),
        api.get('/jenis-pelanggaran'),
      ]);

      if (pengaturanRes.data?.threshold_poin) {
        setThresholds(pengaturanRes.data.threshold_poin);
      }
      setJenisList(jenisRes.data || []);
    } catch (err) {
      showToast(err.message || 'Gagal memuat pengaturan', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handler: Save Thresholds
  const handleSaveThresholds = async (e) => {
    e.preventDefault();
    if (thresholds.amanMax >= thresholds.perhatianMax || thresholds.perhatianMax >= thresholds.peringatanMax) {
      showToast('Nilai threshold harus berurutan: Aman < Perhatian < Peringatan', 'error');
      return;
    }

    setSavingThresholds(true);
    try {
      await api.put('/pengaturan/thresholds', thresholds);
      showToast('Batas threshold akumulasi poin berhasil diperbarui!', 'success');
    } catch (err) {
      showToast(err.message || 'Gagal memperbarui threshold', 'error');
    } finally {
      setSavingThresholds(false);
    }
  };

  // Handler: Master Jenis Pelanggaran
  const handleOpenJenisModal = (item = null) => {
    if (item) {
      setEditingJenis(item);
      setJenisForm({
        namaPelanggaran: item.namaPelanggaran,
        kategori: item.kategori,
        poin: item.poin,
      });
    } else {
      setEditingJenis(null);
      setJenisForm({
        namaPelanggaran: '',
        kategori: 'RINGAN',
        poin: 5,
      });
    }
    setIsJenisModalOpen(true);
  };

  const handleSaveJenis = async (e) => {
    e.preventDefault();
    try {
      if (editingJenis) {
        await api.put(`/jenis-pelanggaran/${editingJenis.id}`, jenisForm);
        showToast('Master jenis pelanggaran berhasil diperbarui!', 'success');
      } else {
        await api.post('/jenis-pelanggaran', jenisForm);
        showToast('Master jenis pelanggaran baru berhasil ditambahkan!', 'success');
      }
      setIsJenisModalOpen(false);
      const res = await api.get('/jenis-pelanggaran');
      setJenisList(res.data || []);
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan jenis pelanggaran', 'error');
    }
  };

  const handleDeleteJenis = async () => {
    try {
      await api.delete(`/jenis-pelanggaran/${deletingJenisId}`);
      showToast('Master jenis pelanggaran berhasil dihapus', 'success');
      setDeletingJenisId(null);
      const res = await api.get('/jenis-pelanggaran');
      setJenisList(res.data || []);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus jenis pelanggaran', 'error');
    }
  };

  if (loading) {
    return <LoadingSpinner text="Memuat konfigurasi sistem..." />;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Pengaturan Sistem &amp; Master Data
        </h1>
        <p className="text-sm text-slate-500 mt-0.5">
          Kelola ambang batas poin risiko siswa dan master jenis pelanggaran
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('THRESHOLDS')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'THRESHOLDS'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          <span>Threshold Akumulasi Poin</span>
        </button>

        <button
          onClick={() => setActiveTab('MASTER_PELANGGARAN')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'MASTER_PELANGGARAN'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Master Pelanggaran ({jenisList.length})</span>
        </button>
      </div>

      {/* TAB 1: THRESHOLDS */}
      {activeTab === 'THRESHOLDS' && (
        <Card className="max-w-3xl space-y-6">
          <CardHeader
            title="Konfigurasi Ambang Batas Poin Risiko Siswa"
            subtitle="Sistem secara otomatis mengklasifikasikan siswa ke dalam zona risiko berdasarkan batas poin ini"
          />

          <form onSubmit={handleSaveThresholds} className="space-y-5">
            <div className="space-y-4">
              {/* Zona Aman */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200">
                <div>
                  <div className="font-bold text-emerald-900 text-sm">1. Zona Aman (Hijau)</div>
                  <div className="text-xs text-emerald-700 mt-0.5">
                    Batas toleransi wajar pelanggaran ringan harian.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">0 s/d</span>
                  <input
                    type="number"
                    min="1"
                    value={thresholds.amanMax}
                    onChange={(e) =>
                      setThresholds({ ...thresholds, amanMax: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 font-black text-center text-sm outline-none focus:border-primary-500 bg-white"
                    required
                  />
                  <span className="text-xs font-bold text-slate-600">Poin</span>
                </div>
              </div>

              {/* Zona Perhatian */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-amber-50/60 border border-amber-200">
                <div>
                  <div className="font-bold text-amber-900 text-sm">2. Zona Perlu Perhatian (Kuning)</div>
                  <div className="text-xs text-amber-700 mt-0.5">
                    Peringatan lisan / pembinaan awal oleh wali kelas dan guru BK.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">{thresholds.amanMax + 1} s/d</span>
                  <input
                    type="number"
                    min={thresholds.amanMax + 1}
                    value={thresholds.perhatianMax}
                    onChange={(e) =>
                      setThresholds({ ...thresholds, perhatianMax: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 font-black text-center text-sm outline-none focus:border-primary-500 bg-white"
                    required
                  />
                  <span className="text-xs font-bold text-slate-600">Poin</span>
                </div>
              </div>

              {/* Zona Peringatan */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-orange-50/60 border border-orange-200">
                <div>
                  <div className="font-bold text-orange-900 text-sm">3. Zona Peringatan (Oranye)</div>
                  <div className="text-xs text-orange-700 mt-0.5">
                    Penerbitan Surat Peringatan 1 / Pemanggilan Orang Tua ke sekolah.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-600">{thresholds.perhatianMax + 1} s/d</span>
                  <input
                    type="number"
                    min={thresholds.perhatianMax + 1}
                    value={thresholds.peringatanMax}
                    onChange={(e) =>
                      setThresholds({ ...thresholds, peringatanMax: parseInt(e.target.value, 10) || 0 })
                    }
                    className="w-20 px-3 py-1.5 rounded-xl border border-slate-300 font-black text-center text-sm outline-none focus:border-primary-500 bg-white"
                    required
                  />
                  <span className="text-xs font-bold text-slate-600">Poin</span>
                </div>
              </div>

              {/* Zona Berat */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-2xl bg-rose-50/60 border border-rose-200">
                <div>
                  <div className="font-bold text-rose-900 text-sm">4. Zona Tindak Lanjut Berat (Merah)</div>
                  <div className="text-xs text-rose-700 mt-0.5">
                    Konferensi kasus, skorsing, atau rekomendasi tindakan dewan guru.
                  </div>
                </div>
                <div className="text-xs font-black text-rose-700">
                  Lebih dari {thresholds.peringatanMax} Poin (Otomatis)
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={savingThresholds}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-bold shadow-md shadow-primary-600/30 transition disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{savingThresholds ? 'Menyimpan...' : 'Simpan Pengaturan Threshold'}</span>
              </button>
            </div>
          </form>
        </Card>
      )}

      {/* TAB 2: MASTER PELANGGARAN */}
      {activeTab === 'MASTER_PELANGGARAN' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-800">Daftar Master Jenis Pelanggaran</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Kategori dan bobot poin standar yang dijadikan rujukan saat mencatat insiden
              </p>
            </div>
            <button
              onClick={() => handleOpenJenisModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Master</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4">Nama Pelanggaran</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Bobot Poin</th>
                  <th className="py-3 px-4 text-center">Digunakan</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {jenisList.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-800">{item.namaPelanggaran}</td>
                    <td className="py-3.5 px-4">
                      <KategoriPelanggaranBadge kategori={item.kategori} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 font-black text-rose-600">+{item.poin} Poin</td>
                    <td className="py-3.5 px-4 text-center text-xs text-slate-500">
                      {item._count?.pelanggaranSiswa || 0} Kali
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => handleOpenJenisModal(item)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeletingJenisId(item.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal Jenis Pelanggaran */}
      <Modal
        isOpen={isJenisModalOpen}
        onClose={() => setIsJenisModalOpen(false)}
        title={editingJenis ? 'Edit Master Jenis Pelanggaran' : 'Tambah Jenis Pelanggaran'}
      >
        <form onSubmit={handleSaveJenis} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Nama Pelanggaran
            </label>
            <input
              type="text"
              value={jenisForm.namaPelanggaran}
              onChange={(e) => setJenisForm({ ...jenisForm, namaPelanggaran: e.target.value })}
              placeholder="Contoh: Terlambat masuk sekolah (> 15 menit)"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 text-sm outline-none"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kategori
              </label>
              <select
                value={jenisForm.kategori}
                onChange={(e) => setJenisForm({ ...jenisForm, kategori: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 text-sm outline-none bg-white"
              >
                <option value="RINGAN">Ringan</option>
                <option value="SEDANG">Sedang</option>
                <option value="BERAT">Berat</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Bobot Poin
              </label>
              <input
                type="number"
                min="1"
                value={jenisForm.poin}
                onChange={(e) =>
                  setJenisForm({ ...jenisForm, poin: parseInt(e.target.value, 10) || 1 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 text-sm outline-none font-bold"
                required
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsJenisModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-sm font-semibold text-white bg-primary-600 hover:bg-primary-700 rounded-xl shadow-md"
            >
              Simpan Master
            </button>
          </div>
        </form>
      </Modal>

      {/* Delete Jenis Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingJenisId)}
        onClose={() => setDeletingJenisId(null)}
        onConfirm={handleDeleteJenis}
        title="Hapus Master Pelanggaran"
        message="Apakah Anda yakin ingin menghapus master jenis pelanggaran ini? Jika sudah digunakan pada transaksi siswa, data tidak dapat dihapus."
        confirmText="Ya, Hapus Master"
      />
    </div>
  );
};
