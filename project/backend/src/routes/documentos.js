import express from 'express';
import { generarDocumento, getPlantillas } from '../controllers/documentoController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();
router.get('/plantillas', authMiddleware, getPlantillas);
router.post('/generar/:plantillaId', authMiddleware, generarDocumento);

export default router;
