import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api'; 
import './Generador.css';
import { FaPlus, FaTimes } from 'react-icons/fa';

// --- 1. IMPORTAMOS REACT-QUILL-NEW ---
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css'; // Estilos obligatorios

function GeneradorDocumentos() {
    // --- Estados Originales ---
    const [plantillas, setPlantillas] = useState([]); 
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null); 
    const [formData, setFormData] = useState({}); 
    const [formErrors, setFormErrors] = useState({}); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // --- Estados del Modal ---
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [nuevaPlantilla, setNuevaPlantilla] = useState({
        nombre_plantilla: '',
        descripcion: '',
        contenido_html: '',
        campos_requeridos: []
    });
    const [nuevoCampo, setNuevoCampo] = useState({ nombre_campo: '', label: '', tipo: 'text' });
    const [modalLoading, setModalLoading] = useState(false);

    // --- 2. REFERENCIA PARA QUILL ---
    const quillRef = useRef(null);

    // --- Configuración de la Barra de Herramientas ---
    const modules = {
        toolbar: [
            [{ 'header': [1, 2, false] }],
            ['bold', 'italic', 'underline'],
            [{'list': 'ordered'}, {'list': 'bullet'}],
            [{ 'align': [] }],
            ['clean']
        ],
    };

    // --- Helpers (Validación RUT) ---
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

    useEffect(() => { fetchPlantillas(); }, [fetchPlantillas]);

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
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
        } catch (err) {
            console.error(err);
            setError('Error al generar el documento PDF.');
        } finally {
            setIsLoading(false);
        }
    };

    // --- Lógica Modal ---
    const agregarCampoNuevo = () => {
        if (!nuevoCampo.nombre_campo || !nuevoCampo.label) return;
        const nombreLimpio = nuevoCampo.nombre_campo.replace(/\s+/g, '_').toLowerCase();
        setNuevaPlantilla(prev => ({
            ...prev,
            campos_requeridos: [...prev.campos_requeridos, { ...nuevoCampo, nombre_campo: nombreLimpio }]
        }));
        setNuevoCampo({ nombre_campo: '', label: '', tipo: 'text' });
    };

    // --- 4. INSERTAR VARIABLE CON QUILL (ESTO SÍ FUNCIONA) ---
    const insertarVariable = (nombreVar) => {
        const htmlToInsert = ` {{${nombreVar}}} `;
        
        if (quillRef.current) {
            // Obtenemos la instancia interna del editor Quill
            const editor = quillRef.current.getEditor();
            
            // Recuperamos el foco
            editor.focus();
            
            // Obtenemos la posición del cursor. Si no hay selección, devuelve null.
            // Si es null, usamos la longitud del texto (lo pone al final).
            const range = editor.getSelection();
            const position = range ? range.index : editor.getLength();
            
            // Insertamos el texto en esa posición exacta
            editor.insertText(position, htmlToInsert);
            
            // Actualizamos manualmente el estado de React para sincronizar
            setNuevaPlantilla(prev => ({
                ...prev,
                contenido_html: editor.root.innerHTML
            }));
        }
    };

    const guardarNuevaPlantilla = async () => {
        if (!nuevaPlantilla.nombre_plantilla || !nuevaPlantilla.contenido_html) {
            alert("Falta nombre o contenido.");
            return;
        }
        setModalLoading(true);
        try {
            await apiClient.post('/api/documentos/crear', nuevaPlantilla);
            setIsModalOpen(false);
            setNuevaPlantilla({ nombre_plantilla: '', descripcion: '', contenido_html: '', campos_requeridos: [] });
            await fetchPlantillas(); 
            alert("Plantilla creada con éxito.");
        } catch (err) {
            console.error(err);
            alert("Error al guardar la plantilla.");
        } finally {
            setModalLoading(false);
        }
    };

    if (isLoading && plantillas.length === 0) return <div className="generador-container"><p>Cargando...</p></div>;
    if (error && error.includes('sesión')) return <div className="generador-container"><p className="error-message">{error}</p></div>;

    return (
        <div className="generador-container">
            <div className="header-flex">
                <h2>Generador de Documentos</h2>
                <button className="btn-crear-nueva" onClick={() => setIsModalOpen(true)}>
                    <FaPlus /> Crear Nueva Plantilla
                </button>
            </div>
            
            <p>Selecciona una plantilla y completa los campos para crear tu documento.</p>

            <div className="form-group">
                <label>Selecciona una Plantilla</label>
                <select onChange={handleTemplateChange} value={plantillaSeleccionada?.id || ""} disabled={isLoading}>
                    <option value="">-- Elige un documento --</option>
                    {plantillas.map(plantilla => (
                        <option key={plantilla.id} value={plantilla.id}>{plantilla.nombre_plantilla}</option>
                    ))}
                </select>
            </div>

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
                                    // Aquí aplicamos la clase si hay error
                                    className={formErrors[campo.nombre_campo] ? 'input-error' : ''}
                                    required
                                />
                            ) : (
                                <input 
                                    type={campo.tipo || 'text'}
                                    name={campo.nombre_campo}
                                    value={formData[campo.nombre_campo] || ''}
                                    onChange={handleChange}
                                    // Aquí aplicamos la clase si hay error
                                    className={formErrors[campo.nombre_campo] ? 'input-error' : ''}
                                    required 
                                />
                            )}
                            
                            {/* --- BORRA O COMENTA ESTA LÍNEA PARA QUE NO SALGA EL TEXTO --- */}
                            {/* {formErrors[campo.nombre_campo] && <small className="error-text">{formErrors[campo.nombre_campo]}</small>} */}
                            
                        </div>
                    ))}
                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isLoading} className="btn-generar">Generar PDF</button>
                </form>
            )}

            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-crear-plantilla">
                        <div className="modal-header">
                            <h3>Diseñar Nuevo Documento</h3>
                            <button className="btn-close" onClick={() => setIsModalOpen(false)}><FaTimes /></button>
                        </div>
                        <div className="modal-body">
                            <div className="row">
                                <input className="modal-input-styled input-nombre" type="text" placeholder="Nombre del Documento" value={nuevaPlantilla.nombre_plantilla} onChange={e => setNuevaPlantilla({...nuevaPlantilla, nombre_plantilla: e.target.value})} />
                                <input className="modal-input-styled" type="text" placeholder="Descripción breve" value={nuevaPlantilla.descripcion} onChange={e => setNuevaPlantilla({...nuevaPlantilla, descripcion: e.target.value})} />
                            </div>
                            <div className="editor-layout">
                                <div className="sidebar">
                                    <h4>Variables</h4>
                                    <div className="add-var-box">
                                        <input type="text" placeholder="Nombre interno" value={nuevoCampo.nombre_campo} onChange={e => setNuevoCampo({...nuevoCampo, nombre_campo: e.target.value})}/>
                                        <input type="text" placeholder="Etiqueta" value={nuevoCampo.label} onChange={e => setNuevoCampo({...nuevoCampo, label: e.target.value})}/>
                                        <button onClick={agregarCampoNuevo} className="btn-small">Agregar</button>
                                    </div>
                                    <div className="vars-list">
                                        {nuevaPlantilla.campos_requeridos.map((c, i) => (
                                            <div 
                                                key={i} 
                                                className="chip" 
                                                onClick={() => insertarVariable(c.nombre_campo)}
                                            >
                                                + {c.label}
                                            </div>
                                        ))}
                                        <div className="chip system" onClick={() => insertarVariable('fecha_actual')}>+ Fecha Actual</div>
                                    </div>
                                </div>
                                <div className="editor-area">
                                    <h4>Redacción del Contrato</h4>
                                    
                                    {/* --- 5. COMPONENTE REACT-QUILL --- */}
                                    <ReactQuill 
                                        ref={quillRef}
                                        theme="snow"
                                        value={nuevaPlantilla.contenido_html}
                                        onChange={(val) => setNuevaPlantilla(prev => ({ ...prev, contenido_html: val }))}
                                        modules={modules}
                                        placeholder="Escribe aquí el contenido..."
                                        className="quill-editor"
                                    />
                                    {/* --------------------------------- */}
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