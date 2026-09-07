import { z } from 'zod';
import prisma from '../prisma.js';
import { getThresholdSettings, evaluatePointZone } from '../utils/thresholds.js';

const pelanggaranSchema = z.object({
  siswaId: z.string().min(1, 'Siswa wajib dipilih'),
  jenisPelanggaranId: z.string().min(1, 'Jenis pelanggaran wajib dipilih'),
  tanggal: z.string().or(z.date()).optional(),
  keteranganTambahan: z.string().optional().nullable(),
});

export const getPelanggaranList = async (req, res, next) => {
  try {
    const { page, limit, siswaId, kelas, kategori, startDate, endDate, search } = req.query;

    const where = {};

    if (siswaId) {
      where.siswaId = siswaId;
    }

    if (kelas && kelas !== 'SEMUA') {
      where.siswa = { ...(where.siswa || {}), kelas };
    }

    if (kategori && kategori !== 'SEMUA') {
      where.jenisPelanggaran = { kategori };
    }

    if (search) {
      where.siswa = {
        ...(where.siswa || {}),
        OR: [
          { nama: { contains: search } },
          { nis: { contains: search } },
        ],
      };
    }

    if (startDate || endDate) {
      where.tanggal = {};
      if (startDate) {
        where.tanggal.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggal.lte = end;
      }
    }

    const currentPage = parseInt(page, 10) || 1;
    const take = parseInt(limit, 10) || 15;
    const skip = (currentPage - 1) * take;

    const [total, list] = await Promise.all([
      prisma.pelanggaranSiswa.count({ where }),
      prisma.pelanggaranSiswa.findMany({
        where,
        skip,
        take,
        orderBy: { tanggal: 'desc' },
        include: {
          siswa: {
            select: {
              id: true,
              nama: true,
              nis: true,
              kelas: true,
            },
          },
          jenisPelanggaran: true,
          dicatatOleh: {
            select: {
              id: true,
              nama: true,
            },
          },
        },
      }),
    ]);

    return res.json({
      success: true,
      data: list,
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

export const createPelanggaran = async (req, res, next) => {
  try {
    const data = pelanggaranSchema.parse(req.body);

    const jenis = await prisma.jenisPelanggaran.findUnique({
      where: { id: data.jenisPelanggaranId },
    });

    if (!jenis) {
      return res.status(404).json({
        success: false,
        message: 'Jenis pelanggaran tidak ditemukan.',
      });
    }

    const siswa = await prisma.siswa.findUnique({
      where: { id: data.siswaId },
    });

    if (!siswa) {
      return res.status(404).json({
        success: false,
        message: 'Siswa tidak ditemukan.',
      });
    }

    const pelanggaran = await prisma.pelanggaranSiswa.create({
      data: {
        siswaId: data.siswaId,
        jenisPelanggaranId: data.jenisPelanggaranId,
        dicatatOlehId: req.user.id,
        tanggal: data.tanggal ? new Date(data.tanggal) : new Date(),
        keteranganTambahan: data.keteranganTambahan || null,
        poinSaatItu: jenis.poin, // Snapshot poin
      },
      include: {
        siswa: true,
        jenisPelanggaran: true,
        dicatatOleh: { select: { id: true, nama: true } },
      },
    });

    // Calculate updated total points & zone
    const allViolations = await prisma.pelanggaranSiswa.findMany({
      where: { siswaId: data.siswaId },
      select: { poinSaatItu: true },
    });
    const totalPoin = allViolations.reduce((sum, v) => sum + v.poinSaatItu, 0);
    const thresholds = await getThresholdSettings();
    const zoneInfo = evaluatePointZone(totalPoin, thresholds);

    return res.status(201).json({
      success: true,
      message: `Pelanggaran "${jenis.namaPelanggaran}" (+${jenis.poin} poin) berhasil dicatat untuk ${siswa.nama}.`,
      data: pelanggaran,
      updatedStudentSummary: {
        siswaId: siswa.id,
        nama: siswa.nama,
        totalPoin,
        zoneInfo,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const deletePelanggaran = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existing = await prisma.pelanggaranSiswa.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({
        success: false,
        message: 'Data pelanggaran tidak ditemukan.',
      });
    }

    await prisma.pelanggaranSiswa.delete({
      where: { id },
    });

    // Recalculate remaining points
    const remaining = await prisma.pelanggaranSiswa.findMany({
      where: { siswaId: existing.siswaId },
      select: { poinSaatItu: true },
    });
    const totalPoin = remaining.reduce((sum, v) => sum + v.poinSaatItu, 0);

    return res.json({
      success: true,
      message: 'Catatan pelanggaran berhasil dihapus.',
      updatedTotalPoin: totalPoin,
    });
  } catch (err) {
    next(err);
  }
};
