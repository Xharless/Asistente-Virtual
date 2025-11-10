import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);       
const envPath = path.resolve(__dirname, '../../.env');
dotenv.config({ path: envPath });

import { Pool } from 'pg';
import glosario from '../../glosario_FINAL.json' with { type: 'json' };

const pool = new Pool({
    user: process.env.DB_USER,     
    host: process.env.DB_HOST,     
    database: process.env.DB_DATABASE,
    password: process.env.DB_PASSWORD,
    port: 5432,           
});

async function cargarDatos() {
    const client = await pool.connect();
    console.log("Conectado a la base de datos...");

    try {
        await client.query('BEGIN');
        console.log("Iniciando transacción. Cargando términos en 'diccionario_terminos'...");

        const insertQuery = `
        INSERT INTO diccionario_terminos (termino, definicion, categoria, fuente)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (termino) DO NOTHING;
        `;
        
        let contador = 0;
        for (const item of glosario) {
        await client.query(insertQuery, [
            item.termino,            
            item.definicion,
            null,
            item.referencia_legal
        ]);
        contador++;
        }

        await client.query('COMMIT');
        console.log(`¡Éxito! Transacción completada. Se procesaron ${contador} términos.`);

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error en la transacción. Se hizo ROLLBACK.', err.stack);
    } finally {
        client.release();
        await pool.end();
        console.log("Desconectado de la base de datos. Proceso terminado.");
    }
}

cargarDatos();