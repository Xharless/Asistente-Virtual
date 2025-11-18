import pool from '../database/index.js';

const buscarTerminos = async (req, res) => {
    try {
        const { termino, letra } = req.query;
        let query;
        let queryParams;

        if (letra) {
            query = `
                SELECT id, termino, definicion, referencia_legal FROM diccionario_terminos 
                WHERE unaccent(termino) ILIKE $1
                ORDER BY termino;
            `;
            queryParams = [`${letra}%`];
        } else if (termino && termino.trim() !== '') {
            query = `
                SELECT id, termino, definicion, referencia_legal FROM diccionario_terminos 
                WHERE unaccent(termino) ILIKE $1
                ORDER BY termino
                LIMIT 20;
            `;
            queryParams = [`%${termino}%`];
        } else {
            return res.json([]);
        }
        
        const { rows } = await pool.query(query, queryParams);
        
        res.json(rows);

    } catch (err) {
        console.error(err.message);
        res.status(500).json({ error: 'Error interno del servidor al buscar términos.' });
    }
};

const agregarTermino = async (req, res) => {
    try {
        console.log("Datos recibidos en backend:", req.body);
        const { termino, definicion, referencia_legal } = req.body;

        if (!termino || !definicion || termino.trim() === '' || definicion.trim() === '') {
            return res.status(400).json({ error: 'El término y la definición son obligatorios.' });
        }

        const terminoFormateado = termino.charAt(0).toUpperCase() + termino.slice(1);

        const query = `
            INSERT INTO diccionario_terminos (termino, definicion, referencia_legal)
            VALUES ($1, $2, $3)
            RETURNING *;
        `;
        const { rows } = await pool.query(query, [terminoFormateado, definicion, referencia_legal || null]);
        res.status(201).json(rows[0]);
    } catch (err) {
        if (err.code === '23505') { 
            return res.status(409).json({ error: `El término "${req.body.termino}" ya existe.` });
        }
        console.error("Error al agregar término:", err.message);
        res.status(500).json({ error: 'Error interno al guardar el término.' });
    }
};

export { buscarTerminos, agregarTermino };