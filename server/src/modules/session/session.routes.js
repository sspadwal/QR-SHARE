import { Router } from 'express';
import { createSessionHandler } from './session.controller.js';

const router = Router();

router.get('/', createSessionHandler);

export default router;
