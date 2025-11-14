// src/routes/diccionario.js (o como se llame tu archivo de ruta)
import { Router } from 'express';
import pool from '../database/index.js';

const router = Router();

// --- RUTA 1: BUSCAR (Para que se sigan viendo las palabras) ---
router.get('/buscar', async (req, res) => {
    const { termino, letra } = req.query;
    
    try {
        let query = 'SELECT * FROM diccionario_terminos';
        const params = [];
        
        if (letra) {
            query += ' WHERE unaccent(termino) ILIKE unaccent($1)';
            params.push(`${letra}%`);
        } else if (termino) {
            query += ' WHERE unaccent(termino) ILIKE unaccent($1) OR unaccent(definicion) ILIKE unaccent($1)';
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

// --- RUTA 2: AGREGAR (La nueva funcionalidad) ---
router.post('/agregar', async (req, res) => {
    const { termino, definicion, referencia_legal } = req.body;

    // Validación
    if (!termino || !definicion) {
        return res.status(400).json({ error: "El término y la definición son obligatorios." });
    }

    try {
        // Formateamos para que empiece con mayúscula
        const terminoFormateado = termino.charAt(0).toUpperCase() + termino.slice(1);

        const query = `
            INSERT INTO diccionario_terminos (termino, definicion, fuente) 
            VALUES ($1, $2, $3) 
            RETURNING *;
        `;
        
        const values = [terminoFormateado, definicion, referencia_legal || null];

        const result = await pool.query(query, values);

        res.status(201).json({
            message: "Término agregado exitosamente",
            termino: result.rows[0]
        });

    } catch (error) {
        console.error('Error al agregar término:', error);

        // Error de duplicados (código de Postgres)
        if (error.code === '23505') {
            return res.status(409).json({ error: "Este término ya existe en el diccionario." });
        }

        res.status(500).json({ error: 'Error interno al guardar el término.' });
    }
});

export default router;