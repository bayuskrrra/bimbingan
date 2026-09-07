import { Router } from 'express';
import { exportExcel, exportPdf } from '../controllers/laporanController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/excel', exportExcel);
router.get('/pdf', exportPdf);

export default router;
