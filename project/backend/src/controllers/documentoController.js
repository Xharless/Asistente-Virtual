import puppeteer from 'puppeteer';

const generarDocumento = async (req, res) => {
    // 1. Extraer los datos del cuerpo de la petición (del formulario del frontend)
    const { nombreCliente, rutCliente, nombreAbogado, descripcionCaso } = req.body;

    // Validación simple de datos
    if (!nombreCliente || !rutCliente || !nombreAbogado || !descripcionCaso) {
        return res.status(400).json({ error: 'Faltan datos para generar el documento.' });
    }

    // 2. Crear el contenido HTML del documento usando una plantilla
    const contenidoHtml = `
        <!DOCTYPE html>
        <html lang="es">
        <head>
            <meta charset="UTF-8">
            <title>Poder Simple</title>
            <style>
                body { font-family: 'Times New Roman', serif; margin: 40px; }
                h1 { text-align: center; text-decoration: underline; }
                p { text-align: justify; line-height: 1.5; }
            </style>
        </head>
        <body>
            <h1>PODER SIMPLE</h1>
            <p>
                Yo, <strong>${nombreCliente}</strong>, cédula de identidad número <strong>${rutCliente}</strong>,
                por el presente instrumento, confiero poder simple pero tan amplio y bastante como en
                derecho se requiera a don(a) <strong>${nombreAbogado}</strong>, para que en mi nombre y
                representación tramite el siguiente asunto: <strong>${descripcionCaso}</strong>.
            </p>
            <br><br><br>
            <p>_________________________</p>
            <p><strong>${nombreCliente}</strong></p>
        </body>
        </html>
    `;

    // 3. Usar Puppeteer para generar el PDF
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.setContent(contenidoHtml, { waitUntil: 'networkidle0' });
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });
    await browser.close();

    // 4. Enviar el PDF como respuesta
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=documento-legal.pdf'); // Sugiere un nombre de archivo
    res.send(pdfBuffer);
};

export { generarDocumento };

