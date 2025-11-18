import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});
// Sanity-check minimal de variables de entorno para ayudar a depurar errores de auth SASL
if (process.env.DATABASE_URL) {
    try {
        // no imprimimos la URL completa (contiene credenciales), solo su tipo y longitud
        console.log('DATABASE_URL presente, tipo:', typeof process.env.DATABASE_URL, 'longitud:', String(process.env.DATABASE_URL).length);
    } catch (e) {
        console.log('Error comprobando DATABASE_URL:', e);
    }
} else {
    console.warn('DATABASE_URL no está definida en el entorno');
}

pool.on('connect', (client) => {
    client.query(`SET client_encoding TO 'UTF8';`);
});
export default pool;