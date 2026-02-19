// src/routes/partners.routes.ts
import express from 'express';
import {
  getAllPartners,
  getPartnerById,
  createPartner,
  updatePartner,
  deletePartner,
} from './partners.controller';
import { multerUpload } from '../../middlewares/multerUpload';

const router = express.Router();

// ========== PARTNERS ROUTES ==========
router.get('/', getAllPartners);
router.get('/:id', getPartnerById);
router.post('/', multerUpload.single('logo'), createPartner);
router.put('/:id', multerUpload.single('logo'), updatePartner);
router.delete('/:id', deletePartner);

export const PartnersRouter = router;