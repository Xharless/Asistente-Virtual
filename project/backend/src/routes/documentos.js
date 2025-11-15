import express from 'express';
import { 
    generarDocumento, 
    getPlantillas, 
    crearPlantilla 
} from '../controllers/documentoController.js';
import authMiddleware from '../middleware/authMiddleware.js'; // Si usas protección

const router = express.Router();

// 1. Obtener lista para el select
router.get('/plantillas', authMiddleware, getPlantillas);

// 2. Crear nueva plantilla (La ruta que faltaba)
router.post('/crear', authMiddleware, crearPlantilla);

// 3. Generar PDF usando una plantilla
router.post('/generar/:plantillaId', authMiddleware, generarDocumento);

export default router;