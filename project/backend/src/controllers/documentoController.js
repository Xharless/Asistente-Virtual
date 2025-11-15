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

const quitarTildes = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
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

const crearPlantilla = async (req, res) => {
    const { nombre_plantilla, descripcion, contenido_html, campos_requeridos } = req.body;

    try {
        // Convertimos el array de campos a JSON para guardarlo en Postgres
        const camposJson = JSON.stringify(campos_requeridos);

        const query = `
            INSERT INTO plantillas_documentos 
            (nombre_plantilla, descripcion, contenido, campos_requeridos)
            VALUES ($1, $2, $3, $4)
            RETURNING *;
        `;

        const values = [nombre_plantilla, descripcion, contenido_html, camposJson];
        
        const result = await pool.query(query, values);
        
        res.status(201).json(result.rows[0]);

    } catch (err) {
        console.error("Error creando plantilla:", err);
        res.status(500).json({ error: "No se pudo guardar la plantilla." });
    }
};
const generarDocumento = async (req, res) => {
    try {
        const { plantillaId } = req.params;
        const datos = req.body; 
        // Corregimos la consulta para obtener el contenido HTML directamente de la BD
        const plantillaResult = await pool.query('SELECT contenido, campos_requeridos, nombre_plantilla FROM plantillas_documentos WHERE id = $1', [plantillaId]);
        
        if (plantillaResult.rows.length === 0) {
            return res.status(404).json({ error: "Plantilla no encontrada." });
        }

        let htmlContent = plantillaResult.rows[0].contenido;
        const campos = plantillaResult.rows[0].campos_requeridos;

        campos.forEach(campoDef => {
            const key = campoDef.nombre_campo;
            const placeholder = new RegExp(`{{${key}}}`, 'g');
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

        const textoPdfOriginal = escaparHTML(textoCompleto);
        const textoPdfSinTildes = quitarTildes(textoPdfOriginal);

        const terminosResult = await pool.query('SELECT id, termino, definicion FROM diccionario_terminos ORDER BY LENGTH(termino) DESC');
        const terminosDb = terminosResult.rows;
        
        const glosario = [];
        const terminosEncontrados = new Set();
        let textoPdfAnotado = textoPdfOriginal;
        let contadorGlosario = 1;

        terminosDb.forEach(item => {
            const terminoSinTildes = quitarTildes(item.termino);
            const terminoEscapado = terminoSinTildes.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            const searchRegex = new RegExp(`\\b(${terminoEscapado})(s|es)?\\b`, 'gi');
            
            const terminoLower = item.termino.toLowerCase();

            const testRegex = new RegExp(`\\b(${terminoEscapado})(s|es)?\\b`, 'gi');

            const replaceRegex = new RegExp(`\\b(${item.termino.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})(s|es)?\\b`, 'gi');

            if (testRegex.test(textoPdfSinTildes) && !terminosEncontrados.has(terminoLower)) {
                glosario.push({
                    numero: contadorGlosario,
                    termino: item.termino,
                    definicion: item.definicion
                });
                
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

                textoPdfAnotado = textoPdfAnotado.replace(replaceRegex, (match, p1, p2) => {
                    return `<a href="#termino-${glosario[glosario.length - 1].numero}">${match} <sup>[${glosario[glosario.length - 1].numero}]</sup></a>`;
                });
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

        htmlContent = htmlContent.replace('{{contenido_pdf}}', textoPdfAnotado.replace(/\n/g, '<br>'));
        
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

export { generarDocumento, getPlantillas, analizarDocumento, crearPlantilla };