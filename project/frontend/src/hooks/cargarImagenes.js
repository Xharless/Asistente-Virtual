// Cargar imágenes de Revisar Causa
export function cargarRevisarCausa() {
  const images = import.meta.glob(
    "/src/assets/guia/revisarCausa/*.{png,jpg,jpeg,webp}",
    { eager: true }
  );

  return Object.keys(images)
    .sort()
    .map((key) => images[key].default);
}

// Cargar imágenes de Enviar Escrito
export function cargarEnviarEscrito() {
  const images = import.meta.glob(
    "/src/assets/guia/enviarEscrito/*.{png,jpg,jpeg,webp}",
    { eager: true }
  );

  return Object.keys(images)
    .sort()
    .map((key) => images[key].default);
}

export const descripcionesRevisar = [
  "Ingresa al sitio de la OJV.",
  "Accede al menú principal.",
  "Selecciona la opción Revisar Causa.",
  "Busca tu causa por RIT o tribunal.",
];

export const descripcionesEscrito = [
  "Inicia sesión y entra al menú de Escritos.",
  "Presiona Nuevo escrito.",
  "Selecciona tribunal y causa.",
  "Adjunta el archivo y envíalo.",
];


