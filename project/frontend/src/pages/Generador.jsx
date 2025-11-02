import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Generador.css';

// Renombramos el componente a "GeneradorDocumentos" (plural)
function GeneradorDocumentos() {
    const [plantillas, setPlantillas] = useState([]); // Lista de plantillas de la BD
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null); // La plantilla escogida
    const [formData, setFormData] = useState({}); // Objeto para los datos del formulario
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    // Obtenemos el token y la URL de la API (ajusta localhost:5000 si es necesario)
    const token = localStorage.getItem('token');
    const VITE_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

    // --- 1. OBTENER PLANTILLAS AL CARGAR LA PÁGINA ---
    useEffect(() => {
        // Si no hay token, no dejamos que vea la página
        if (!token) {
            setError('Debes iniciar sesión para ver esta página.');
            // Opcional: redirigir al login después de 2 segundos
            // setTimeout(() => navigate('/login'), 2000);
            return;
        }

        const fetchPlantillas = async () => {
            setIsLoading(true);
            try {
                // Hacemos un GET a la nueva ruta de plantillas
                const respuesta = await fetch(new URL('/api/documentos/plantillas', VITE_API_URL).href, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });

                if (!respuesta.ok) {
                    // Si el error es 401 (Unauthorized), el token es inválido.
                    if (respuesta.status === 401) {
                        localStorage.removeItem('token'); // Limpiamos el token viejo
                        navigate('/login'); // Redirigimos al login
                        return;
                    }
                    const errData = await respuesta.json();
                    throw new Error(errData.error || 'No se pudieron cargar las plantillas.');
                }
                
                const data = await respuesta.json();
                setPlantillas(data);
            } catch (err) {
                setError(err.message);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlantillas();
    }, [token, navigate, VITE_API_URL]); // Dependencias del useEffect

    // --- 2. MANEJAR CAMBIO DE PLANTILLA (SELECT) ---
    const handleTemplateChange = (e) => {
        const { value } = e.target;
        setError(''); // Limpia errores

        if (!value) {
            setPlantillaSeleccionada(null);
            setFormData({});
            return;
        }
        
        // Buscamos la plantilla completa (que tiene los campos_requeridos)
        const plantillaElegida = plantillas.find(p => p.id.toString() === value);
        setPlantillaSeleccionada(plantillaElegida);

        // Inicializar el formData dinámicamente
        const initialFormData = {};
        plantillaElegida.campos_requeridos.forEach(campo => {
            initialFormData[campo.nombre_campo] = '';
        });
        setFormData(initialFormData);
    };

    // --- 3. MANEJAR CAMBIO EN LOS INPUTS DEL FORMULARIO ---
    // (Esta función es igual a la tuya, ¡estaba perfecta!)
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    // --- 4. ENVIAR EL FORMULARIO PARA GENERAR PDF ---
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            // ¡URL DINÁMICA! Usamos el ID de la plantilla seleccionada
            const apiUrl = new URL(`/api/documentos/generar/${plantillaSeleccionada.id}`, VITE_API_URL).href;
            
            const respuesta = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData), // Enviamos el formData dinámico
            });

            if (!respuesta.ok) {
                const errData = await respuesta.json();
                throw new Error(errData.error || 'Error al generar el PDF.');
            }

            // --- Descargar el PDF (Tu código estaba perfecto) ---
            const blob = await respuesta.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            // ¡NOMBRE DINÁMICO!
            a.download = `${plantillaSeleccionada.nombre_plantilla.replace(/ /g, '_')}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            // --- Fin de la descarga ---

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    // --- 5. RENDERIZADO ---
    
    // Muestra error de autenticación si falló al cargar plantillas
    if (!token && error) {
        return <div className="generador-container"><p className="error-message">{error}</p></div>;
    }

    // Muestra "Cargando..." mientras busca las plantillas
    if (isLoading && plantillas.length === 0) {
        return <div className="generador-container"><p>Cargando plantillas...</p></div>;
    }

    return (
        <div className="generador-container">
            <h2>Generador de Documentos</h2>
            <p>Selecciona una plantilla y completa los campos para crear tu documento.</p>

            {/* --- SELECTOR DE PLANTILLAS --- */}
            <div className="form-group">
                <label>Selecciona una Plantilla</label>
                <select onChange={handleTemplateChange} defaultValue="">
                    <option value="">-- Elige un documento --</option>
                    {plantillas.map(plantilla => (
                        <option key={plantilla.id} value={plantilla.id} >
                            {plantilla.nombre_plantilla}
                        </option>
                    ))}
                </select>
            </div>

            
            {plantillaSeleccionada && (
                <form onSubmit={handleSubmit}>
                    <h3>{plantillaSeleccionada.nombre_plantilla}</h3>
                    <p>{plantillaSeleccionada.descripcion}</p>
                    
                    {/* Mapeamos los campos requeridos para crear el formulario */}
                    {plantillaSeleccionada.campos_requeridos.map(campo => (
                        <div className="form-group" key={campo.nombre_campo}>
                            <label>{campo.label}</label>
                            {campo.tipo === 'textarea' ? (
                                <textarea
                                    name={campo.nombre_campo}
                                    value={formData[campo.nombre_campo] || ''}
                                    onChange={handleChange}
                                    required
                                />
                            ) : (
                                <input 
                                type={campo.tipo || 'text'}
                                name={campo.nombre_campo}
                                value={formData[campo.nombre_campo] || ''}
                                onChange={handleChange}
                                required 
                                />
                            )}
                        </div>
                    ))}

                    {error && <p className="error-message">{error}</p>}
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Generando...' : 'Generar PDF'}
                    </button>
                </form>
            )}
        </div>
    );
}

export default GeneradorDocumentos;
