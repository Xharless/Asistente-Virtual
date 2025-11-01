import { Router } from 'express';
import pool from '../database/index.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const router = Router();


router.post('/register', async (req, res) => {
    try {
        const { nombre_completo, email, contrasena } = req.body;
        const userExists = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ error: "El email ya está registrado." });
        }

        const salt = await bcrypt.genSalt(10);
        const contrasena_hash = await bcrypt.hash(contrasena, salt);

        const newUser = await pool.query(
            "INSERT INTO usuarios (nombre_completo, email, contrasena_hash) VALUES ($1, $2, $3) RETURNING id, email",
            [nombre_completo, email, contrasena_hash]
        );

        res.status(201).json(newUser.rows[0]);

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el servidor");
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, contrasena } = req.body;

        const user = await pool.query("SELECT * FROM usuarios WHERE email = $1", [email]);
        if (user.rows.length === 0) {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

        const usuarioEncontrado = user.rows[0];

        const contrasenaValida = await bcrypt.compare(contrasena, usuarioEncontrado.contrasena_hash);
        
        if (!contrasenaValida) {
            return res.status(401).json({ error: "Credenciales inválidas." });
        }

        const payload = {
            usuario: {
                id: usuarioEncontrado.id,
                email: usuarioEncontrado.email
            }
        };

        const token = jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '1h' }     
        );
        
        res.json({ token });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Error en el servidor");
    }
});


export default router;
