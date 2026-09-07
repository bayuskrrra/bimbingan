import prisma from '../prisma.js';

export const OFFICIAL_THRESHOLDS = {
  tier1: 1,  // Peringatan lisan
  tier2: 2,  // Peringatan dengan sanksi ringan
  tier3: 4,  // Surat perjanjian siswa + wali kelas
  tier4: 6,  // Surat perjanjian siswa + ortu + walas + guru BK
  tier5: 8,  // Surat perjanjian siswa + ortu + walas + guru BK + Kepsek
  tier6: 10, // Surat pernyataan + skorsing belajar di rumah
  tierMax: 30, // Dikembalikan ke orang tua / dikeluarkan
};

export async function getThresholdSettings() {
  try {
    const setting = await prisma.pengaturan.findUnique({
      where: { key: 'threshold_poin' },
    });

    if (setting && setting.value) {
      return JSON.parse(setting.value);
    }
  } catch (err) {
    console.error('Error fetching threshold settings:', err);
  }
  return OFFICIAL_THRESHOLDS;
}

export function evaluatePointZone(totalPoin, thresholds = OFFICIAL_THRESHOLDS) {
  if (totalPoin === 0) {
    return {
      zone: 'AMAN',
      label: '0 Poin (Tertib)',
      color: 'emerald',
      bgClass: 'bg-emerald-50 text-emerald-800 border-emerald-200',
      badgeClass: 'bg-emerald-500 text-white',
      ringColor: '#10b981',
      penanganan: 'Tidak ada sanksi / Kondisi aman dan tertib.',
      description: 'Siswa belum memiliki catatan pelanggaran.',
    };
  } else if (totalPoin === 1) {
    return {
      zone: 'PERINGATAN_1',
      label: 'Skor 1 (Peringatan)',
      color: 'blue',
      bgClass: 'bg-blue-50 text-blue-800 border-blue-200',
      badgeClass: 'bg-blue-500 text-white',
      ringColor: '#3b82f6',
      penanganan: 'Peringatan lisan oleh guru piket / wali kelas.',
      description: 'Peringatan',
    };
  } else if (totalPoin < 4) {
    return {
      zone: 'SANKSI_RINGAN',
      label: `Skor ${totalPoin} (Sanksi Ringan)`,
      color: 'amber',
      bgClass: 'bg-amber-50 text-amber-800 border-amber-200',
      badgeClass: 'bg-amber-500 text-white',
      ringColor: '#f59e0b',
      penanganan: 'Peringatan dengan sanksi ringan & pembinaan.',
      description: 'Peringatan dengan sanksi ringan',
    };
  } else if (totalPoin < 6) {
    return {
      zone: 'SURAT_WALAS',
      label: `Skor ${totalPoin} (Perjanjian Walas)`,
      color: 'amber',
      bgClass: 'bg-amber-100 text-amber-900 border-amber-300',
      badgeClass: 'bg-amber-600 text-white',
      ringColor: '#d97706',
      penanganan: 'Membuat surat perjanjian yang ditandatangani oleh siswa dan wali kelas.',
      description: 'Surat perjanjian siswa & wali kelas',
    };
  } else if (totalPoin < 8) {
    return {
      zone: 'SURAT_BK',
      label: `Skor ${totalPoin} (Perjanjian BK & Ortu)`,
      color: 'orange',
      bgClass: 'bg-orange-100 text-orange-900 border-orange-300',
      badgeClass: 'bg-orange-500 text-white',
      ringColor: '#f97316',
      penanganan: 'Membuat surat perjanjian yang ditandatangani oleh siswa, orang tua, wali kelas, dan guru BK.',
      description: 'Surat perjanjian siswa, orang tua, wali kelas, dan guru BK',
    };
  } else if (totalPoin < 10) {
    return {
      zone: 'SURAT_KEPSEK',
      label: `Skor ${totalPoin} (Perjanjian Kepsek)`,
      color: 'rose',
      bgClass: 'bg-rose-100 text-rose-900 border-rose-300',
      badgeClass: 'bg-rose-600 text-white',
      ringColor: '#e11d48',
      penanganan: 'Membuat surat perjanjian yang ditandatangani oleh siswa, orang tua, wali kelas, guru BK, dan Kepala Sekolah.',
      description: 'Surat perjanjian siswa, orang tua, wali kelas, guru BK, dan Kepala Sekolah',
    };
  } else if (totalPoin < 30) {
    return {
      zone: 'SKORSING_RUMAH',
      label: `Skor ${totalPoin} (Skorsing Belajar di Rumah)`,
      color: 'rose',
      bgClass: 'bg-rose-200 text-rose-950 border-rose-400 font-bold',
      badgeClass: 'bg-rose-700 text-white',
      ringColor: '#be123c',
      penanganan: 'Membuat surat pernyataan ditandatangani siswa, orang tua, wali kelas, guru BK, Kepala Sekolah, dan belajar di rumah (skorsing).',
      description: 'Pemanggilan orang tua & skorsing belajar di rumah',
    };
  } else {
    return {
      zone: 'DIKELUARKAN',
      label: `Skor ${totalPoin} (Dikembalikan ke Orang Tua)`,
      color: 'red',
      bgClass: 'bg-red-600 text-white border-red-700 font-black animate-pulse',
      badgeClass: 'bg-red-800 text-white',
      ringColor: '#991b1b',
      penanganan: 'Poin akumulasi di atas 30: Siswa dikembalikan kepada orang tua/wali / dikeluarkan dari sekolah.',
      description: 'Dikembalikan ke orang tua / dikeluarkan dari sekolah',
    };
  }
}
