import { Router } from 'express';
import { JournalController } from '../controllers/journal.controller';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

router.use(authMiddleware);

router.get('/', JournalController.getEntries);
router.post('/', JournalController.createEntry);
router.get('/stats', JournalController.getStats);
router.delete('/:id', JournalController.deleteEntry);

export default router;
