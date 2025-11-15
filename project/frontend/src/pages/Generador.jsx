import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api'; 
import './Generador.css';
import { FaPlus, FaTimes } from 'react-icons/fa'; // Iconos para el botón y cerrar modal

function GeneradorDocumentos() {
    // --- Estados Originales ---
    const [plantillas, setPlantillas] = useState([]); 
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null); 
    const [formData, setFormData] = useState({}); 
    const [formErrors, setFormErrors] = useState({}); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // --- Estados para "Crear Plantilla" (Modal) ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevaPlantilla, setNuevaPlantilla] = useState({
        nombre_plantilla: '',
        descripcion: '',
        contenido_html: '', // Aseguramos que siempre sea un string
        campos_requeridos: []
    });
    const [nuevoCampo, setNuevoCampo] = useState({ nombre_campo: '', label: '', tipo: 'text' });
    const [modalLoading, setModalLoading] = useState(false);

    // --- Lógica Original (Validaciones y Carga) ---
    const validarRut = (rut) => { /* ... (Tu lógica de validación RUT sigue igual) ... */ };
    const formatearRut = (rut) => { /* ... (Tu lógica de formato RUT sigue igual) ... */ };

    // Función para cargar plantillas (la extraje para poder reutilizarla al guardar una nueva)
    const fetchPlantillas = async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/documentos/plantillas');
            setPlantillas(response.data);
        } catch (err) {
            console.error("Error fetching plantillas:", err);
            setError('Error al cargar plantillas.');
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPlantillas();
    }, []);

    // --- Lógica Original (Manejo del Formulario de Generación) ---
    const handleTemplateChange = (e) => {
        const { value } = e.target;
        setError('');
        if (!value) {
            setPlantillaSeleccionada(null);
            setFormData({});
            return;
        }
        const plantillaElegida = plantillas.find(p => p.id.toString() === value);
        setPlantillaSeleccionada(plantillaElegida);

        const initialFormData = {};
        plantillaElegida.campos_requeridos.forEach(campo => {
            initialFormData[campo.nombre_campo] = '';
        });
        setFormData(initialFormData);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault(); // Previene que la página se recargue
        setIsLoading(true);
        setError('');

        try {
            // Es importante configurar Axios para que espere un 'blob'
            const config = {
                responseType: 'blob', // ¡Clave para descargar archivos!
            };

            const response = await apiClient.post(
                `/api/documentos/generar/${plantillaSeleccionada.id}`,
                formData, // Los datos del formulario
                config
            );

            // Crear un enlace en memoria para descargar el archivo
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            
            // El nombre del archivo que se descargará
            link.setAttribute('download', `${plantillaSeleccionada.nombre_plantilla.replace(/ /g, '_')}.pdf`);
            
            // Se añade al DOM, se hace clic y se remueve
            document.body.appendChild(link);
            link.click();

            // Limpieza
            link.parentNode.removeChild(link);
            window.URL.revokeObjectURL(url);

        } catch (err) {
            console.error("Error al generar el PDF:", err);
            // Si el error es un JSON (porque el backend falló), necesitamos leerlo de forma diferente
            setError('No se pudo generar el documento. Revisa la consola para más detalles.');
        } finally {
            setIsLoading(false);
        }
    };


    // --- NUEVA LÓGICA: Crear Plantilla ---

    const agregarCampoNuevo = () => {
        if (!nuevoCampo.nombre_campo || !nuevoCampo.label) return;
        // Validación simple de nombre
        const nombreLimpio = nuevoCampo.nombre_campo.replace(/\s+/g, '_').toLowerCase();
        
        setNuevaPlantilla(prev => ({
            ...prev,
            campos_requeridos: [...prev.campos_requeridos, { ...nuevoCampo, nombre_campo: nombreLimpio }]
        }));
        setNuevoCampo({ nombre_campo: '', label: '', tipo: 'text' });
    };

    const insertarVariable = (nombreVar) => {
        setNuevaPlantilla(prev => ({
            ...prev,
            contenido_html: prev.contenido_html + ` {{${nombreVar}}} `
        }));
    };

    const guardarNuevaPlantilla = async () => {
        if (!nuevaPlantilla.nombre_plantilla || !nuevaPlantilla.contenido_html) {
            alert("Falta nombre o contenido.");
            return;
        }
        setModalLoading(true);
        try {
            // Guardamos en la DB
            await apiClient.post('/api/documentos/crear', nuevaPlantilla);
            await fetchPlantillas(); 

            // Cerramos modal y limpiamos
            setIsModalOpen(false);
            setNuevaPlantilla({ nombre_plantilla: '', descripcion: '', contenido_html: '', campos_requeridos: [] });
            
            
            alert("Plantilla creada con éxito.");

        } catch (err) {
            console.error(err);
            alert("Error al guardar la plantilla.");
        } finally {
            setModalLoading(false);
        }
    };

    return (
        <div className="generador-container">
            <div className="header-flex">
                <h2>Generador de Documentos</h2>
                {/* BOTÓN NUEVO */}
                <button className="btn-crear-nueva" onClick={() => setIsModalOpen(true)}>
                    <FaPlus /> Crear Nueva Plantilla
                </button>
            </div>
            
            <p>Selecciona una plantilla y completa los campos para crear tu documento.</p>

            {/* SELECTOR DE PLANTILLAS (Original) */}
            <div className="form-group">
                <label>Selecciona una Plantilla</label>
                <select onChange={handleTemplateChange} value={plantillaSeleccionada?.id || ""}>
                    <option value="">-- Elige un documento --</option>
                    {plantillas.map(plantilla => (
                        <option key={plantilla.id} value={plantilla.id}>
                            {plantilla.nombre_plantilla}
                        </option>
                    ))}
                </select>
            </div>

            {/* FORMULARIO DE GENERACIÓN (Original) */}
            {plantillaSeleccionada && (
                <form onSubmit={handleSubmit} className="form-generacion">
                    <h3>{plantillaSeleccionada.nombre_plantilla}</h3>
                    <p className="desc">{plantillaSeleccionada.descripcion}</p>
                    
                    {plantillaSeleccionada.campos_requeridos.map(campo => (
                        <div className="form-group" key={campo.nombre_campo}>
                            <label>{campo.label}</label>
                            {campo.tipo === 'textarea' ? (
                                <textarea 
                                    name={campo.nombre_campo}
                                    value={formData[campo.nombre_campo] || ''}
                                    onChange={handleChange}
                                />
                            ) : (
                                <input 
                                    type={campo.tipo}
                                    name={campo.nombre_campo}
                                    value={formData[campo.nombre_campo] || ''}
                                    onChange={handleChange}
                                />
                            )}
                        </div>
                    ))}

                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isLoading} className="btn-generar">
                        {isLoading ? 'Generando...' : 'Generar PDF'}
                    </button>
                </form>
            )}

            {/* --- MODAL: CREAR NUEVA PLANTILLA --- */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-crear-plantilla">
                        <div className="modal-header">
                            <h3>Diseñar Nuevo Documento</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                        </div>
                        
                        <div className="modal-body">
                            {/* 1. Datos Básicos */}
                            <div className="row">
                                <input 
                                    type="text" placeholder="Nombre del Documento" 
                                    value={nuevaPlantilla.nombre_plantilla}
                                    onChange={e => setNuevaPlantilla({...nuevaPlantilla, nombre_plantilla: e.target.value})}
                                    className="modal-input-styled input-nombre"
                                />
                                <input 
                                    type="text" placeholder="Descripción breve" 
                                    value={nuevaPlantilla.descripcion}
                                    onChange={e => setNuevaPlantilla({...nuevaPlantilla, descripcion: e.target.value})}
                                    className="modal-input-styled"
                                />
                            </div>

                            <div className="editor-layout">
                                {/* 2. Definir Variables (Izquierda) */}
                                <div className="sidebar">
                                    <h4>Variables</h4>
                                    <div className="add-var-box">
                                        <input 
                                            type="text" placeholder="Nombre interno (ej: rut)"
                                            value={nuevoCampo.nombre_campo}
                                            onChange={e => setNuevoCampo({...nuevoCampo, nombre_campo: e.target.value})}
                                        />
                                        <input 
                                            type="text" placeholder="Etiqueta (ej: RUT Cliente)"
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
                                        <button onClick={agregarCampoNuevo} className="btn-small">Agregar</button>
                                    </div>
                                    
                                    <div className="vars-list">
                                        {nuevaPlantilla.campos_requeridos.map((c, i) => (
                                            <div key={i} className="chip" onClick={() => insertarVariable(c.nombre_campo)}>
                                                + {c.label}
                                            </div>
                                        ))}
                                        <div className="chip system" onClick={() => insertarVariable('fecha_actual')}>
                                            + Fecha Actual
                                        </div>
                                    </div>
                                </div>

                                {/* 3. Editor (Derecha) */}
                                <div className="editor-area">
                                    <h4>Redacción del Contrato</h4>
                                    <textarea 
                                        placeholder="Escribe aquí el texto del contrato..." 
                                        value={nuevaPlantilla.contenido_html || ''}
                                        onChange={e => setNuevaPlantilla({...nuevaPlantilla, contenido_html: e.target.value})}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button onClick={() => setIsModalOpen(false)} className="btn-secondary">Cancelar</button>
                            <button onClick={guardarNuevaPlantilla} className="btn-primary" disabled={modalLoading}>
                                {modalLoading ? 'Guardando...' : 'Guardar Plantilla'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeneradorDocumentos;