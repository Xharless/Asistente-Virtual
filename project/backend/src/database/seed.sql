-- Borra los datos existentes para evitar duplicados si se ejecuta varias veces
DELETE FROM plantillas_documentos;

-- Inserta la plantilla de Contrato de Arriendo
INSERT INTO plantillas_documentos (nombre_plantilla, descripcion, campos_requeridos, archivo_plantilla) VALUES
(
    'Contrato de Arriendo',
    'Genera un contrato de arriendo estándar para bienes inmuebles.',
    '[
        { "nombre_campo": "nombre_arrendador", "label": "Nombre Completo (Arrendador)", "tipo": "text" },
        { "nombre_campo": "rut_arrendador", "label": "RUT (Arrendador)", "tipo": "text" },
        { "nombre_campo": "nacionalidad_arrendador", "label": "Nacionalidad (Arrendador)", "tipo": "text" },
        { "nombre_campo": "domicilio_arrendador", "label": "Domicilio (Arrendador)", "tipo": "text" },
        { "nombre_campo": "nombre_arrendatario", "label": "Nombre Completo (Arrendatario)", "tipo": "text" },
        { "nombre_campo": "rut_arrendatario", "label": "RUT (Arrendatario)", "tipo": "text" },
        { "nombre_campo": "nacionalidad_arrendatario", "label": "Nacionalidad (Arrendatario)", "tipo": "text" },
        { "nombre_campo": "domicilio_arrendatario", "label": "Domicilio (Arrendatario)", "tipo": "text" },
        { "nombre_campo": "direccion_propiedad", "label": "Dirección de la Propiedad a arrendar", "tipo": "text" },
        { "nombre_campo": "comuna_propiedad", "label": "Comuna de la Propiedad", "tipo": "text" },
        { "nombre_campo": "monto_renta", "label": "Monto del arriendo (en números, ej: 350.000)", "tipo": "number" },
        { "nombre_campo": "monto_renta_palabras", "label": "Monto del arriendo (en palabras, ej: trescientos cincuenta mil pesos)", "tipo": "text" },
        { "nombre_campo": "ciudad_contrato", "label": "Ciudad donde se firma el contrato", "tipo": "text" },
        { "nombre_campo": "plazo_contrato", "label": "Plazo del contrato (en meses)", "tipo": "number" },
        { "nombre_campo": "fecha_inicio", "label": "Fecha de inicio del arriendo", "tipo": "date" },
        { "nombre_campo": "fecha_termino", "label": "Fecha de término del arriendo", "tipo": "date" },
        { "nombre_campo": "monto_garantia", "label": "Monto de la garantía (en números, ej: 700.000)", "tipo": "number" },
        { "nombre_campo": "monto_garantia_palabras", "label": "Monto de la garantía (en palabras, ej: setecientos mil pesos)", "tipo": "text" },
        { "nombre_campo": "dias_aviso", "label": "Días de aviso previo para término de contrato", "tipo": "number" }
    ]',
    'contrato_arriendo.html'
);

INSERT INTO plantillas_documentos (nombre_plantilla, descripcion, campos_requeridos, archivo_plantilla) VALUES
(
    'Poder Simple',
    'Otorga facultades a un tercero para realizar trámites específicos.',
    '[
        { "nombre_campo": "nombre_mandante", "label": "Nombre de quien otorga el poder (Mandante)", "tipo": "text" },
        { "nombre_campo": "rut_mandante", "label": "RUT del Mandante", "tipo": "text" },
        { "nombre_campo": "domicilio_mandante", "label": "Domicilio del Mandante", "tipo": "text" },
        { "nombre_campo": "nombre_mandatario", "label": "Nombre de quien recibe el poder (Mandatario)", "tipo": "text" },
        { "nombre_campo": "rut_mandatario", "label": "RUT del Mandatario", "tipo": "text" },
        { "nombre_campo": "descripcion_asunto", "label": "Asunto o trámite específico a realizar", "tipo": "textarea" },
        { "nombre_campo": "ciudad_firma", "label": "Ciudad donde se firma el poder", "tipo": "text" }
    ]',
    'poder_simple.html'
);
