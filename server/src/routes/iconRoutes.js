/**
 * Icon Routes
 * 
 * Routes for icon-related operations.
 */

import express from 'express';
import { getIconMetadata } from '../controllers/iconController.js';

const router = express.Router();

router.get('/metadata', getIconMetadata);

export default router;
