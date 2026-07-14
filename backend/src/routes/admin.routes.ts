import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { getLoopHealth } from '../controllers/post.controller';
import {
  listKbCandidates,
  sweepToKb,
  kbNominations,
} from '../controllers/admin.controller';

// Handbook C4/B6 · Admin surfaces. Auth is via `authenticate` + per-controller
// ADMIN/FOUNDER checks.
const router = Router();

router.get('/loop-health',              authenticate, getLoopHealth);
router.get('/kb-candidates',            authenticate, listKbCandidates);
router.post('/kb-nominations',          authenticate, kbNominations);
router.patch('/posts/:id/sweep',        authenticate, sweepToKb);

export default router;
