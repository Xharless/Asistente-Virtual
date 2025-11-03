import pkg from "pg";
import dotenv from "dotenv";

dotenv.config();
const { Pool } = pkg;

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

pool.on('connect', (client) => {
    client.query(`SET client_encoding TO 'UTF8';`);
});
export default pool;