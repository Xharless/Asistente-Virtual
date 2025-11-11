// Script para probar cómo se carga pdf-parse
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const pdfModule = require('pdf-parse');

console.log('=== PDF-PARSE LOADING TEST ===');
console.log('typeof pdfModule:', typeof pdfModule);
console.log('Object.keys(pdfModule):', Object.keys(pdfModule).slice(0, 10)); // primeras 10 claves
console.log('pdfModule.default:', typeof pdfModule.default);
console.log('pdfModule.toString().slice(0, 100):', pdfModule.toString().slice(0, 100));

// Intentar usarlo
const pdf = typeof pdfModule === 'function' ? pdfModule : pdfModule.default;
console.log('typeof pdf (final):', typeof pdf);
