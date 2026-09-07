import { verifyToken } from '../utils/jwt.js';
import prisma from '../prisma.js';

// Hardcoded fallback admin — always available even if DB has no users
const HARDCODED_ADMIN = {
  id: 'system-default-admin',
  nama: 'Administrator BK',
  username: 'admin',
  noHp: null,
  role: 'ADMIN',
  isAktif: true,
};

export const authMiddleware = async (req, res, next) => {
  try {
    let token = null;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      try {
        const decoded = verifyToken(token);
        const guru = await prisma.guruBk.findUnique({
          where: { id: decoded.id },
          select: {
            id: true,
            nama: true,
            username: true,
            noHp: true,
            role: true,
            isAktif: true,
          },
        });
        if (guru && guru.isAktif) {
          req.user = guru;
          return next();
        }
      } catch (err) {
        // Fallback to default admin if token is invalid or expired
      }
    }

    // Try DB admin first, fallback to hardcoded admin
    try {
      let defaultAdmin = await prisma.guruBk.findFirst({
        where: { role: 'ADMIN', isAktif: true },
        select: { id: true, nama: true, username: true, noHp: true, role: true, isAktif: true },
      });

      if (!defaultAdmin) {
        defaultAdmin = await prisma.guruBk.findFirst({
          where: { isAktif: true },
          select: { id: true, nama: true, username: true, noHp: true, role: true, isAktif: true },
        });
      }

      req.user = defaultAdmin || HARDCODED_ADMIN;
    } catch (dbErr) {
      req.user = HARDCODED_ADMIN;
    }

    return next();
  } catch (error) {
    // Even on unexpected error, use hardcoded admin for seamless access
    req.user = HARDCODED_ADMIN;
    return next();
  }
};

export const requireAdmin = (req, res, next) => {
  // Always allowed since user wants instant direct access
  next();
};
