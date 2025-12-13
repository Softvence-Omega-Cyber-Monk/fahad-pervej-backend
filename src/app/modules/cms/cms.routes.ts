// src/routes/cms.routes.ts
import express from 'express';
import {
  getTopbar,
  createTopbar,
  updateTopbar,
  getAllTopbars,
  deleteTopbar,
  getHero,
  createHero,
  updateHero,
  getAllHeroes,
  deleteHero,
  getFooter,
  createFooter,
  updateFooter,
  getAllFooters,
  deleteFooter,
} from './cms.controller'; 

const router = express.Router();

router.get('/topbar', getTopbar);


router.get('/topbar/all', getAllTopbars); 
router.post('/topbar', createTopbar);
router.put('/topbar/:id', updateTopbar);
router.delete('/topbar/:id', deleteTopbar);


router.get('/hero', getHero);


router.get('/hero/all', getAllHeroes); // Add authenticate, authorizeAdmin
router.post('/hero', createHero); // Add authenticate, authorizeAdmin
router.put('/hero/:id', updateHero); // Add authenticate, authorizeAdmin
router.delete('/hero/:id', deleteHero); // Add authenticate, authorizeAdmin

// ========== FOOTER ROUTES ==========
// Public route to get active footer
router.get('/footer', getFooter);

// Admin routes for footer management (add authentication middleware)
router.get('/footer/all', getAllFooters); // Add authenticate, authorizeAdmin
router.post('/footer', createFooter); // Add authenticate, authorizeAdmin
router.put('/footer/:id', updateFooter); // Add authenticate, authorizeAdmin
router.delete('/footer/:id', deleteFooter); // Add authenticate, authorizeAdmin

export const CMSRouter = router;