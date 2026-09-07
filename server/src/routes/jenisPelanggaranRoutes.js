import { Router } from 'express';
import {
  getJenisPelanggaranList,
  createJenisPelanggaran,
  updateJenisPelanggaran,
  deleteJenisPelanggaran,
} from '../controllers/jenisPelanggaranController.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getJenisPelanggaranList);
router.post('/', requireAdmin, createJenisPelanggaran);
router.put('/:id', requireAdmin, updateJenisPelanggaran);
router.delete('/:id', requireAdmin, deleteJenisPelanggaran);

export default router;
