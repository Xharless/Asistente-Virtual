import puppeteer from 'puppeteer';
import fs from 'fs/promises'; 
import path from 'path'; // Para manejar rutas de archivos
import { fileURLToPath } from 'url';
import pool from '../database/index.js'; // Importamos la conexión a la BD

// Helper para obtener la ruta absoluta (necesario en ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getPlantillas = async (req, res) => {
    try {
        // Ahora consultamos las plantillas directamente desde la base de datos
        const result = await pool.query('SELECT id, nombre_plantilla, descripcion, campos_requeridos FROM plantillas_documentos ORDER BY nombre_plantilla');
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener plantillas:", err.message);
        res.status(500).json({ error: "Error interno del servidor." });
    }
};

const generarDocumento = async (req, res) => {
    try {
        // 1. Obtenemos el ID de la plantilla de la URL
        const { plantillaId } = req.params;
        
        // 2. Obtenemos TODOS los datos del formulario
        const datos = req.body; 

        // 3. Buscamos la información de la plantilla en la BD, incluyendo el nombre del archivo
        const plantillaResult = await pool.query('SELECT archivo_plantilla FROM plantillas_documentos WHERE id = $1', [plantillaId]);
        if (plantillaResult.rows.length === 0) {
            return res.status(404).json({ error: "Plantilla no encontrada." });
        }
        const nombreArchivo = plantillaResult.rows[0].archivo_plantilla;
        const plantillaPath = path.resolve(__dirname, `../plantillas/${nombreArchivo}`);

        // 4. Leer la plantilla HTML
        let htmlContent = await fs.readFile(plantillaPath, 'utf8');

        // 5. Reemplazar los placeholders (ej: {{nombre_arrendador}}) con los datos
        Object.keys(datos).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(placeholder, datos[key] || ''); // Usamos || '' por si un dato viene vacío
        });

        // 6. Reemplazar placeholders automáticos como la fecha
        const fechaActual = new Date().toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' });
        htmlContent = htmlContent.replace(/{{fecha_contrato}}/g, fechaActual);
        htmlContent = htmlContent.replace(/{{fecha_firma}}/g, fechaActual);
        
        // 7. Usar Puppeteer para generar el PDF
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'Letter', // Usamos Letter (Carta) en vez de A4
            printBackground: true,
            margin: {
                top: '2.5cm',
                right: '2.5cm',
                bottom: '2.5cm',
                left: '2.5cm'
            }
        });
        await browser.close();

        // 8. Enviar el PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=documento_generado.pdf');
        res.send(pdfBuffer);

    } catch (err) {
        console.error("Error al generar documento:", err.message);
        res.status(500).json({ error: "Error interno del servidor al generar el PDF." });
    }
};

// Exportamos la función para que el router la use
export { generarDocumento, getPlantillas };
