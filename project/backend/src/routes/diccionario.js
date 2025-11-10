import { Router } from 'express';
import pool from '../database/index.js';

const router = Router();

router.get('/buscar', async (req, res) => {
    const { termino, letra } = req.query;
    
    try {
        let query = 'SELECT * FROM diccionario_terminos';
        const params = [];
        
        if (letra) {
            query += ' WHERE termino ILIKE $1';
            params.push(`${letra}%`);

        } else if (termino) {
            query += ' WHERE termino ILIKE $1 OR definicion ILIKE $1';
            params.push(`%${termino}%`);
        }

        query += ' ORDER BY termino ASC';
        const { rows: resultados } = await pool.query(query, params);
        res.json(resultados);

    } catch (error) {
        console.error('Error en la búsqueda del diccionario:', error);
        res.status(500).json({ error: 'Error en el servidor al realizar la búsqueda.' });
    }
});

export default router;
