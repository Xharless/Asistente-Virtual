import puppeteer from 'puppeteer';
import fs from 'fs/promises'; 
import path from 'path'; // Para manejar rutas de archivos
import { fileURLToPath } from 'url';

// Helper para obtener la ruta absoluta (necesario en ES Modules)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// (Esta función busca el archivo HTML basado en el ID)
const getPlantillaPath = (plantillaId) => {
    // Aquí puedes tener tu lógica.
    // Ej: buscar en la BD el nombre del archivo.
    // Por ahora, lo hacemos simple:
    if (plantillaId === '1') {
        // Esta es la plantilla que tienes abierta
        return path.resolve(__dirname, '../plantillas/contrato_arriendo.html');
    }
    if (plantillaId === '2') {
        // (Deberías crear este archivo 'poder_simple.html' 
        //  con placeholders {{...}} en la carpeta plantillas)
        return path.resolve(__dirname, '../plantillas/poder_simple.html');
    }
    return null;
};

const getPlantillas = async (req, res) => {
    try {
        // Por ahora, devolvemos una lista estática.
        // En el futuro, esto podría venir de una base de datos.
        // ¡IMPORTANTE! La estructura ahora coincide con lo que el frontend espera.
        const plantillas = [
            { 
                id: '1', 
                nombre_plantilla: 'Contrato de Arriendo',
                descripcion: 'Genera un contrato de arriendo estándar para bienes inmuebles.',
                campos_requeridos: [
                    { nombre_campo: 'nombre_arrendador', label: 'Nombre del Arrendador', tipo: 'text' },
                    { nombre_campo: 'rut_arrendador', label: 'RUT del Arrendador', tipo: 'text' },
                    { nombre_campo: 'nombre_arrendatario', label: 'Nombre del Arrendatario', tipo: 'text' },
                    { nombre_campo: 'rut_arrendatario', label: 'RUT del Arrendatario', tipo: 'text' },
                    { nombre_campo: 'direccion_propiedad', label: 'Dirección de la Propiedad', tipo: 'text' },
                    { nombre_campo: 'monto_renta', label: 'Monto de la Renta (CLP)', tipo: 'number' },
                    { nombre_campo: 'fecha_inicio', label: 'Fecha de Inicio del Contrato', tipo: 'date' },
                ]
            },
            { 
                id: '2', 
                nombre_plantilla: 'Poder Simple',
                descripcion: 'Otorga facultades a un tercero para realizar trámites específicos.',
                campos_requeridos: [
                    { nombre_campo: 'nombre_mandante', label: 'Nombre de quien otorga el poder (Mandante)', tipo: 'text' },
                    { nombre_campo: 'rut_mandante', label: 'RUT del Mandante', tipo: 'text' },
                    { nombre_campo: 'nombre_mandatario', label: 'Nombre de quien recibe el poder (Mandatario)', tipo: 'text' },
                    { nombre_campo: 'rut_mandatario', label: 'RUT del Mandatario', tipo: 'text' },
                    { nombre_campo: 'facultades', label: 'Facultades Otorgadas (describir)', tipo: 'textarea' },
                ]
            }
        ];
        res.json(plantillas);
    } catch (err) {
        console.error("Error al obtener plantillas:", err.message);
        res.status(500).send("Error interno del servidor.");
    }
};

const generarDocumento = async (req, res) => {
    try {
        // 1. Obtenemos el ID de la plantilla de la URL
        const { plantillaId } = req.params;
        
        // 2. Obtenemos TODOS los datos del formulario
        const datos = req.body; 

        // 3. Buscamos la ruta del archivo HTML
        const plantillaPath = getPlantillaPath(plantillaId);
        if (!plantillaPath) {
            return res.status(404).json({ error: "Plantilla no encontrada." });
        }

        // 4. Leer la plantilla HTML
        let htmlContent = await fs.readFile(plantillaPath, 'utf8');

        // 5. Reemplazar los placeholders (ej: {{nombre_arrendador}}) con los datos
        Object.keys(datos).forEach(key => {
            const placeholder = new RegExp(`{{${key}}}`, 'g');
            htmlContent = htmlContent.replace(placeholder, datos[key] || ''); // Usamos || '' por si un dato viene vacío
        });
        
        // 6. Usar Puppeteer para generar el PDF
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

        // 7. Enviar el PDF como respuesta
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=documento_generado.pdf');
        res.send(pdfBuffer);

    } catch (err) {
        console.error("Error al generar documento:", err.message);
        res.status(500).send("Error interno del servidor al generar el PDF.");
    }
};

// Exportamos la función para que el router la use
export { generarDocumento, getPlantillas };
