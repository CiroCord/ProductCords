import express from 'express';
import { 
  createSection, 
  getSections, 
  deleteSection, 
  createDefaultSections, 
  updateSections 
} from '../controllers/sectionController.js';

const router = express.Router();

router.post('/', createSection);
router.get('/', getSections);
router.delete('/:id', deleteSection);
router.put('/default', createDefaultSections);
router.post('/bulk-update', updateSections);

export default router;
