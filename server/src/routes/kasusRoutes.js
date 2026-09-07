import { Router } from 'express';
import {
  getKasusList,
  getKasusDetail,
  createKasus,
  addTindakLanjut,
  updateStatusKasus,
  deleteKasus,
  deleteAllKasus,
} from '../controllers/kasusController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getKasusList);
router.delete('/all', deleteAllKasus);
router.get('/:id', getKasusDetail);
router.post('/', createKasus);
router.post('/:id/tindak-lanjut', addTindakLanjut);
router.put('/:id/status', updateStatusKasus);
router.delete('/:id', deleteKasus);

export default router;
