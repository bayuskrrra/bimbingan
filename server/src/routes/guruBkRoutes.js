import { Router } from 'express';
import {
  getGuruBkList,
  createGuruBk,
  updateGuruBk,
  toggleStatusGuruBk,
} from '../controllers/guruBkController.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);
router.use(requireAdmin);

router.get('/', getGuruBkList);
router.post('/', createGuruBk);
router.put('/:id', updateGuruBk);
router.patch('/:id/toggle-status', toggleStatusGuruBk);

export default router;
