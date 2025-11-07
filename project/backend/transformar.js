// 1. Usamos 'import' (sintaxis moderna) en lugar de 'require'
import fs from 'fs/promises'; // Usamos fs/promises para async/await

// 2. Importamos el JSON directamente. ¡Mucho más limpio!
// Asegúrate de que tu archivo se llame 'glosario_casi_listo.json'
import paginasGlosario from './glosario_bruto.json' with { type: 'json' };

const diccionarioFinal = [];

// Regex para extraer Referencias Legales
const regexReferencia = /(Artícul[oa]s?[\s\S]*?Constitución Política de la República|Art\..*)/i;

// 3. Iterar por cada objeto (página) en el array
for (const pagina of paginasGlosario) {
  
  // 4. Iterar por cada [termino, definicion] dentro de ese objeto
  for (const [termino, definicion] of Object.entries(pagina)) {
    
    // Ignorar los 'page_number' que quedaron
    if (termino === 'page_number') {
      continue;
    }

    let definicionLimpia = definicion;
    let referenciaLimpia = null;

    // 5. Extraer la Referencia Legal (Cumple tu Criterio de Aceptación)
    const match = definicionLimpia.match(regexReferencia);
    if (match) {
      referenciaLimpia = match[0].trim().replace(/\.$/, ''); // Quita el punto final
      // Quitar la referencia de la definición
      definicionLimpia = definicionLimpia.replace(regexReferencia, '').trim().replace(/\.$/, '');
    }

    // Limpiar saltos de línea y espacios múltiples
    definicionLimpia = definicionLimpia.replace(/\n/g, ' ').replace(/\s+/g, ' ');

    // 6. Añadir al array final con la ESTRUCTURA CORRECTA
    diccionarioFinal.push({
      termino: termino,
      definicion: definicionLimpia,
      referencia_legal: referenciaLimpia
      // Nota: Aún nos falta la 'categoria', pero la estructura es correcta.
    });
  }
}

// 7. Guardar el JSON 100% listo (ahora es asíncrono)
try {
  await fs.writeFile('glosario_FINAL.json', JSON.stringify(diccionarioFinal, null, 2), 'utf-8');
  console.log(`¡Transformación completada! Se guardó 'glosario_FINAL.json' con ${diccionarioFinal.length} términos.`);
  console.log("Este archivo SÍ está listo para cargar en la base de datos.");
} catch (err) {
  console.error("Error al guardar el archivo:", err);
}