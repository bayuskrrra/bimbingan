import { Router } from 'express';
import {
  getSiswaList,
  getDistinctKelas,
  getSiswaDetail,
  createSiswa,
  updateSiswa,
  deleteSiswa,
} from '../controllers/siswaController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = Router();

router.use(authMiddleware);

router.get('/', getSiswaList);
router.get('/kelas', getDistinctKelas);
router.get('/:id', getSiswaDetail);
router.post('/', createSiswa);
router.put('/:id', updateSiswa);
router.delete('/:id', deleteSiswa);

export default router;
