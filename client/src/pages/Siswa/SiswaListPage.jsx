import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Search,
  Plus,
  Filter,
  Eye,
  Edit2,
  Trash2,
  Phone,
  ArrowUpDown,
  RefreshCw,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../../api/client';
import { Card } from '../../components/UI/Card';
import { Modal } from '../../components/UI/Modal';
import { ZoneBadge } from '../../components/UI/Badge';
import { Pagination } from '../../components/UI/Pagination';
import { ConfirmDialog, LoadingSpinner } from '../../components/UI/ConfirmDialog';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../context/AuthContext';

const siswaSchema = z.object({
  nama: z.string().min(2, 'Nama siswa minimal 2 karakter'),
  nis: z.string().min(3, 'NIS minimal 3 karakter'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  jenisKelamin: z.enum(['L', 'P']),
  namaWali: z.string().min(2, 'Nama wali wajib diisi'),
  kontakWali: z.string().min(5, 'Kontak wali wajib diisi'),
});

export const SiswaListPage = () => {
  const [siswaList, setSiswaList] = useState([]);
  const [classList, setClassList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [search, setSearch] = useState('');
  const [selectedClass, setSelectedClass] = useState('SEMUA');
  const [selectedZone, setSelectedZone] = useState('SEMUA');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSiswa, setEditingSiswa] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const { showToast } = useToast();
  const { isAdmin } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(siswaSchema),
    defaultValues: {
      jenisKelamin: 'L',
    },
  });

  const fetchClasses = async () => {
    try {
      const res = await api.get('/siswa/kelas');
      setClassList(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSiswa = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', page.toString());
      params.append('limit', '10');
      if (search) params.append('search', search);
      if (selectedClass !== 'SEMUA') params.append('kelas', selectedClass);
      if (selectedZone !== 'SEMUA') params.append('zona', selectedZone);

      const res = await api.get(`/siswa?${params.toString()}`);
      setSiswaList(res.data || []);
      if (res.pagination) {
        setPagination(res.pagination);
      }
    } catch (err) {
      showToast(err.message || 'Gagal memuat data siswa', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, selectedClass, selectedZone, showToast]);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchSiswa(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [fetchSiswa]);

  const handleOpenAddModal = () => {
    setEditingSiswa(null);
    reset({
      nama: '',
      nis: '',
      kelas: '',
      jenisKelamin: 'L',
      namaWali: '',
      kontakWali: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (siswa) => {
    setEditingSiswa(siswa);
    setValue('nama', siswa.nama);
    setValue('nis', siswa.nis);
    setValue('kelas', siswa.kelas);
    setValue('jenisKelamin', siswa.jenisKelamin);
    setValue('namaWali', siswa.namaWali);
    setValue('kontakWali', siswa.kontakWali);
    setIsModalOpen(true);
  };

  const onSubmitForm = async (data) => {
    try {
      if (editingSiswa) {
        await api.put(`/siswa/${editingSiswa.id}`, data);
        showToast('Data siswa berhasil diperbarui!', 'success');
      } else {
        await api.post('/siswa', data);
        showToast('Data siswa baru berhasil ditambahkan!', 'success');
      }
      setIsModalOpen(false);
      fetchSiswa(pagination.page);
      fetchClasses();
    } catch (err) {
      showToast(err.message || 'Gagal menyimpan data siswa', 'error');
    }
  };

  const handleDelete = async () => {
    if (!deletingId) return;
    setIsDeleting(true);
    try {
      await api.delete(`/siswa/${deletingId}`);
      showToast('Data siswa berhasil dihapus.', 'success');
      setDeletingId(null);
      fetchSiswa(pagination.page);
    } catch (err) {
      showToast(err.message || 'Gagal menghapus siswa', 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Data Siswa</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Daftar seluruh siswa terdaftar beserta kalkulasi akumulasi poin kedisiplinan
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-semibold shadow-md shadow-primary-600/30 transition text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Siswa Baru</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama atau NIS..."
              className="w-full pl-10 pr-4 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition"
            />
          </div>

          {/* Filter Kelas */}
          <div className="relative">
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

          {/* Filter Zona Risiko */}
          <div className="relative">
            <select
              value={selectedZone}
              onChange={(e) => setSelectedZone(e.target.value)}
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-slate-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 outline-none transition bg-white"
            >
              <option value="SEMUA">Semua Status Zona</option>
              <option value="AMAN">Zona Aman</option>
              <option value="PERHATIAN">Zona Perlu Perhatian</option>
              <option value="PERINGATAN">Zona Peringatan</option>
              <option value="BERAT">Zona Tindak Lanjut Berat</option>
            </select>
          </div>

          {/* Reset Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setSearch('');
                setSelectedClass('SEMUA');
                setSelectedZone('SEMUA');
              }}
              className="w-full px-3.5 py-2 text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset Filter</span>
            </button>
          </div>
        </div>
      </Card>

      {/* Table Card */}
      <Card className="p-0 overflow-hidden">
        {loading ? (
          <LoadingSpinner text="Memuat daftar siswa..." />
        ) : siswaList.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-sm">
            Tidak ditemukan data siswa sesuai filter pencarian.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3.5 px-4">NIS</th>
                  <th className="py-3.5 px-4">Nama Lengkap</th>
                  <th className="py-3.5 px-4">Kelas</th>
                  <th className="py-3.5 px-4">L/P</th>
                  <th className="py-3.5 px-4">Akumulasi Poin</th>
                  <th className="py-3.5 px-4">Status Zona</th>
                  <th className="py-3.5 px-4">Wali & Kontak</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {siswaList.map((siswa) => (
                  <tr
                    key={siswa.id}
                    className="hover:bg-slate-50/80 transition cursor-pointer"
                    onClick={() => navigate(`/siswa/${siswa.id}`)}
                  >
                    <td className="py-3.5 px-4 font-mono text-xs font-bold text-slate-600">{siswa.nis}</td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <div className="hover:text-primary-600 transition">{siswa.nama}</div>
                      {siswa.kasusAktifCount > 0 && (
                        <span className="text-[10px] font-semibold text-indigo-600">
                          &bull; {siswa.kasusAktifCount} Kasus Aktif
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700">{siswa.kelas}</td>
                    <td className="py-3.5 px-4 font-medium text-slate-600">{siswa.jenisKelamin}</td>
                    <td className="py-3.5 px-4 font-black text-slate-900">
                      <span className="text-base">{siswa.totalPoin}</span>{' '}
                      <span className="text-xs text-slate-400 font-normal">Poin</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <ZoneBadge zoneInfo={siswa.zoneInfo} size="sm" />
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600">
                      <div className="font-semibold text-slate-800">{siswa.namaWali}</div>
                      <div className="text-slate-400 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3" /> {siswa.kontakWali}
                      </div>
                    </td>
                    <td
                      className="py-3.5 px-4 text-center"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/siswa/${siswa.id}`)}
                          title="Lihat Detail Profil"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-primary-600 hover:bg-primary-50 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(siswa)}
                          title="Edit Siswa"
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {isAdmin && (
                          <button
                            onClick={() => setDeletingId(siswa.id)}
                            title="Hapus Siswa"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
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
          onPageChange={(p) => fetchSiswa(p)}
        />
      </Card>

      {/* Modal Tambah / Edit Siswa */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingSiswa ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}
      >
        <form onSubmit={handleSubmit(onSubmitForm)} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nama Lengkap Siswa
              </label>
              <input
                type="text"
                {...register('nama')}
                placeholder="Contoh: Budi Santoso"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
              />
              {errors.nama && <p className="text-xs text-rose-600 mt-1">{errors.nama.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nomor Induk Siswa (NIS)
              </label>
              <input
                type="text"
                {...register('nis')}
                placeholder="Contoh: 20241001"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
              />
              {errors.nis && <p className="text-xs text-rose-600 mt-1">{errors.nis.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kelas
              </label>
              <input
                type="text"
                {...register('kelas')}
                placeholder="Contoh: X-MIPA-1, XI-IPS-2"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
              />
              {errors.kelas && <p className="text-xs text-rose-600 mt-1">{errors.kelas.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Jenis Kelamin
              </label>
              <select
                {...register('jenisKelamin')}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition bg-white"
              >
                <option value="L">Laki-laki (L)</option>
                <option value="P">Perempuan (P)</option>
              </select>
              {errors.jenisKelamin && <p className="text-xs text-rose-600 mt-1">{errors.jenisKelamin.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Nama Orang Tua / Wali
              </label>
              <input
                type="text"
                {...register('namaWali')}
                placeholder="Contoh: Bambang Santoso"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
              />
              {errors.namaWali && <p className="text-xs text-rose-600 mt-1">{errors.namaWali.message}</p>}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Kontak / No HP Wali (WhatsApp)
              </label>
              <input
                type="text"
                {...register('kontakWali')}
                placeholder="Contoh: 081234567890"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 text-sm outline-none transition"
              />
              {errors.kontakWali && <p className="text-xs text-rose-600 mt-1">{errors.kontakWali.message}</p>}
            </div>
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
              {isSubmitting ? 'Menyimpan...' : editingSiswa ? 'Simpan Perubahan' : 'Tambah Siswa'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={Boolean(deletingId)}
        onClose={() => setDeletingId(null)}
        onConfirm={handleDelete}
        isLoading={isDeleting}
        title="Hapus Data Siswa"
        message="Apakah Anda yakin ingin menghapus data siswa ini? Semua riwayat pelanggaran dan kasus yang terkait juga akan terhapus."
        confirmText="Ya, Hapus Siswa"
      />
    </div>
  );
};
