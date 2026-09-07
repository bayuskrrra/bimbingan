import { z } from 'zod';
import prisma from '../prisma.js';
import { OFFICIAL_THRESHOLDS } from '../utils/thresholds.js';

export const getPengaturan = async (req, res, next) => {
  try {
    const list = await prisma.pengaturan.findMany();
    const settingsMap = {};

    list.forEach((item) => {
      try {
        settingsMap[item.key] = JSON.parse(item.value);
      } catch {
        settingsMap[item.key] = item.value;
      }
    });

    if (!settingsMap.threshold_poin) {
      settingsMap.threshold_poin = OFFICIAL_THRESHOLDS;
    }

    return res.json({
      success: true,
      data: settingsMap,
    });
  } catch (err) {
    next(err);
  }
};

export const updateThresholds = async (req, res, next) => {
  try {
    const data = req.body;

    await prisma.pengaturan.upsert({
      where: { key: 'threshold_poin' },
      update: {
        value: JSON.stringify(data),
        keterangan: 'Ketentuan Penanganan Berdasarkan Jumlah Skor (Pasal 19)',
      },
      create: {
        key: 'threshold_poin',
        value: JSON.stringify(data),
        keterangan: 'Ketentuan Penanganan Berdasarkan Jumlah Skor (Pasal 19)',
      },
    });

    return res.json({
      success: true,
      message: 'Ketentuan penanganan skor berhasil diperbarui.',
      data,
    });
  } catch (err) {
    next(err);
  }
};

// Reset ALL operational data (siswa, pelanggaran, kasus) — keeps GuruBk & Pengaturan
export const resetAllData = async (req, res, next) => {
  try {
    await prisma.$transaction([
      prisma.tindakLanjutKasus.deleteMany(),
      prisma.kasusPihakTerlibat.deleteMany(),
      prisma.kasus.deleteMany(),
      prisma.pelanggaranSiswa.deleteMany(),
      prisma.siswa.deleteMany(),
    ]);

    return res.json({
      success: true,
      message: 'Semua data siswa, pelanggaran, dan kasus telah berhasil dikosongkan. Data akun dan pengaturan sistem tetap terjaga.',
    });
  } catch (err) {
    next(err);
  }
};

