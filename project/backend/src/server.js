import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./database/index.js"; 
import authRoutes from './routes/auth.js';

dotenv.config({ path: '.env' });
const app = express();
app.use(express.json()); 
app.use(cors());
app.use('/api/auth', authRoutes);


app.get("/", (req, res) => {
    res.send("Servidor funcionando 🚀");
});


const PORT = process.env.PORT || 5000;

app.listen(PORT, async () => {
    // Conexión a la base de datos
    try {
        const result = await pool.query("SELECT NOW()");
        console.log("✅ DB conectada:", result.rows[0].now);
    } catch (err) {
        console.error("❌ Error DB:", err.message);
    }
    console.log(`Servidor corriendo en puerto ${PORT}`);
});

