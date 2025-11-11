import puppeteer from 'puppeteer';
import fs from 'fs/promises'; 
import path from 'path'; // Para manejar rutas de archivos
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import pool from '../database/index.js'; // Importamos la conexión a la BD

// `pdf-parse` is a CommonJS module, use createRequire to import it
const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');
// pdf-parse puede exportar la función directamente o como .default
const pdf = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
console.log('[DEBUG] pdf-parse loaded, typeof pdf:', typeof pdf);

// Helper para obtener la ruta absoluta (necesario en ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- FUNCIÓN AUXILIAR PARA FORMATEAR FECHAS A DD-MM-AAAA ---
const formatearFecha = (fecha) => {
    if (!fecha) return '';
    // Si la fecha es un string (ej: '2024-07-26'), la convertimos a objeto Date
    // El 'T00:00:00' evita problemas de zona horaria (UTC)
    const d = new Date(typeof fecha === 'string' ? `${fecha}T00:00:00` : fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0'); // getMonth() es 0-indexado
    return `${dia}-${mes}-${d.getFullYear()}`;
};

const getPlantillas = async (req, res) => {
    try {
        // Ahora consultamos las plantillas directamente desde la base de datos
        const result = await pool.query('SELECT id, nombre_plantilla, descripcion, campos_requeridos FROM plantillas_documentos ORDER BY nombre_plantilla');
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener plantillas:", err.message);
        res.status(500).json({ error: "Error interno del servidor al obtener las plantillas." });
    }
};

const generarDocumento = async (req, res) => {
    try {
        // 1. Obtenemos el ID de la plantilla de la URL
        const { plantillaId } = req.params;
        
        // 2. Obtenemos TODOS los datos del formulario
        const datos = req.body; 

        // 3. Buscamos la información de la plantilla en la BD, incluyendo el nombre del archivo
        const plantillaResult = await pool.query('SELECT archivo_plantilla, campos_requeridos FROM plantillas_documentos WHERE id = $1', [plantillaId]);
        if (plantillaResult.rows.length === 0) {
            return res.status(404).json({ error: "Plantilla no encontrada." });
        }
        const nombreArchivo = plantillaResult.rows[0].archivo_plantilla;
        const plantillaPath = path.resolve(__dirname, `../plantillas/${nombreArchivo}`);

        // 4. Leer la plantilla HTML
        let htmlContent = await fs.readFile(plantillaPath, 'utf8');

        // 5. Reemplazar los placeholders con los datos, formateando las fechas
        const campos = plantillaResult.rows[0].campos_requeridos;
        Object.keys(datos).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            const campoDef = campos.find(c => c.nombre_campo === key);
            let valor = datos[key] || '';

            // Si el campo es de tipo 'date', lo formateamos
            if (campoDef && campoDef.tipo === 'date' && valor) {
                valor = formatearFecha(valor);
            }
            htmlContent = htmlContent.replace(placeholder, valor);
        });

        // 6. Reemplazar placeholders automáticos como la fecha
        htmlContent = htmlContent.replace(/{{fecha_actual}}/g, formatearFecha(new Date()));
        
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
        // Aseguramos que la respuesta de error sea siempre JSON
        res.status(500).json({ error: "Error interno del servidor al generar el documento." });
    }
};

const analizarDocumento = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo." });
    }

    try {
        const dataBuffer = req.file.buffer;
        if (typeof pdf !== 'function') {
            // Mejor mensaje si la importación no es correcta
            throw new Error('pdf-parse no está cargado correctamente: `pdf` no es una función');
        }

        let data;
        try {
            data = await pdf(dataBuffer);
        } catch (pdfErr) {
            console.error('Error al parsear PDF con pdf-parse:', pdfErr);
            throw pdfErr; // relanzamos para que el catch externo lo capture y responda 500
        }
        let textoPdf = data.text;
        const terminosResult = await pool.query('SELECT id, termino, definicion FROM diccionario_terminos ORDER BY LENGTH(termino) DESC');
        const terminosDb = terminosResult.rows;
        const glosario = [];
        const terminosEncontrados = new Set();
        let contadorGlosario = 1;

        terminosDb.forEach(item => {
            // Escapamos caracteres especiales del término para que no rompan la RegExp
            const terminoEscapado = item.termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${terminoEscapado})\\b`, 'gi');
            const terminoLower = item.termino.toLowerCase();

            if (regex.test(textoPdf) && !terminosEncontrados.has(terminoLower)) {
                glosario.push({
                    numero: contadorGlosario,
                    termino: item.termino,
                    definicion: item.definicion
                });

                textoPdf = textoPdf.replace(regex, `$1 <sup>[${contadorGlosario}]</sup>`);
                
                terminosEncontrados.add(terminoLower);
                contadorGlosario++;
            }
        });

        if (glosario.length === 0) {
            return res.status(404).json({ error: "No se encontraron términos legales conocidos en el documento." });
        }

        const plantillaPath = path.resolve(__dirname, '../plantillas/documento_anotado.html');
        let htmlContent = await fs.readFile(plantillaPath, 'utf8');

        htmlContent = htmlContent.replace('{{contenido_pdf}}', textoPdf.replace(/\n/g, '<br>'));
        const glosarioHtml = glosario.map(g => `<li><strong>${g.termino}:</strong> ${g.definicion}</li>`).join('');
        htmlContent = htmlContent.replace('{{glosario}}', glosarioHtml);

        const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({ format: 'Letter', printBackground: true, margin: { top: '2.5cm', right: '2.5cm', bottom: '2.5cm', left: '2.5cm' } });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=documento_anotado.pdf');
        res.send(pdfBuffer);

    } catch (err) {
        // Logueamos el error completo para diagnóstico en desarrollo
        console.error("Error al analizar documento:", err);
        // Aseguramos que la respuesta de error sea siempre JSON
        res.status(500).json({ error: "Error interno del servidor al analizar el PDF." });
    }
};


export { generarDocumento, getPlantillas, analizarDocumento };
