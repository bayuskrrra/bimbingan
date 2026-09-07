import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../prisma.js';
import { generateToken } from '../utils/jwt.js';

const loginSchema = z.object({
  username: z.string().min(1, 'Username wajib diisi'),
  password: z.string().min(1, 'Password wajib diisi'),
});

export const login = async (req, res, next) => {
  try {
    const { username, password } = loginSchema.parse(req.body);

    const user = await prisma.guruBk.findUnique({
      where: { username },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    if (!user.isAktif) {
      return res.status(403).json({
        success: false,
        message: 'Akun Anda dinonaktifkan. Silakan hubungi Administrator.',
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Username atau password salah.',
      });
    }

    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role,
    });

    return res.json({
      success: true,
      message: 'Login berhasil.',
      token,
      user: {
        id: user.id,
        nama: user.nama,
        username: user.username,
        noHp: user.noHp,
        role: user.role,
      },
    });
  } catch (err) {
    next(err);
  }
};

export const getMe = async (req, res, next) => {
  try {
    return res.json({
      success: true,
      user: req.user,
    });
  } catch (err) {
    next(err);
  }
};

export const updatePassword = async (req, res, next) => {
  try {
    const passwordSchema = z.object({
      oldPassword: z.string().min(1, 'Password lama wajib diisi'),
      newPassword: z.string().min(6, 'Password baru minimal 6 karakter'),
    });

    const { oldPassword, newPassword } = passwordSchema.parse(req.body);

    const user = await prisma.guruBk.findUnique({
      where: { id: req.user.id },
    });

    const isMatch = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Password lama tidak sesuai.',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.guruBk.update({
      where: { id: req.user.id },
      data: { passwordHash },
    });

    return res.json({
      success: true,
      message: 'Password berhasil diperbarui.',
    });
  } catch (err) {
    next(err);
  }
};
