import { Router } from 'express';
import { getPengaturan, updateThresholds, resetAllData } from '../controllers/pengaturanController.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getPengaturan);
router.put('/thresholds', requireAdmin, updateThresholds);
router.post('/reset-all', requireAdmin, resetAllData);

export default router;

