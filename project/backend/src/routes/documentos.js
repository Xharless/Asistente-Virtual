import express from 'express';
import { 
    generarDocumento, 
    getPlantillas, 
    crearPlantilla,
    actualizarPlantilla,
    eliminarPlantilla
} from '../controllers/documentoController.js';
import authMiddleware from '../middleware/authMiddleware.js'; // Si usas protección

const router = express.Router();

// 1. Obtener lista para el select
router.get('/plantillas', authMiddleware, getPlantillas);

// 2. Crear nueva plantilla
router.post('/crear', authMiddleware, crearPlantilla);

// 3. Actualizar plantilla existente
router.put('/actualizar/:plantillaId', authMiddleware, actualizarPlantilla);

// 4. Eliminar plantilla
router.delete('/eliminar/:plantillaId', authMiddleware, eliminarPlantilla);

// 5. Generar PDF usando una plantilla
router.post('/generar/:plantillaId', authMiddleware, generarDocumento);

export default router;