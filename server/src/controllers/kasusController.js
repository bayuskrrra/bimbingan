import { z } from 'zod';
import prisma from '../prisma.js';

const kasusSchema = z.object({
  siswaUtamaId: z.string().min(1, 'Siswa utama wajib dipilih'),
  judulKasus: z.string().min(3, 'Judul kasus minimal 3 karakter'),
  deskripsiLengkap: z.string().min(5, 'Deskripsi lengkap wajib diisi'),
  tanggalKejadian: z.string().or(z.date()),
  status: z.enum(['BARU', 'PROSES', 'SELESAI']).default('BARU'),
  pihakTerlibat: z
    .array(
      z.object({
        siswaId: z.string(),
        peran: z.string().optional(),
      })
    )
    .optional(),
  tindakLanjutAwal: z.string().optional(),
});

const tindakLanjutSchema = z.object({
  catatan: z.string().min(3, 'Catatan tindak lanjut minimal 3 karakter'),
  tanggal: z.string().or(z.date()).optional(),
  statusSetelah: z.enum(['BARU', 'PROSES', 'SELESAI']).optional(),
});

export const getKasusList = async (req, res, next) => {
  try {
    const { page, limit, status, search, startDate, endDate, siswaId } = req.query;

    const where = {};

    if (status && status !== 'SEMUA') {
      where.status = status;
    }

    if (siswaId) {
      where.OR = [
        { siswaUtamaId: siswaId },
        { pihakTerlibat: { some: { siswaId } } },
      ];
    }

    if (search) {
      where.OR = [
        { judulKasus: { contains: search } },
        { deskripsiLengkap: { contains: search } },
        { siswaUtama: { nama: { contains: search } } },
      ];
    }

    if (startDate || endDate) {
      where.tanggalKejadian = {};
      if (startDate) {
        where.tanggalKejadian.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.tanggalKejadian.lte = end;
      }
    }

    const currentPage = parseInt(page, 10) || 1;
    const take = parseInt(limit, 10) || 10;
    const skip = (currentPage - 1) * take;

    const [total, list] = await Promise.all([
      prisma.kasus.count({ where }),
      prisma.kasus.findMany({
        where,
        skip,
        take,
        orderBy: { tanggalKejadian: 'desc' },
        include: {
          siswaUtama: {
            select: { id: true, nama: true, nis: true, kelas: true },
          },
          dicatatOleh: {
            select: { id: true, nama: true },
          },
          pihakTerlibat: {
            include: {
              siswa: { select: { id: true, nama: true, kelas: true } },
            },
          },
          _count: {
            select: { tindakLanjutList: true },
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

export const getKasusDetail = async (req, res, next) => {
  try {
    const { id } = req.params;

    const kasus = await prisma.kasus.findUnique({
      where: { id },
      include: {
        siswaUtama: true,
        dicatatOleh: {
          select: { id: true, nama: true, username: true, noHp: true },
        },
        pihakTerlibat: {
          include: {
            siswa: true,
          },
        },
        tindakLanjutList: {
          include: {
            dicatatOleh: {
              select: { id: true, nama: true },
            },
          },
          orderBy: { tanggal: 'desc' },
        },
      },
    });

    if (!kasus) {
      return res.status(404).json({
        success: false,
        message: 'Data kasus tidak ditemukan.',
      });
    }

    return res.json({
      success: true,
      data: kasus,
    });
  } catch (err) {
    next(err);
  }
};

export const createKasus = async (req, res, next) => {
  try {
    const data = kasusSchema.parse(req.body);

    const result = await prisma.$transaction(async (tx) => {
      const kasus = await tx.kasus.create({
        data: {
          siswaUtamaId: data.siswaUtamaId,
          dicatatOlehId: req.user.id,
          judulKasus: data.judulKasus,
          deskripsiLengkap: data.deskripsiLengkap,
          tanggalKejadian: new Date(data.tanggalKejadian),
          status: data.status,
          pihakTerlibat: data.pihakTerlibat?.length
            ? {
                create: data.pihakTerlibat.map((pt) => ({
                  siswaId: pt.siswaId,
                  peran: pt.peran || 'Terlibat',
                })),
              }
            : undefined,
        },
      });

      if (data.tindakLanjutAwal && data.tindakLanjutAwal.trim()) {
        await tx.tindakLanjutKasus.create({
          data: {
            kasusId: kasus.id,
            dicatatOlehId: req.user.id,
            catatan: data.tindakLanjutAwal.trim(),
            tanggal: new Date(),
            statusSetelah: data.status,
          },
        });
      }

      return kasus;
    });

    const createdKasus = await prisma.kasus.findUnique({
      where: { id: result.id },
      include: {
        siswaUtama: true,
        pihakTerlibat: { include: { siswa: true } },
        tindakLanjutList: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Kasus konseling bimbingan berhasil dicatat.',
      data: createdKasus,
    });
  } catch (err) {
    next(err);
  }
};

export const addTindakLanjut = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = tindakLanjutSchema.parse(req.body);

    const kasus = await prisma.kasus.findUnique({
      where: { id },
    });

    if (!kasus) {
      return res.status(404).json({
        success: false,
        message: 'Data kasus tidak ditemukan.',
      });
    }

    const log = await prisma.$transaction(async (tx) => {
      const newLog = await tx.tindakLanjutKasus.create({
        data: {
          kasusId: id,
          dicatatOlehId: req.user.id,
          catatan: data.catatan,
          tanggal: data.tanggal ? new Date(data.tanggal) : new Date(),
          statusSetelah: data.statusSetelah || kasus.status,
        },
        include: {
          dicatatOleh: { select: { id: true, nama: true } },
        },
      });

      if (data.statusSetelah && data.statusSetelah !== kasus.status) {
        await tx.kasus.update({
          where: { id },
          data: { status: data.statusSetelah },
        });
      }

      return newLog;
    });

    return res.status(201).json({
      success: true,
      message: 'Catatan tindak lanjut berhasil ditambahkan.',
      data: log,
    });
  } catch (err) {
    next(err);
  }
};

export const updateStatusKasus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['BARU', 'PROSES', 'SELESAI'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Status harus bernilai BARU, PROSES, atau SELESAI.',
      });
    }

    const updated = await prisma.kasus.update({
      where: { id },
      data: { status },
    });

    return res.json({
      success: true,
      message: `Status kasus berhasil diperbarui menjadi ${status}.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteKasus = async (req, res, next) => {
  try {
    const { id } = req.params;

    await prisma.kasus.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Data kasus berhasil dihapus.',
    });
  } catch (err) {
    next(err);
  }
};

export const deleteAllKasus = async (req, res, next) => {
  try {
    await prisma.$transaction([
      prisma.tindakLanjutKasus.deleteMany(),
      prisma.kasusPihakTerlibat.deleteMany(),
      prisma.kasus.deleteMany(),
    ]);

    return res.json({
      success: true,
      message: 'Semua data kasus bimbingan konseling berhasil dibersihkan/dihapus.',
    });
  } catch (err) {
    next(err);
  }
};
