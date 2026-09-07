import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma.js';

const guruBkCreateSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6, 'Password minimal 6 karakter'),
  noHp: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'GURU_BK']).default('GURU_BK'),
});

const guruBkUpdateSchema = z.object({
  nama: z.string().min(2, 'Nama minimal 2 karakter'),
  username: z.string().min(3, 'Username minimal 3 karakter'),
  password: z.string().min(6).optional().or(z.literal('')),
  noHp: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'GURU_BK']),
  isAktif: z.boolean(),
});

export const getGuruBkList = async (req, res, next) => {
  try {
    const list = await prisma.guruBk.findMany({
      select: {
        id: true,
        nama: true,
        username: true,
        noHp: true,
        role: true,
        isAktif: true,
        createdAt: true,
        _count: {
          select: {
            pelanggaranDicatat: true,
            kasusDicatat: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return res.json({
      success: true,
      data: list,
    });
  } catch (err) {
    next(err);
  }
};

export const createGuruBk = async (req, res, next) => {
  try {
    const data = guruBkCreateSchema.parse(req.body);

    const existing = await prisma.guruBk.findUnique({
      where: { username: data.username },
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: `Username "${data.username}" sudah digunakan.`,
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(data.password, salt);

    const guru = await prisma.guruBk.create({
      data: {
        nama: data.nama,
        username: data.username,
        passwordHash,
        noHp: data.noHp || null,
        role: data.role,
      },
      select: {
        id: true,
        nama: true,
        username: true,
        noHp: true,
        role: true,
        isAktif: true,
      },
    });

    return res.status(201).json({
      success: true,
      message: 'Akun Guru BK berhasil dibuat.',
      data: guru,
    });
  } catch (err) {
    next(err);
  }
};

export const updateGuruBk = async (req, res, next) => {
  try {
    const { id } = req.params;
    const data = guruBkUpdateSchema.parse(req.body);

    const existingUser = await prisma.guruBk.findFirst({
      where: {
        username: data.username,
        NOT: { id },
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: `Username "${data.username}" sudah dipakai akun lain.`,
      });
    }

    const updateData = {
      nama: data.nama,
      username: data.username,
      noHp: data.noHp || null,
      role: data.role,
      isAktif: data.isAktif,
    };

    if (data.password && data.password.trim().length >= 6) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(data.password, salt);
    }

    const updated = await prisma.guruBk.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        nama: true,
        username: true,
        noHp: true,
        role: true,
        isAktif: true,
      },
    });

    return res.json({
      success: true,
      message: 'Data akun Guru BK berhasil diperbarui.',
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};

export const toggleStatusGuruBk = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (id === req.user.id) {
      return res.status(400).json({
        success: false,
        message: 'Anda tidak dapat menonaktifkan akun Anda sendiri.',
      });
    }

    const guru = await prisma.guruBk.findUnique({
      where: { id },
    });

    if (!guru) {
      return res.status(404).json({
        success: false,
        message: 'Akun tidak ditemukan.',
      });
    }

    const updated = await prisma.guruBk.update({
      where: { id },
      data: { isAktif: !guru.isAktif },
      select: { id: true, nama: true, isAktif: true },
    });

    return res.json({
      success: true,
      message: `Akun ${updated.nama} berhasil di-${updated.isAktif ? 'aktifkan' : 'nonaktifkan'}.`,
      data: updated,
    });
  } catch (err) {
    next(err);
  }
};
