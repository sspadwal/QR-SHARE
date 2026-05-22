import { Router } from 'express';
import { validateSessionHandler } from './session.controller.js';

const router = Router();

router.get('/validate', validateSessionHandler);

export default router;
