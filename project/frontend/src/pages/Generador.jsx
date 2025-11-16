import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api'; 
import './Generador.css';
import { FaPlus, FaTimes, FaEdit, FaTrash, FaFileAlt, FaCog } from 'react-icons/fa';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; 


function GeneradorDocumentos() {
    const [plantillas, setPlantillas] = useState([]); 
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null); 
    const [formData, setFormData] = useState({}); 
    const [formErrors, setFormErrors] = useState({}); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modoEdicion, setModoEdicion] = useState(null); // null = crear, id = editar
    const [nuevaPlantilla, setNuevaPlantilla] = useState({
        nombre_plantilla: '',
        descripcion: '',
        contenido_html: '',
        campos_requeridos: []
    });
    const [nuevoCampo, setNuevoCampo] = useState({ nombre_campo: '', label: '', tipo: 'text' });
    const [modalLoading, setModalLoading] = useState(false);
    const [isInitializing, setIsInitializing] = useState(false);
    const [quillKey, setQuillKey] = useState(0); // Para forzar rerender del Quill

    const quillRef = useRef(null);

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{ 'align': [] }],
            ['clean']
        ],
    };

    const validarRut = (rut) => {
        if (!rut || typeof rut !== 'string') return false;
        const rutLimpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
        if (rutLimpio.length < 2) return false;
        const cuerpo = rutLimpio.slice(0, -1);
        const dv = rutLimpio.slice(-1);
        let suma = 0;
        let multiplo = 2;
        for (let i = cuerpo.length - 1; i >= 0; i--) {
            suma += parseInt(cuerpo.charAt(i), 10) * multiplo;
            multiplo = multiplo === 7 ? 2 : multiplo + 1;
        }
        const dvEsperado = 11 - (suma % 11);
        const dvCalculado = dvEsperado === 11 ? '0' : dvEsperado === 10 ? 'K' : dvEsperado.toString();
        return dv === dvCalculado;
    };

    const formatearRut = (rut) => {
        if (!rut) return "";
        const rutLimpio = rut.replace(/[^0-9kK]/g, '').toUpperCase();
        let cuerpo = rutLimpio.slice(0, -1);
        let dv = rutLimpio.slice(-1);
        if (cuerpo.length === 0) return dv;
        cuerpo = new Intl.NumberFormat('es-CL').format(cuerpo);
        return `${cuerpo}-${dv}`;
    };

    const fetchPlantillas = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await apiClient.get('/api/documentos/plantillas');
            setPlantillas(response.data);
        } catch (err) {
            console.error("Error fetching plantillas:", err);
            if (err.response && (err.response.status === 401 || err.response.status === 403)) {
                setError('Tu sesión ha expirado. Redirigiendo al login...');
                localStorage.removeItem('token');
                setTimeout(() => navigate('/login'), 2000);
            } else {
                setError('Error al cargar plantillas.');
            }
        } finally {
            setIsLoading(false);
        }
    }, [navigate]);

    useEffect(() => { 
        let isMounted = true;
        if (isMounted) {
            fetchPlantillas();
        }
        return () => { isMounted = false; };
    }, []);

    const handleTemplateChange = (plantilla) => {
        setError('');
        
        // Si se hace clic en la misma tarjeta, se deselecciona
        if (plantillaSeleccionada && plantillaSeleccionada.id === plantilla.id) {
            setPlantillaSeleccionada(null);
            setFormData({});
        } else {
            setPlantillaSeleccionada(plantilla);
            const initialFormData = {};
            plantilla.campos_requeridos.forEach(campo => {
                initialFormData[campo.nombre_campo] = '';
            });
            setFormData(initialFormData);
        }
    };

    const abrirModalCrear = () => {
        setModoEdicion(null);
        setNuevaPlantilla({ nombre_plantilla: '', descripcion: '', contenido_html: '', campos_requeridos: [] });
        setNuevoCampo({ nombre_campo: '', label: '', tipo: 'text' });
        setQuillKey(prev => prev + 1); // Forzar rerender del Quill
        setIsModalOpen(true);
    };

    const abrirModalEditar = (plantilla) => {
        setModoEdicion(plantilla.id);
        setNuevaPlantilla({
            nombre_plantilla: plantilla.nombre_plantilla,
            descripcion: plantilla.descripcion,
            contenido_html: plantilla.contenido,
            campos_requeridos: plantilla.campos_requeridos
        });
        setNuevoCampo({ nombre_campo: '', label: '', tipo: 'text' });
        setQuillKey(prev => prev + 1); // Forzar rerender del Quill
        setIsModalOpen(true);
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        if (name.includes('rut')) {
            const rutFormateado = formatearRut(value);
            setFormData(prev => ({ ...prev, [name]: rutFormateado }));
            if (value && !validarRut(rutFormateado)) {
                setFormErrors(prev => ({ ...prev, [name]: 'RUT inválido.' }));
            } else {
                setFormErrors(prev => ({ ...prev, [name]: undefined }));
            }
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);
        if (Object.values(formErrors).some(err => err)) {
            setIsLoading(false);
            return;
        }
        try {
            const response = await apiClient.post(
                `/api/documentos/generar/${plantillaSeleccionada.id}`, 
                formData,
                { responseType: 'blob' }
            );
            const blob = response.data;
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${plantillaSeleccionada.nombre_plantilla.replace(/ /g, '_')}.pdf`;
            a.setAttribute('aria-label', `Descargar ${plantillaSeleccionada.nombre_plantilla}`);
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            setError('');
        } catch (err) {
            console.error(err);
            setError('Error al generar el documento PDF. Por favor intenta de nuevo.');
        } finally {
            setIsLoading(false);
        }
    };

    const agregarCampoNuevo = () => {
        if (!nuevoCampo.nombre_campo) return;
        const nombreLimpio = nuevoCampo.nombre_campo.replace(/\s+/g, '_').toLowerCase();
        // Generar label automáticamente del nombre_campo: reemplazar _ con espacios y capitalizar
        const labelGenerado = nombreLimpio
            .replace(/_/g, ' ')
            .replace(/\b\w/g, char => char.toUpperCase());
        
        setNuevaPlantilla(prev => ({
            ...prev,
            campos_requeridos: [...prev.campos_requeridos, { 
                nombre_campo: nombreLimpio, 
                label: labelGenerado, 
                tipo: nuevoCampo.tipo 
            }]
        }));
        setNuevoCampo({ nombre_campo: '', label: '', tipo: 'text' });
    };

    const insertarVariable = (nombreVar) => {
        const htmlToInsert = `{{${nombreVar}}}`;
        
        if (quillRef.current) {
            const editor = quillRef.current.getEditor();
            editor.focus();
            const range = editor.getSelection();
            const position = range ? range.index : editor.getLength();
            editor.insertText(position, htmlToInsert);
            setNuevaPlantilla(prev => ({
                ...prev,
                contenido_html: editor.root.innerHTML
            }));
        }
    };

    const guardarNuevaPlantilla = async () => {
        if (!nuevaPlantilla.nombre_plantilla || !nuevaPlantilla.contenido_html) {
            setError('Por favor completa el nombre y el contenido del documento.');
            return;
        }
        setModalLoading(true);
        try {
            if (modoEdicion) {
                // Actualizar plantilla existente
                const response = await apiClient.put(`/api/documentos/actualizar/${modoEdicion}`, nuevaPlantilla);
                setPlantillas(prev => prev.map(p => p.id === modoEdicion ? response.data : p));
            } else {
                // Crear nueva plantilla
                const response = await apiClient.post('/api/documentos/crear', nuevaPlantilla);
                setPlantillas(prev => [...prev, response.data]);
            }
            setIsModalOpen(false);
            setModoEdicion(null);
            setNuevaPlantilla({ nombre_plantilla: '', descripcion: '', contenido_html: '', campos_requeridos: [] });
            setNuevoCampo({ nombre_campo: '', label: '', tipo: 'text' });
        } catch (err) {
            console.error(err);
            setError(modoEdicion ? 'Error al actualizar plantilla.' : 'Error al guardar plantilla.');
        } finally {
            setModalLoading(false);
        }
    };

    const eliminarPlantilla = async (plantillaId) => {
        if (!window.confirm('¿Estás seguro de que quieres eliminar esta plantilla? Esta acción no se puede deshacer.')) {
            return;
        }
        setIsLoading(true);
        try {
            await apiClient.delete(`/api/documentos/eliminar/${plantillaId}`);
            setPlantillas(prev => prev.filter(p => p.id !== plantillaId));
            if (plantillaSeleccionada?.id === plantillaId) {
                setPlantillaSeleccionada(null);
                setFormData({});
            }
        } catch (err) {
            console.error(err);
            setError('Error al eliminar plantilla.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading && plantillas.length === 0) return <div className="generador-container"><p>Cargando...</p></div>;
    if (error && error.includes('sesión')) return <div className="generador-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="generador-container">
            <div className="header-flex">
                <h2>Generador de Documentos</h2>
                <button 
                    className="btn-crear-nueva"
                    onClick={abrirModalCrear}
                    aria-label="Crear una nueva plantilla de documento"
                    title="Crear Nueva Plantilla"
                >
                    <FaPlus /> Crear Nueva Plantilla
                </button>
            </div>
            
            <p>Selecciona una plantilla y completa los campos para crear tu documento.</p>

            <div className="generador-layout">
                <div className="plantillas-grid">
                    {plantillas.map(plantilla => (
                        <div 
                            key={plantilla.id} 
                            className={`plantilla-card ${plantillaSeleccionada?.id === plantilla.id ? 'selected' : ''}`}
                            onClick={() => handleTemplateChange(plantilla)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                    e.preventDefault();
                                    handleTemplateChange(plantilla);
                                }
                            }}
                            role="button"
                            tabIndex={0}
                            aria-pressed={plantillaSeleccionada?.id === plantilla.id}
                            aria-label={`Plantilla: ${plantilla.nombre_plantilla}. ${plantilla.descripcion}`}
                        >
                            <div className="plantilla-card-header">
                                <div className="plantilla-icon"><FaFileAlt /></div>
                                <div className="plantilla-card-title-group">
                                    <h4>{plantilla.nombre_plantilla}</h4>
                                    <p className="plantilla-card-subtitle">Plantilla legal</p>
                                </div>
                            </div>
                            <div className="plantilla-card-body">
                                <p>{plantilla.descripcion}</p>
                            </div>
                            <div className="plantilla-card-footer">
                                <div className="plantilla-meta">
                                    <div className="plantilla-meta-item">
                                        <span><FaCog /></span>
                                        <span>Configurable</span>
                                    </div>
                                </div>
                                <div className="plantilla-actions">
                                    <button
                                        className="btn-action btn-edit"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            abrirModalEditar(plantilla);
                                        }}
                                        title="Editar plantilla"
                                        aria-label={`Editar plantilla ${plantilla.nombre_plantilla}`}
                                    >
                                        <FaEdit />
                                    </button>
                                    <button
                                        className="btn-action btn-delete"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            eliminarPlantilla(plantilla.id);
                                        }}
                                        title="Eliminar plantilla"
                                        aria-label={`Eliminar plantilla ${plantilla.nombre_plantilla}`}
                                    >
                                        <FaTrash />
                                    </button>
                                    <span className="plantilla-badge">
                                        {plantillaSeleccionada?.id === plantilla.id ? '✓ Seleccionada' : 'Seleccionar'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {plantillaSeleccionada && (
                    <form onSubmit={handleSubmit} className="form-generacion">
                        <h3>{plantillaSeleccionada.nombre_plantilla}</h3>
                        <p className="desc">{plantillaSeleccionada.descripcion}</p>
                        {plantillaSeleccionada.campos_requeridos.map(campo => (
                            <div className="form-group" key={campo.nombre_campo}>
                                <label htmlFor={campo.nombre_campo}>{campo.label}</label>
                                {campo.tipo === 'textarea' ? (
                                    <textarea
                                        id={campo.nombre_campo}
                                    name={campo.nombre_campo}
                                    value={formData[campo.nombre_campo] || ''}
                                    onChange={handleChange}
                                    className={formErrors[campo.nombre_campo] ? 'input-error' : ''}
                                    required
                                    aria-required="true"
                                    aria-invalid={formErrors[campo.nombre_campo] ? 'true' : 'false'}
                                    aria-describedby={formErrors[campo.nombre_campo] ? `${campo.nombre_campo}-error` : undefined}
                                />
                            ) : (
                                <input 
                                    id={campo.nombre_campo}
                                    type={campo.tipo || 'text'}
                                    name={campo.nombre_campo}
                                    value={formData[campo.nombre_campo] || ''}
                                    onChange={handleChange}
                                    className={formErrors[campo.nombre_campo] ? 'input-error' : ''}
                                    required
                                    aria-required="true"
                                    aria-invalid={formErrors[campo.nombre_campo] ? 'true' : 'false'}
                                    aria-describedby={formErrors[campo.nombre_campo] ? `${campo.nombre_campo}-error` : undefined}
                                />
                            )}
                            {formErrors[campo.nombre_campo] && (
                                <div id={`${campo.nombre_campo}-error`} className="error-text" style={{color: '#ef4444', fontSize: '0.85rem', marginTop: '0.25rem'}}>
                                    {formErrors[campo.nombre_campo]}
                                </div>
                            )}
                        </div>
                    ))}
                    {error && <p className="error-message" role="alert">{error}</p>}
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="btn-generar"
                        aria-busy={isLoading}
                    >
                        {isLoading ? 'Generando...' : 'Generar PDF'}
                    </button>
                </form>
                )}
            </div>

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-crear-plantilla">
                        <div className="modal-header">
                            <h3>{modoEdicion ? 'Editar Documento' : 'Diseñar Nuevo Documento'}</h3>
                            <button 
                                className="btn-close"
                                onClick={() => setIsModalOpen(false)}
                                aria-label="Cerrar modal"
                                type="button"
                            >
                                <FaTimes />
                            </button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <input 
                                    className="modal-input-styled input-nombre" 
                                    type="text" 
                                    placeholder="Nombre del Documento" 
                                    value={nuevaPlantilla.nombre_plantilla} 
                                    onChange={e => setNuevaPlantilla({...nuevaPlantilla, nombre_plantilla: e.target.value})} 
                                    aria-label="Nombre del documento"
                                />
                                <input 
                                    className="modal-input-styled" 
                                    type="text" 
                                    placeholder="Descripción breve" 
                                    value={nuevaPlantilla.descripcion} 
                                    onChange={e => setNuevaPlantilla({...nuevaPlantilla, descripcion: e.target.value})}
                                    aria-label="Descripción breve del documento"
                                />
                            </div>
                            <div className="editor-layout">
                                <div className="sidebar">
                                    <h4>Variables</h4>
                                    <div className="add-var-box">
                                        <input 
                                            type="text" 
                                            placeholder="Nombre de la variable" 
                                            value={nuevoCampo.nombre_campo} 
                                            onChange={e => setNuevoCampo({...nuevoCampo, nombre_campo: e.target.value})}
                                            aria-label="Nombre interno de la variable"
                                        />
                                        {nuevoCampo.nombre_campo && (
                                            <div className="label-preview">
                                                <small>Etiqueta:</small>
                                                <p>{nuevoCampo.nombre_campo
                                                    .replace(/\s+/g, '_')
                                                    .toLowerCase()
                                                    .replace(/_/g, ' ')
                                                    .replace(/\b\w/g, char => char.toUpperCase())
                                                }</p>
                                            </div>
                                        )}
                                        <select 
                                            value={nuevoCampo.tipo} 
                                            onChange={e => setNuevoCampo({...nuevoCampo, tipo: e.target.value})}
                                            aria-label="Tipo de variable"
                                        >
                                            <option value="text">Texto</option>
                                            <option value="number">Número</option>
                                            <option value="date">Fecha</option>
                                            <option value="textarea">Área de texto</option>
                                        </select>
                                        <button 
                                            onClick={agregarCampoNuevo} 
                                            className="btn-small"
                                            type="button"
                                            aria-label="Agregar nueva variable"
                                        >
                                            Agregar
                                        </button>
                                    </div>
                                    <div className="vars-list">
                                        {nuevaPlantilla.campos_requeridos.map((c, i) => (
                                            <div 
                                                key={i} 
                                                className="chip" 
                                                onClick={() => insertarVariable(c.nombre_campo)}
                                                role="button"
                                                tabIndex={0}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter' || e.key === ' ') {
                                                        e.preventDefault();
                                                        insertarVariable(c.nombre_campo);
                                                    }
                                                }}
                                                aria-label={`Insertar variable ${c.label}`}
                                            >
                                                + {c.label}
                                            </div>
                                        ))}
                                        <div 
                                            className="chip system" 
                                            onClick={() => insertarVariable('fecha_actual')}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    insertarVariable('fecha_actual');
                                                }
                                            }}
                                            aria-label="Insertar fecha actual"
                                        >
                                            + Fecha Actual
                                        </div>
                                    </div>
                                </div>
                                <div className="editor-area">
                                    <h4>Redacción del Contrato</h4>
                                    {isModalOpen && (
                                        <ReactQuill 
                                            key={quillKey}
                                            ref={quillRef}
                                            theme="snow"
                                            value={nuevaPlantilla.contenido_html}
                                            onChange={(val) => setNuevaPlantilla(prev => ({ ...prev, contenido_html: val }))}
                                            modules={modules}
                                            placeholder="Escribe aquí el contenido..."
                                            className="quill-editor"
                                        />
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="modal-footer">
                            <button 
                                onClick={() => setIsModalOpen(false)} 
                                className="btn-secondary"
                                type="button"
                                aria-label="Cancelar creación de documento"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={guardarNuevaPlantilla} 
                                className="btn-primary" 
                                disabled={modalLoading}
                                type="button"
                                aria-busy={modalLoading}
                                aria-label={modoEdicion ? 'Actualizar plantilla' : 'Guardar plantilla'}
                            >
                                {modalLoading ? 'Guardando...' : modoEdicion ? 'Actualizar Plantilla' : 'Guardar Plantilla'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default GeneradorDocumentos;