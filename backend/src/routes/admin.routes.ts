import { Router } from 'express';
import { authenticate, requireAdmin } from '../middleware/auth.middleware';
import { getLoopHealth } from '../controllers/post.controller';
import {
  listSectionOwners,
  setSectionOwner,
  listKbCandidates,
  sweepToKb,
  kbNominations,
} from '../controllers/admin.controller';

// Handbook C4/B6/B7 · Admin surfaces. Auth is via `authenticate` + per-controller
// ADMIN/FOUNDER checks.
const router = Router();

router.get('/loop-health',              authenticate, requireAdmin, getLoopHealth);
router.get('/section-owners',           authenticate, requireAdmin, listSectionOwners);
router.patch('/section-owners/:section', authenticate, requireAdmin, setSectionOwner);
router.get('/kb-candidates',            authenticate, requireAdmin, listKbCandidates);
router.post('/kb-nominations',          authenticate, requireAdmin, kbNominations);
router.patch('/posts/:id/sweep',        authenticate, requireAdmin, sweepToKb);

export default router;
