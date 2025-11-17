// Cargar imágenes de Revisar Causa
export function cargarRevisarCausa() {
  const images = import.meta.glob(
    "/src/assets/guia/revisarCausa/*.{png,jpg,jpeg,webp}",
    { eager: true }
  );

  let lista = Object.keys(images).map((key) => images[key].default);

  lista.sort((a, b) => {
    const numA = a.match(/(\d+)/)?.[1];
    const numB = b.match(/(\d+)/)?.[1];
    return Number(numA) - Number(numB);
  });

  return lista;
}


// Cargar imágenes de Enviar Escrito
export function cargarEnviarEscrito() {
  const images = import.meta.glob(
    "/src/assets/guia/enviarEscrito/*.{png,jpg,jpeg,webp}",
    { eager: true }
  );

  const lista = Object.keys(images).map((key) => images[key].default);

  lista.sort((a, b) => {
    const numA = a.match(/(\d+)\./)?.[1];
    const numB = b.match(/(\d+)\./)?.[1];
    return Number(numA) - Number(numB);
  });

  return lista;
}

// Cargar imágenes de Revisar Escrito
export function cargarRevisarEscrito() {
  const images = import.meta.glob(
    "/src/assets/guia/revisarEscrito/*.{png,jpg,jpeg,webp}",
    { eager: true }
  );

  let lista = Object.keys(images).map((key) => images[key].default);

  lista.sort((a, b) => {
    const numA = a.match(/(\d+)/)?.[1];
    const numB = b.match(/(\d+)/)?.[1];
    return Number(numA) - Number(numB);
  });

  return lista;
}


export const descripcionesRevisar = [
  "Inicie sesión en la página de la Oficina Judicial Virtual, presionando el botón 'Todos los servicios', e ingresando con la Clave del Poder Judicial.",
  "Seleccione el botón 'Mis Causas', que se encuentra arriba a la izquierda en la ventana principal.",
  "Seleccione la Competencia de la causa a revisar, por ejemplo 'Familia'.",
  "Active el botón 'Filtros'. Para asegurarse de que está activado, el botón debe estar de color verde.",
  "Asegurese de que en la sección 'Estado' tenga selccionados los 12 estados de tramitación.",
  "Presione el botón 'Buscar', que se ubica en la parte inferior de la pantalla.",
  "Podrá visualizar todas sus causas. Para ver más detalles sobre una causa en particular, debe apretar la lupa correspondiente a la causa.",
  "Se abrirá una ventana con todos los detalles de la causa. Si necesita revisar cada documento, debe seleccionar el botón que se encuentra en la columna 'Doc.'"
];

export const descripcionesEscrito = [
  "Inicie sesión en la página de la Oficina Judicial Virtual, presionando el botón 'Todos los servicios', e ingresando con la Clave del Poder Judicial.",
  "Seleccione el botón 'Ing. Demandas y Escritos', que se encuentra abajo a la izquierda en la ventana principal.",
  "Presione el botón 'Ingresar Escrito', que se encuentra a la izquierda.",
  "Seleccione la Competencia del escrito, por ejemplo 'Garantía'.",
  "Seleccione el Tribunal al cual corresponda el escrito.",
  "Ingrese el RIT (Rol Interno del Tribunal), empezando por el tipo, por ejemplo 'Oridinario'.",
  "Ingrese el número de rol.",
  "Seleccione el año.",
  "Presione el botón 'Consulta Rol'.",
  "En el recuadro 'Parte que Presenta', debe seleccionarse a usted.",
  "En el recuadro 'Tipo Escrito', debe seleccionar el que más se asemeje a su caso.",
  "Presione el botón 'Grabar Escrito', que se encuentra en la parte inferior de la pantalla.",
  "Se abrirá una nueva ventana. Diríjase al recuadro de la izquierda correspondiente a 'Adjuntar escrito', y apriete el botón 'Adjuntar'.",
  "Seleccione el documento correspondiente al escrito.",
  "Si necesita adjuntar mayor documentación, diríjase al recuadro de la derecha correspondiente a 'Adjuntar documentos', y complete 'Referencia.(*)' con un nombre representativo para el documento, por ejemplo, 'Constancia'. (Si no necesita agregar documentos anexos, omita este paso.)",
  "Seleccione el tipo de documento correspondiente. (Si no necesita agregar documentos anexos, omita este paso.)",
  "Apriete el botón 'Adjuntar'. (Si no necesita agregar documentos anexos, omita este paso.)",
  "Seleccione el documento correspondiente al anexo. (Si no necesita agregar documentos anexos, omita este paso.)",
  "Presione el botón 'Cerrar y Continuar'.",
  "Presione el botón 'Bandeja Escrito', que se encuentra a la izquierda.",
  "Seleccione la Competencia del escrito, por ejemplo 'Garantía'.",
  "Presione el botón 'Consultar Escritos'.",
  "En 'Escritos No Enviados', encontrará el listado de escritos pendientes. Encontrará un cuadrado adelante del escrito que necesita enviar, debe seleccionarlo.",
  "Presione el botón 'Enviar Poder Judicial', que se encuentra en la parte inferior derecha de la pantalla.",
  "Verá una ventana de 'Aviso', en ella debe presionar el botón 'Enviar'.",
  "Con esto tendrá su escrito enviado éxitosamente."
];

export const descripcionesRevEscrito = [
  "Inicie sesión en la página de la Oficina Judicial Virtual, presionando el botón 'Todos los servicios', e ingresando con la Clave del Poder Judicial.",
  "Seleccione el botón 'Ing. Demandas y Escritos', que se encuentra abajo a la izquierda en la ventana principal.",
  "Presione el botón 'Bandeja Escrito', que se encuentra a la izquierda.",
  "Seleccione la Competencia del escrito, por ejemplo 'Garantía'.",
  "Presione el botón 'Consultar Escritos'.",
  "Apriete el botón 'Escritos Enviados', que encontrará abajo a la derecha.",
  "Encontrará un botón adelante del escrito que necesita revisar, debe presionarlo.",
  "Se abrirá el documento correspondiente."
];



