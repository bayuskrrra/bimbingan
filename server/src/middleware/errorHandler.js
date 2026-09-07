import { ZodError } from 'zod';

export const errorHandler = (err, req, res, next) => {
  console.error('Error stack:', err);

  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    return res.status(400).json({
      success: false,
      message: 'Validasi data gagal.',
      errors: formattedErrors,
    });
  }

  // Prisma unique constraint error code P2002
  if (err.code === 'P2002') {
    const target = err.meta?.target ? err.meta.target.join(', ') : 'field';
    return res.status(409).json({
      success: false,
      message: `Data dengan ${target} tersebut sudah ada di sistem.`,
    });
  }

  // Prisma record not found error code P2025
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'Data yang dicari tidak ditemukan.',
    });
  }

  const statusCode = err.statusCode || 500;
  return res.status(statusCode).json({
    success: false,
    message: err.message || 'Terjadi kesalahan internal pada server.',
  });
};
