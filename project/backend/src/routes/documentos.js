import express from 'express';
import { generarDocumento } from '../controllers/documentoController.js';
import authMiddleware from '../middleware/authMiddleware.js';
console.log(generarDocumento)
const router = express.Router();

// POST /api/documentos/generar
// Ruta protegida para generar un documento. Solo usuarios autenticados.
router.post('/generar', authMiddleware, generarDocumento);

export default router;
