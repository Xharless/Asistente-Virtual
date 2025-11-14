import { Router } from 'express';
import pool from '../database/index.js';

const router = Router();

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

router.post('/agregar', async (req, res) => {
    const { termino, definicion, referencia_legal } = req.body;

    if (!termino || !definicion) {
        return res.status(400).json({ error: "El término y la definición son obligatorios." });
    }

    try {
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

        if (error.code === '23505') {
            return res.status(409).json({ error: "Este término ya existe en el diccionario." });
        }

        res.status(500).json({ error: 'Error interno al guardar el término.' });
    }
});

router.put('/editar/:id', async (req, res) => {
    const { id } = req.params; 
    const { termino, definicion, referencia_legal } = req.body; 

    if (!termino || !definicion) {
        return res.status(400).json({ error: "El término y la definición son obligatorios." });
    }

    try {
        const terminoFormateado = termino.charAt(0).toUpperCase() + termino.slice(1);

        const query = `
            UPDATE diccionario_terminos 
            SET termino = $1, definicion = $2, fuente = $3
            WHERE id = $4
            RETURNING *;
        `;
        
        const values = [terminoFormateado, definicion, referencia_legal || null, id];

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Término no encontrado." });
        }

        res.status(200).json({
            message: "Término actualizado exitosamente",
            termino: result.rows[0]
        });

    } catch (error) {
        console.error('Error al editar término:', error);
        if (error.code === '23505') {
            return res.status(409).json({ error: "Este término ya existe." });
        }
        res.status(500).json({ error: 'Error interno al editar el término.' });
    }
});


router.delete('/eliminar/:id', async (req, res) => {
    const { id } = req.params; 

    try {
        const query = `
            DELETE FROM diccionario_terminos 
            WHERE id = $1
            RETURNING *;
        `;
        
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: "Término no encontrado." });
        }

        res.status(200).json({ message: "Término eliminado exitosamente" });

    } catch (error) {
        console.error('Error al eliminar término:', error);
        res.status(500).json({ error: 'Error interno al eliminar el término.' });
    }
});


export default router;