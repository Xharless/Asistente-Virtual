import puppeteer from 'puppeteer';
import fs from 'fs/promises'; 
import path from 'path';
import { fileURLToPath } from 'url'; 
import { PdfReader } from 'pdfreader';
import pool from '../database/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const escaparHTML = (str) => {
    if (!str) return '';
    return str.replace(/[&<>"']/g, (m) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;'
    })[m]);
};

const formatearFecha = (fecha) => {
    if (!fecha) return '';
    const d = new Date(typeof fecha === 'string' ? `${fecha}T00:00:00` : fecha);
    const dia = String(d.getDate()).padStart(2, '0');
    const mes = String(d.getMonth() + 1).padStart(2, '0'); 
    return `${dia}-${mes}-${d.getFullYear()}`;
};

function parsePdfBuffer(dataBuffer) {
    return new Promise((resolve, reject) => {
        let fullText = "";
        let lastY = -1;

        new PdfReader().parseBuffer(dataBuffer, (err, item) => {
            if (err) {
                reject(err);
            } else if (!item) {
                resolve(fullText);
            } else if (item.text) {
                if (lastY !== -1 && Math.abs(item.y - lastY) > 1) {
                    fullText += "\n"; 
                } else if (lastY !== -1) {
                    fullText += " "; 
                }
                
                fullText += item.text;
                lastY = item.y; 
            }
        });
    });
}

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
};

const analizarDocumento = async (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo." });
    }

    try {
        const dataBuffer = req.file.buffer;

        let textoCompleto = "";
        try {
            console.log("Procesando PDF...");
            textoCompleto = await parsePdfBuffer(dataBuffer);
            console.log("Texto extraído. Longitud:", textoCompleto.length);
        } catch (pdfErr) {
            console.error('Error leyendo el PDF:', pdfErr);
            throw new Error('No se pudo leer el contenido del PDF. ¿El archivo es válido?');
        }

        let textoPdfSeguro = escaparHTML(textoCompleto);

        const terminosResult = await pool.query('SELECT id, termino, definicion FROM diccionario_terminos ORDER BY LENGTH(termino) DESC');
        const terminosDb = terminosResult.rows;
        
        const glosario = [];
        const terminosEncontrados = new Set();
        let contadorGlosario = 1;

        terminosDb.forEach(item => {
            const terminoEscapado = item.termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const regex = new RegExp(`(^|[\\s\\n])(${terminoEscapado})(s|es)?(?=[\\s\\n.,;]|$)`, 'gi');
            
            const terminoLower = item.termino.toLowerCase();

            const replaceRegex = new RegExp(`\\b(${terminoEscapado})(s|es)?\\b`, 'gi');

            if (replaceRegex.test(textoPdfSeguro) && !terminosEncontrados.has(terminoLower)) {
                glosario.push({
                    numero: contadorGlosario,
                    termino: item.termino,
                    definicion: item.definicion
                });

                textoPdfSeguro = textoPdfSeguro.replace(replaceRegex, `<a href="#termino-${contadorGlosario}">$1$2 <sup>[${contadorGlosario}]</sup></a>`);
                
                terminosEncontrados.add(terminoLower);
                const palabrasDelTermino = item.termino.toLowerCase().split(' ');
                if (palabrasDelTermino.length > 1) {
                    palabrasDelTermino.forEach(palabra => {
                        if (palabra.length > 3) { 
                            terminosEncontrados.add(palabra); 
                        }
                    });
                }
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
        
        const glosarioHtml = glosario.map(g => `<li id="termino-${g.numero}"><strong>${g.numero}. ${g.termino}:</strong> ${g.definicion}</li>`).join('');
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