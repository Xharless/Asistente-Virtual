import pool from '../database/index.js';

export const buscarTerminos = async (req, res) => {
    try {
        const { termino } = req.query;

        if (!termino || termino.trim() === '') {
            return res.json([]); 
        }

        const query = `
            SELECT id, termino, definicion, referencia_legal FROM diccionario_terminos 
            WHERE unaccent(termino) ILIKE unaccent($1)
            ORDER BY termino
            LIMIT 20;
        `;
        
        const { rows } = await pool.query(query, [`%${termino}%`]);
        
        res.json(rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error interno del servidor al buscar términos.' });
    }
};