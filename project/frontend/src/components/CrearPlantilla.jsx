import React, { useState } from 'react';
import apiClient from '../services/api'; // Tu cliente axios/fetch
import './CrearPlantilla.css'; // Estilos que te daré abajo

const CrearPlantilla = () => {
    // Estado del formulario general
    const [nombrePlantilla, setNombrePlantilla] = useState('');
    const [descripcion, setDescripcion] = useState('');
    
    // Estado del contenido (el HTML/Texto del contrato)
    const [contenido, setContenido] = useState('');

    // Estado para la lista de campos dinámicos
    const [campos, setCampos] = useState([]);
    
    // Estado temporal para el campo que se está creando ahora
    const [nuevoCampo, setNuevoCampo] = useState({
        nombre_campo: '', // ej: nombre_arrendador
        label: '',        // ej: Nombre del Arrendador
        tipo: 'text'      // text, number, date
    });

    // --- 1. Lógica para agregar un nuevo campo a la lista ---
    const agregarCampo = () => {
        if (!nuevoCampo.nombre_campo || !nuevoCampo.label) {
            alert("Debes llenar el nombre interno y la etiqueta del campo");
            return;
        }
        
        // Validar que no tenga espacios el nombre interno (para que funcione bien en {{}})
        if (/\s/.test(nuevoCampo.nombre_campo)) {
            alert("El nombre interno no puede tener espacios (usa guion bajo: nombre_cliente)");
            return;
        }

        setCampos([...campos, nuevoCampo]);
        // Limpiar inputs
        setNuevoCampo({ nombre_campo: '', label: '', tipo: 'text' });
    };

    // --- 2. Lógica para insertar la variable en el texto ---
    const insertarVariableEnTexto = (nombreVariable) => {
        // Insertamos la variable con el formato que tu backend ya entiende: {{nombre}}
        setContenido(prev => `${prev} {{${nombreVariable}}} `);
    };

    // --- 3. Guardar todo en la Base de Datos ---
    const guardarPlantilla = async () => {
        if (!nombrePlantilla || !contenido) {
            alert("Falta el nombre de la plantilla o el contenido.");
            return;
        }

        try {
            const payload = {
                nombre_plantilla: nombrePlantilla,
                descripcion: descripcion,
                contenido_html: contenido, // Guardamos el texto con los {{}}
                campos_requeridos: campos  // Guardamos la definición de los campos
            };

            await apiClient.post('/api/plantillas/crear', payload);
            alert("¡Plantilla creada con éxito!");
            // Redirigir o limpiar form...
            
        } catch (error) {
            console.error(error);
            alert("Error al guardar la plantilla");
        }
    };

    return (
        <div className="creador-container">
            <h1>Crear Nueva Plantilla de Documento</h1>

            {/* SECCIÓN 1: Datos Básicos */}
            <div className="panel-basico">
                <input 
                    type="text" 
                    placeholder="Nombre de la Plantilla (ej: Contrato Honorarios)" 
                    value={nombrePlantilla}
                    onChange={e => setNombrePlantilla(e.target.value)}
                    className="input-full"
                />
                <input 
                    type="text" 
                    placeholder="Descripción corta..." 
                    value={descripcion}
                    onChange={e => setDescripcion(e.target.value)}
                    className="input-full"
                />
            </div>

            <div className="panel-editor-layout">
                
                {/* SECCIÓN 2: Definir Campos (Lado Izquierdo) */}
                <div className="sidebar-campos">
                    <h3>1. Define tus Variables</h3>
                    <div className="form-campo-nuevo">
                        <input 
                            type="text" 
                            placeholder="Nombre interno (ej: rut_cliente)" 
                            value={nuevoCampo.nombre_campo}
                            onChange={e => setNuevoCampo({...nuevoCampo, nombre_campo: e.target.value})}
                        />
                        <input 
                            type="text" 
                            placeholder="Etiqueta (ej: RUT del Cliente)" 
                            value={nuevoCampo.label}
                            onChange={e => setNuevoCampo({...nuevoCampo, label: e.target.value})}
                        />
                        <select 
                            value={nuevoCampo.tipo}
                            onChange={e => setNuevoCampo({...nuevoCampo, tipo: e.target.value})}
                        >
                            <option value="text">Texto</option>
                            <option value="number">Número</option>
                            <option value="date">Fecha</option>
                        </select>
                        <button onClick={agregarCampo} className="btn-add">Agregar Variable</button>
                    </div>

                    <hr />
                    
                    <h4>Variables Disponibles:</h4>
                    <p className="help-text">Haz clic para insertar en el texto</p>
                    <div className="lista-chips">
                        {campos.map((campo, idx) => (
                            <button 
                                key={idx} 
                                className="chip-variable"
                                onClick={() => insertarVariableEnTexto(campo.nombre_campo)}
                            >
                                + {campo.label} <small>({campo.nombre_campo})</small>
                            </button>
                        ))}
                        {/* Variable por defecto siempre disponible */}
                        <button 
                            className="chip-variable system"
                            onClick={() => insertarVariableEnTexto('fecha_actual')}
                        >
                            + Fecha Actual (Automático)
                        </button>
                    </div>
                </div>

                {/* SECCIÓN 3: Editor de Texto (Lado Derecho) */}
                <div className="area-redaccion">
                    <h3>2. Redacta el Documento</h3>
                    <textarea
                        className="editor-texto"
                        value={contenido}
                        onChange={e => setContenido(e.target.value)}
                        placeholder="Escribe aquí el contrato. Ejemplo: En la ciudad de Santiago, comparece don {{nombre_cliente}}..."
                    ></textarea>
                </div>
            </div>

            <button className="btn-guardar-final" onClick={guardarPlantilla}>
                Guardar Plantilla
            </button>
        </div>
    );
};

export default CrearPlantilla;