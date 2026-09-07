import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Phone,
  Calendar,
  AlertOctagon,
  FileText,
  FileDown,
  ExternalLink,
  Clock,
  ShieldCheck,
  AlertTriangle,
  MessageSquare,
  BookOpen,
} from 'lucide-react';
import api from '../../api/client';
import { Card, CardHeader } from '../../components/UI/Card';
import { ZoneBadge, KategoriPelanggaranBadge, StatusKasusBadge } from '../../components/UI/Badge';
import { LoadingSpinner } from '../../components/UI/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

export const SiswaDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [siswa, setSiswa] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('TIMELINE');

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/siswa/${id}`);
        setSiswa(res.data);
      } catch (err) {
        showToast(err.message || 'Gagal memuat profil siswa', 'error');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id, showToast]);

  if (loading) {
    return <LoadingSpinner text="Memuat profil dan rekapitulasi siswa..." />;
  }

  if (!siswa) {
    return (
      <div className="p-8 text-center text-slate-500">
        Data siswa tidak ditemukan.{' '}
        <button onClick={() => navigate('/siswa')} className="text-primary-600 font-bold underline ml-2">
          Kembali ke daftar siswa
        </button>
      </div>
    );
  }

  const { totalPoin, zoneInfo, timeline = [], pelanggaran = [], kasusUtama = [] } = siswa;

  const handleDownloadPdf = () => {
    const token = localStorage.getItem('guru_bk_token') || 'direct';
    window.open(`/api/laporan/pdf?siswaId=${siswa.id}&token=${token}`, '_blank');
  };

  const handleWhatsApp = () => {
    let cleanPhone = siswa.kontakWali.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.slice(1);
    }
    const message = encodeURIComponent(
      `Yth. Bapak/Ibu ${siswa.namaWali} (Orang Tua dari ${siswa.nama} kelas ${siswa.kelas}), kami dari Bimbingan Konseling Sekolah ingin menginformasikan perihal kedisiplinan siswa yang saat ini telah mengumpulkan akumulasi skor ${totalPoin} poin. Tindakan penanganan: ${zoneInfo?.penanganan || zoneInfo?.description}.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Navigation and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <button
          onClick={() => navigate('/siswa')}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 transition self-start"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Data Siswa</span>
        </button>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleDownloadPdf}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm transition"
          >
            <FileDown className="w-4 h-4 text-primary-600" />
            <span>Cetak PDF Siswa</span>
          </button>
          <button
            onClick={() => navigate(`/pelanggaran?siswaId=${siswa.id}&openAdd=true`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition"
          >
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <span>+ Catat Pelanggaran</span>
          </button>
          <button
            onClick={() => navigate(`/kasus?siswaId=${siswa.id}&openAdd=true`)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 shadow-sm shadow-primary-500/30 transition"
          >
            <FileText className="w-4 h-4" />
            <span>+ Catat Kasus BK</span>
          </button>
        </div>
      </div>

      {/* Student Profile Card & Point Risk Zone */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-2">
          <div className="flex flex-col sm:flex-row items-start gap-5">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-primary-600 to-indigo-600 text-white flex items-center justify-center font-black text-2xl shadow-lg shadow-primary-500/20 flex-shrink-0">
              {siswa.nama.slice(0, 2).toUpperCase()}
            </div>

            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-xl font-black text-slate-900">{siswa.nama}</h2>
                <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                  Kelas {siswa.kelas}
                </span>
                <span className="px-2 py-0.5 text-xs font-semibold bg-slate-100 text-slate-700 rounded-md">
                  NIS: {siswa.nis}
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Jenis Kelamin: {siswa.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} &bull; Terdaftar di sistem BK
              </p>

              {/* Guardian Info */}
              <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-xl">
                  <div className="text-slate-400 font-semibold mb-0.5">Nama Orang Tua / Wali</div>
                  <div className="font-bold text-slate-800 text-sm">{siswa.namaWali}</div>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="text-slate-400 font-semibold mb-0.5">Kontak Wali</div>
                    <div className="font-bold text-slate-800 text-sm">{siswa.kontakWali}</div>
                  </div>
                  <button
                    onClick={handleWhatsApp}
                    title="Hubungi via WhatsApp"
                    className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] shadow-sm transition"
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Pasal 19 Action Tier Card */}
        <Card className={`flex flex-col justify-between ${zoneInfo?.bgClass || 'bg-slate-50'}`}>
          <div>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Ketentuan Penanganan (Pasal 19)
              </span>
              <ZoneBadge zoneInfo={zoneInfo} />
            </div>

            <div className="mt-4">
              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900">{totalPoin}</span>
                <span className="text-sm font-semibold text-slate-600">Total Skor Poin</span>
              </div>
              <div className="mt-3 p-3 rounded-xl bg-white/80 border border-slate-200/80 shadow-xs">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-1">
                  Instruksi Penanganan Resmi:
                </div>
                <p className="text-xs font-semibold text-slate-900 leading-relaxed">
                  {zoneInfo?.penanganan || zoneInfo?.description}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-200/60">
            <div className="text-[11px] font-bold text-slate-500 mb-1 flex justify-between">
              <span>Batas Maksimal (Dikeluarkan): 30 Skor</span>
              <span>{Math.min(totalPoin, 30)} / 30</span>
            </div>
            <div className="w-full bg-slate-200/80 rounded-full h-3 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((totalPoin / 30) * 100, 100)}%`,
                  backgroundColor: zoneInfo?.ringColor || '#10b981',
                }}
              />
            </div>
          </div>
        </Card>
      </div>

      {/* Tabs Header */}
      <div className="flex border-b border-slate-200 gap-2">
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'TIMELINE'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Timeline Terpadu ({timeline.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PELANGGARAN')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'PELANGGARAN'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <AlertOctagon className="w-4 h-4" />
          <span>Pelanggaran Tata Tertib ({pelanggaran.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('KASUS')}
          className={`pb-3 px-4 text-sm font-bold transition border-b-2 flex items-center gap-2 ${
            activeTab === 'KASUS'
              ? 'border-primary-600 text-primary-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Kasus Konseling BK ({kasusUtama.length})</span>
        </button>
      </div>

      {/* TAB CONTENT: TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <Card>
          <CardHeader
            title="Riwayat Kronologis Terpadu"
            subtitle="Histori gabungan pelanggaran tata tertib dan kasus bimbingan konseling siswa"
          />

          {timeline.length === 0 ? (
            <div className="p-12 text-center text-slate-400 text-sm">
              Belum ada catatan aktivitas pelanggaran atau kasus untuk siswa ini.
            </div>
          ) : (
            <div className="relative border-l-2 border-slate-200 ml-4 pl-6 space-y-6 my-4">
              {timeline.map((item, idx) => {
                const isPelanggaran = item.type === 'PELANGGARAN';
                const isKasusUtama = item.type === 'KASUS_UTAMA';

                return (
                  <div key={idx} className="relative group">
                    <div
                      className={`absolute -left-[31px] top-1.5 w-4 h-4 rounded-full border-2 border-white ring-4 ${
                        isPelanggaran
                          ? 'bg-amber-500 ring-amber-100'
                          : isKasusUtama
                          ? 'bg-indigo-600 ring-indigo-100'
                          : 'bg-blue-400 ring-blue-100'
                      }`}
                    />

                    <div className="bg-slate-50/80 rounded-2xl p-4 border border-slate-200/70 hover:bg-white hover:shadow-md transition">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-md ${
                              isPelanggaran
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-indigo-100 text-indigo-800'
                            }`}
                          >
                            {isPelanggaran ? 'Pelanggaran Tata Tertib' : 'Kasus Bimbingan'}
                          </span>
                          <span className="text-xs text-slate-400 font-medium">
                            {new Date(item.tanggal).toLocaleDateString('id-ID', {
                              weekday: 'long',
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric',
                            })}
                          </span>
                        </div>

                        {isPelanggaran && (
                          <div className="flex items-center gap-2">
                            <KategoriPelanggaranBadge kategori={item.kategori} size="sm" />
                            <span className="text-sm font-black text-rose-600">+{item.poin} Skor</span>
                          </div>
                        )}

                        {isKasusUtama && (
                          <div className="flex items-center gap-2">
                            <StatusKasusBadge status={item.status} size="sm" />
                          </div>
                        )}
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mb-1">{item.judul}</h4>

                      {item.keterangan && (
                        <p className="text-xs text-slate-600 mb-2 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                          {item.keterangan}
                        </p>
                      )}

                      {item.deskripsi && (
                        <p className="text-xs text-slate-600 mb-2 leading-relaxed bg-white p-2.5 rounded-xl border border-slate-100">
                          {item.deskripsi}
                        </p>
                      )}

                      <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100/80">
                        <span>Dicatat oleh: <strong className="text-slate-700">{item.dicatatOleh}</strong></span>
                        {isKasusUtama && (
                          <button
                            onClick={() => navigate(`/kasus/${item.id}`)}
                            className="text-primary-600 font-bold hover:underline flex items-center gap-1"
                          >
                            Lihat Detail & Tindak Lanjut ({item.tindakLanjutCount}) &rarr;
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      )}

      {/* TAB CONTENT: PELANGGARAN */}
      {activeTab === 'PELANGGARAN' && (
        <Card className="p-0 overflow-hidden">
          <div className="p-4 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Daftar Pelanggaran Tata Tertib Siswa (Pasal 18)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider bg-slate-50/70">
                  <th className="py-3 px-4">Tanggal</th>
                  <th className="py-3 px-4">Nama Pelanggaran</th>
                  <th className="py-3 px-4">Kategori</th>
                  <th className="py-3 px-4">Skor Poin</th>
                  <th className="py-3 px-4">Keterangan</th>
                  <th className="py-3 px-4">Dicatat Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pelanggaran.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 text-xs text-slate-600 font-mono">
                      {new Date(p.tanggal).toLocaleDateString('id-ID')}
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-800">{p.jenisPelanggaran.namaPelanggaran}</td>
                    <td className="py-3 px-4">
                      <KategoriPelanggaranBadge kategori={p.jenisPelanggaran.kategori} size="sm" />
                    </td>
                    <td className="py-3 px-4 font-black text-rose-600">+{p.poinSaatItu} Skor</td>
                    <td className="py-3 px-4 text-xs text-slate-600">{p.keteranganTambahan || '-'}</td>
                    <td className="py-3 px-4 text-xs font-medium text-slate-700">{p.dicatatOleh.nama}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* TAB CONTENT: KASUS */}
      {activeTab === 'KASUS' && (
        <div className="space-y-4">
          {kasusUtama.length === 0 ? (
            <Card>
              <div className="p-8 text-center text-slate-400 text-sm">
                Tidak ada kasus konseling tercatat untuk siswa ini.
              </div>
            </Card>
          ) : (
            kasusUtama.map((k) => (
              <Card key={k.id} hover onClick={() => navigate(`/kasus/${k.id}`)}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <StatusKasusBadge status={k.status} />
                    <span className="text-xs text-slate-400 font-medium">
                      Kejadian: {new Date(k.tanggalKejadian).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-primary-600 flex items-center gap-1">
                    Buka Kasus <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 mb-2">{k.judulKasus}</h3>
                <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-3">
                  {k.deskripsiLengkap}
                </p>

                <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
                  <span>Dicatat oleh: <strong>{k.dicatatOleh.nama}</strong></span>
                  <span className="font-semibold text-indigo-600">
                    {k.tindakLanjutList?.length || 0} Riwayat Tindak Lanjut
                  </span>
                </div>
              </Card>
            ))
          )}
        </div>
      )}
    </div>
  );
};
