import { z } from 'zod';
import prisma from '../prisma.js';
import { getThresholdSettings, evaluatePointZone } from '../utils/thresholds.js';

const siswaSchema = z.object({
  nama: z.string().min(2, 'Nama siswa minimal 2 karakter'),
  nis: z.string().min(3, 'NIS minimal 3 karakter'),
  kelas: z.string().min(1, 'Kelas wajib diisi'),
  jenisKelamin: z.enum(['L', 'P'], { errorMap: () => ({ message: 'Jenis kelamin harus L atau P' }) }),
  fotoUrl: z.string().optional().nullable(),
  namaWali: z.string().min(2, 'Nama wali wajib diisi'),
  kontakWali: z.string().min(5, 'Kontak wali wajib diisi'),
});

export const getSiswaList = async (req, res, next) => {
  try {
    const { search, kelas, page, limit, all, zona } = req.query;
    const thresholds = await getThresholdSettings();

    const where = {};
    if (search) {
      where.OR = [
        { nama: { contains: search } },
        { nis: { contains: search } },
      ];
    }
    if (kelas && kelas !== 'SEMUA') {
      where.kelas = kelas;
    }

    // If 'all' is requested (e.g. for dropdown search/select)
    if (all === 'true') {
      const siswa = await prisma.siswa.findMany({
        where,
        orderBy: [{ kelas: 'asc' }, { nama: 'asc' }],
        include: {
          pelanggaran: {
            select: { poinSaatItu: true },
          },
        },
      });

      const formatted = siswa.map((s) => {
        const totalPoin = s.pelanggaran.reduce((sum, p) => sum + p.poinSaatItu, 0);
        const zoneInfo = evaluatePointZone(totalPoin, thresholds);
        return {
          id: s.id,
          nama: s.nama,
          nis: s.nis,
          kelas: s.kelas,
          jenisKelamin: s.jenisKelamin,
          totalPoin,
          zoneInfo,
        };
      });

      return res.json({
        success: true,
        data: formatted,
      });
    }

    const currentPage = parseInt(page, 10) || 1;
    const take = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * take;

    const [total, siswaList] = await Promise.all([
      prisma.siswa.count({ where }),
      prisma.siswa.findMany({
        where,
        skip,
        take,
        orderBy: [{ kelas: 'asc' }, { nama: 'asc' }],
        include: {
          pelanggaran: {
            select: { poinSaatItu: true },
          },
          kasusUtama: {
            select: { id: true, status: true },
          },
        },
      }),
    ]);

    const formattedList = siswaList.map((s) => {
      const totalPoin = s.pelanggaran.reduce((sum, p) => sum + p.poinSaatItu, 0);
      const zoneInfo = evaluatePointZone(totalPoin, thresholds);
      const kasusAktifCount = s.kasusUtama.filter((k) => k.status !== 'SELESAI').length;

      return {
        id: s.id,
        nama: s.nama,
        nis: s.nis,
        kelas: s.kelas,
        jenisKelamin: s.jenisKelamin,
        fotoUrl: s.fotoUrl,
        namaWali: s.namaWali,
        kontakWali: s.kontakWali,
        createdAt: s.createdAt,
        totalPoin,
        zoneInfo,
        totalPelanggaran: s.pelanggaran.length,
        kasusAktifCount,
      };
    });

    // If filtered by zona in memory if needed
    let filteredList = formattedList;
    if (zona && zona !== 'SEMUA') {
      filteredList = formattedList.filter((s) => s.zoneInfo.zone === zona);
    }

    return res.json({
      success: true,
      data: filteredList,
      pagination: {
        page: currentPage,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getDistinctKelas = async (req, res, next) => {
  try {
    const list = await prisma.siswa.findMany({
      select: { kelas: true },
      distinct: ['kelas'],
      orderBy: { kelas: 'asc' },
    });
    return res.json({
      success: true,
      data: list.map((item) => item.kelas),
    });
  } catch (err) {
    next(err);
  }
};

export const getSiswaDetail = async (req, res, next) => {
  try {
    const { id } = req.params;
    const thresholds = await getThresholdSettings();

    const siswa = await prisma.siswa.findUnique({
      where: { id },
      include: {
        pelanggaran: {
          include: {
            jenisPelanggaran: true,
            dicatatOleh: {
              select: { id: true, nama: true, username: true },
            },
          },
          orderBy: { tanggal: 'desc' },
        },
        kasusUtama: {
          include: {
            dicatatOleh: {
              select: { id: true, nama: true, username: true },
            },
            pihakTerlibat: {
              include: {
                siswa: { select: { id: true, nama: true, kelas: true, nis: true } },
              },
            },
            tindakLanjutList: {
              include: {
                dicatatOleh: { select: { id: true, nama: true } },
              },
              orderBy: { tanggal: 'desc' },
            },
          },
          orderBy: { tanggalKejadian: 'desc' },
        },
        kasusTerlibat: {
          include: {
            kasus: {
              include: {
                siswaUtama: { select: { id: true, nama: true, kelas: true } },
                dicatatOleh: { select: { id: true, nama: true } },
              },
            },
          },
        },
      },
    });

    if (!siswa) {
      return res.status(404).json({
        success: false,
        message: 'Data siswa tidak ditemukan.',
      });
    }

    const totalPoin = siswa.pelanggaran.reduce((sum, p) => sum + p.poinSaatItu, 0);
    const zoneInfo = evaluatePointZone(totalPoin, thresholds);

    // Build unified chronological timeline
    const timeline = [];

    siswa.pelanggaran.forEach((p) => {
      timeline.push({
        type: 'PELANGGARAN',
        id: p.id,
        tanggal: p.tanggal,
        judul: p.jenisPelanggaran.namaPelanggaran,
        kategori: p.jenisPelanggaran.kategori,
        poin: p.poinSaatItu,
        keterangan: p.keteranganTambahan,
        dicatatOleh: p.dicatatOleh.nama,
      });
    });

    siswa.kasusUtama.forEach((k) => {
      timeline.push({
        type: 'KASUS_UTAMA',
        id: k.id,
        tanggal: k.tanggalKejadian,
        judul: k.judulKasus,
        status: k.status,
        deskripsi: k.deskripsiLengkap,
        dicatatOleh: k.dicatatOleh.nama,
        pihakTerlibat: k.pihakTerlibat.map((pt) => ({
          nama: pt.siswa.nama,
          kelas: pt.siswa.kelas,
          peran: pt.peran,
        })),
        tindakLanjutCount: k.tindakLanjutList.length,
      });
    });

    siswa.kasusTerlibat.forEach((kt) => {
      timeline.push({
        type: 'KASUS_TERLIBAT',
        id: kt.kasus.id,
        tanggal: kt.kasus.tanggalKejadian,
        judul: kt.kasus.judulKasus,
        status: kt.kasus.status,
        peran: kt.peran || 'Terlibat',
        siswaUtama: `${kt.kasus.siswaUtama.nama} (${kt.kasus.siswaUtama.kelas})`,
        dicatatOleh: kt.kasus.dicatatOleh.nama,
      });
    });

    // Sort timeline descending by date
    timeline.sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime());

    return res.json({
      success: true,
      data: {
        ...siswa,
        totalPoin,
        zoneInfo,
        timeline,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const createSiswa = async (req, res, next) => {
  try {
    const data = siswaSchema.parse(req.body);
    const existing = await prisma.siswa.findUnique({
      where: { nis: data.nis },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Siswa dengan NIS ${data.nis} sudah terdaftar.`,
      });
    }

    const siswa = await prisma.siswa.create({
      data,
    });

    return res.status(201).json({
      success: true,
      message: 'Data siswa berhasil ditambahkan.',
      data: siswa,
    });
  } catch (err) {
    next(err);
  }
};

export const updateSiswa = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = siswaSchema.parse(req.body);

    const existingNis = await prisma.siswa.findFirst({
      where: {
        nis: data.nis,
        NOT: { id },
      },
    });

    if (existingNis) {
      return res.status(400).json({
        success: false,
        message: `Siswa dengan NIS ${data.nis} sudah digunakan oleh siswa lain.`,
      });
    }

    const siswa = await prisma.siswa.update({
      where: { id },
      data,
    });

    return res.json({
      success: true,
      message: 'Data siswa berhasil diperbarui.',
      data: siswa,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteSiswa = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.siswa.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Data siswa berhasil dihapus.',
    });
  } catch (err) {
    next(err);
  }
};
