import { Router } from 'express';
import {
  getPelanggaranList,
  createPelanggaran,
  deletePelanggaran,
} from '../controllers/pelanggaranController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getPelanggaranList);
router.post('/', createPelanggaran);
router.delete('/:id', deletePelanggaran);

export default router;
