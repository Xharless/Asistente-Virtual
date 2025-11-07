import express from 'express';
import { buscarTerminos } from '../controllers/diccionarioController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/buscar', authMiddleware, buscarTerminos);

export default router;