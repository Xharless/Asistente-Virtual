-- Usuarios
CREATE TABLE IF NOT EXISTS usuarios (
    id SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    contrasena_hash VARCHAR(255) NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);


-- Tabla para diccionarios
CREATE TABLE IF NOT EXISTS diccionario_terminos (
    id SERIAL PRIMARY KEY,
    termino VARCHAR(255) UNIQUE NOT NULL,
    definicion TEXT NOT NULL,
    categoria VARCHAR(100), 
    fuente VARCHAR(255)     
);

-- Plantilla de documentos
CREATE TABLE IF NOT EXISTS plantillas_documentos (
    id SERIAL PRIMARY KEY,
    nombre_plantilla VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    campos_requeridos JSONB NOT NULL,
    archivo_plantilla VARCHAR(255) NOT NULL -- Columna para el nombre del archivo HTML
);

-- Documentos generados
CREATE TABLE IF NOT EXISTS documentos_generados (
    id SERIAL PRIMARY KEY,
    usuario_id INT NOT NULL REFERENCES usuarios(id),
    plantilla_id INT NOT NULL REFERENCES plantillas_documentos(id),
    datos_ingresados JSONB NOT NULL,
    fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Guias
CREATE TABLE IF NOT EXISTS guias_ojv (
    id SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion_corta TEXT,
    orden INT
);

-- Pasos de las guías
CREATE TABLE pasos_guia (
    id SERIAL PRIMARY KEY,
    guia_id INT NOT NULL REFERENCES guias_ojv(id) ON DELETE CASCADE,
    
    numero_paso INT NOT NULL,
    instruccion TEXT NOT NULL,
    imagen_url VARCHAR(255) 
);