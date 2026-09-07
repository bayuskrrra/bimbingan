import { z } from 'zod';
import prisma from '../prisma.js';

const jenisPelanggaranSchema = z.object({
  namaPelanggaran: z.string().min(3, 'Nama pelanggaran minimal 3 karakter'),
  kategori: z.enum(['RINGAN', 'SEDANG', 'BERAT'], {
    errorMap: () => ({ message: 'Kategori harus RINGAN, SEDANG, atau BERAT' }),
  }),
  poin: z.number().int().min(1, 'Poin minimal 1'),
});

export const getJenisPelanggaranList = async (req, res, next) => {
  try {
    const { kategori, search } = req.query;

    const where = {};
    if (kategori && kategori !== 'SEMUA') {
      where.kategori = kategori;
    }
    if (search) {
      where.namaPelanggaran = { contains: search };
    }

    const list = await prisma.jenisPelanggaran.findMany({
      where,
      orderBy: [{ kategori: 'asc' }, { poin: 'asc' }, { namaPelanggaran: 'asc' }],
      include: {
        _count: {
          select: { pelanggaranSiswa: true },
        },
      },
    });

    return res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

export const createJenisPelanggaran = async (req, res, next) => {
  try {
    const body = {
      ...req.body,
      poin: typeof req.body.poin === 'string' ? parseInt(req.body.poin, 10) : req.body.poin,
    };
    const data = jenisPelanggaranSchema.parse(body);

    const created = await prisma.jenisPelanggaran.create({
      data,
    });

    return res.status(201).json({
      success: true,
      message: 'Master jenis pelanggaran berhasil ditambahkan.',
      data: created,
    });
  } catch (err) {
    next(err);
  }
};

export const updateJenisPelanggaran = async (req, res, next) => {
  try {
    const { id } = req.params;
    const body = {
      ...req.body,
      poin: typeof req.body.poin === 'string' ? parseInt(req.body.poin, 10) : req.body.poin,
    };
    const data = jenisPelanggaranSchema.parse(body);

    const updated = await prisma.jenisPelanggaran.update({
      where: { id },
      data,
    });

    return res.json({
      success: true,
      message: 'Master jenis pelanggaran berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const deleteJenisPelanggaran = async (req, res, next) => {
  try {
    const { id } = req.params;

    const inUse = await prisma.pelanggaranSiswa.count({
      where: { jenisPelanggaranId: id },
    });

    if (inUse > 0) {
      return res.status(400).json({
        success: false,
        message: `Tidak dapat menghapus jenis pelanggaran ini karena sudah dicatat pada ${inUse} transaksi siswa.`,
      });
    }

    await prisma.jenisPelanggaran.delete({
      where: { id },
    });

    return res.json({
      success: true,
      message: 'Jenis pelanggaran berhasil dihapus.',
    });
  } catch (err) {
    next(err);
  }
};
