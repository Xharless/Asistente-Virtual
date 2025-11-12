import puppeteer from 'puppeteer';
import fs from 'fs/promises'; 
import path from 'path';
import { fileURLToPath } from 'url'; 
import { PdfReader } from 'pdfreader';
import pool from '../database/index.js';

// [CORRECCIÓN 1]: Eliminado el console.log roto que hacía referencia a 'pdf'.
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Función auxiliar para seguridad HTML
const escaparHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
};

// Función auxiliar para formatear fechas
const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(typeof fecha === 'string' ? `${fecha}T00:00:00` : fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0'); 
    return `${dia}-${mes}-${d.getFullYear()}`;
};

const getPlantillas = async (req, res) => {
    try {
        const result = await pool.query('SELECT id, nombre_plantilla, descripcion, campos_requeridos FROM plantillas_documentos ORDER BY nombre_plantilla');
        res.json(result.rows);
    } catch (err) {
        console.error("Error al obtener plantillas:", err.message);
        res.status(500).json({ error: "Error interno del servidor al obtener las plantillas." });
    }
};

const generarDocumento = async (req, res) => {
    try {
        const { plantillaId } = req.params;
        const datos = req.body; 
        const plantillaResult = await pool.query('SELECT archivo_plantilla, campos_requeridos FROM plantillas_documentos WHERE id = $1', [plantillaId]);
        if (plantillaResult.rows.length === 0) {
            return res.status(404).json({ error: "Plantilla no encontrada." });
        }
        const nombreArchivo = plantillaResult.rows[0].archivo_plantilla;
        const plantillaPath = path.resolve(__dirname, `../plantillas/${nombreArchivo}`);
        let htmlContent = await fs.readFile(plantillaPath, 'utf8');
        const campos = plantillaResult.rows[0].campos_requeridos;
        Object.keys(datos).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            const campoDef = campos.find(c => c.nombre_campo === key);
            let valor = datos[key] || '';

            if (campoDef && campoDef.tipo === 'date' && valor) {
                valor = formatearFecha(valor);
            }
            htmlContent = htmlContent.replace(placeholder, valor);
        });

        htmlContent = htmlContent.replace(/{{fecha_actual}}/g, formatearFecha(new Date()));
        
        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({
            format: 'Letter',
            printBackground: true,
            margin: {
                top: '2.5cm',
                right: '2.5cm',
                bottom: '2.5cm',
                left: '2.5cm'
            }
        });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=documento_generado.pdf');
        res.send(pdfBuffer);

    } catch (err) {
        console.error("Error al generar documento:", err.message);
        res.status(500).json({ error: "Error interno del servidor al generar el documento." });
    }
    // [CORRECCIÓN 2]: Eliminada la línea de abajo que causaba el error "Headers already sent".
    // res.status(501).json({ message: "Función generarDocumento pendiente de implementación en este bloque" });
};

const analizarDocumento = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo." });
    }

    try {
        const dataBuffer = req.file.buffer;

        // Usamos una promesa para procesar el buffer del PDF con pdfreader
        const textoPdf = await new Promise((resolve, reject) => {
            let textoCompleto = "";
            new PdfReader().parseBuffer(dataBuffer, (err, item) => {
                if (err) {
                    reject(err);
                } else if (!item) {
                    // Fin del archivo, resolvemos con el texto acumulado
                    resolve(textoCompleto);
                } else if (item.text) {
                    // Acumulamos el texto de cada item
                    textoCompleto += item.text + " ";
                }
            });
        }).catch(err => {
            throw new Error('Falló la lectura del archivo PDF. ¿Es un PDF válido?');
        });

        let textoPdfSeguro = escaparHTML(textoPdf); 

        const terminosResult = await pool.query('SELECT id, termino, definicion FROM diccionario_terminos ORDER BY LENGTH(termino) DESC');
        const terminosDb = terminosResult.rows;
        
        const glosario = [];
        const terminosEncontrados = new Set();
        let contadorGlosario = 1;

        terminosDb.forEach(item => {
            const terminoEscapado = item.termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`\\b(${terminoEscapado})(s|es)?\\b`, 'gi');
            const terminoLower = item.termino.toLowerCase();

            if (regex.test(textoPdfSeguro) && !terminosEncontrados.has(terminoLower)) {
                glosario.push({
                    numero: contadorGlosario,
                    termino: item.termino,
                    definicion: item.definicion
                });
                textoPdfSeguro = textoPdfSeguro.replace(regex, `$1$2 <sup>[${contadorGlosario}]</sup>`);
                terminosEncontrados.add(terminoLower);
                contadorGlosario++;
            }
        });

        if (glosario.length === 0) {
            return res.status(404).json({ error: "No se encontraron términos legales conocidos en el documento." });
        }

        const plantillaPath = path.resolve(__dirname, '../plantillas/documento_anotado.html');
        
        try {
            await fs.access(plantillaPath);
        } catch {
            throw new Error(`No se encuentra la plantilla HTML en: ${plantillaPath}`);
        }

        let htmlContent = await fs.readFile(plantillaPath, 'utf8');

        htmlContent = htmlContent.replace('{{contenido_pdf}}', textoPdfSeguro.replace(/\n/g, '<br>'));
        const glosarioHtml = glosario.map(g => `<li><strong>${g.termino}:</strong> ${g.definicion}</li>`).join('');
        htmlContent = htmlContent.replace('{{glosario}}', glosarioHtml);

        const browser = await puppeteer.launch({ 
            headless: true, 
            args: ['--no-sandbox', '--disable-setuid-sandbox'] 
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        
        const pdfBuffer = await page.pdf({ 
            format: 'Letter', 
            printBackground: true, 
            margin: { top: '2.5cm', right: '2.5cm', bottom: '2.5cm', left: '2.5cm' } 
        });
        
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=documento_anotado.pdf');
        res.send(pdfBuffer);

    } catch (err) {
        console.error("Error crítico en analizarDocumento:", err);
        res.status(500).json({ error: err.message || "Error interno del servidor al analizar el PDF." });
    }
};

export { generarDocumento, getPlantillas, analizarDocumento };