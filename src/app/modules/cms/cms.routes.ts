import express from 'express';
import {
  getTopbar,
  updateTopbar,
  getAllHeroes,
  getHeroById,
  createHero,
  updateHero,
  deleteHero,
  getFooter,
  updateFooter,
} from './cms.controller';
import { multerUpload } from '../../middlewares/multerUpload';

const router = express.Router();

// ========== TOPBAR ROUTES ==========
router.get('/topbar', getTopbar);
router.put('/topbar', updateTopbar);

// ========== HERO ROUTES ==========
router.get('/hero', getAllHeroes);
router.get('/hero/:id', getHeroById);
router.post('/hero', multerUpload.single('image'), createHero);
router.put('/hero/:id', multerUpload.single('image'), updateHero);
router.delete('/hero/:id', deleteHero);

// ========== FOOTER ROUTES ==========
router.get('/footer', getFooter);
router.put('/footer', multerUpload.single('logo'), updateFooter);

export const CMSRouter = router;