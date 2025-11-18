import express from 'express';
import multer from 'multer';
import { analizarDocumento } from '../controllers/documentoController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Configuración de Multer para manejar la subida de archivos en memoria
const storage = multer.memoryStorage();
const upload = multer({ storage: storage, limits: { fileSize: 10 * 1024 * 1024 } }); // Límite de 10MB

// Definimos la ruta POST para analizar el documento
router.post('/analizar-pdf', authMiddleware, upload.single('documento'), analizarDocumento);

export default router;
