import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import apiClient from '../services/api'; 
import './Generador.css';

function GeneradorDocumentos() {
    const [plantillas, setPlantillas] = useState([]); 
    const [plantillaSeleccionada, setPlantillaSeleccionada] = useState(null); 
    const [formData, setFormData] = useState({}); 
    const [formErrors, setFormErrors] = useState({}); 
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

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

    useEffect(() => {
        const fetchPlantillas = async () => {
            setIsLoading(true);
            try {
                const response = await apiClient.get('/api/documentos/plantillas');
                setPlantillas(response.data);

            } catch (err) {
                if (err.response) {
                    if (err.response.status === 401 || err.response.status === 403) {
                        setError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
                        localStorage.removeItem('token'); 
                        setTimeout(() => navigate('/login'), 2000);
                    } else {
                        setError(err.response.data.error || 'No se pudieron cargar las plantillas.');
                    }
                } else {
                    setError('Error de conexión. No se pudieron cargar las plantillas.');
                }
                console.error("Error fetching plantillas:", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchPlantillas();
    }, [navigate]); 

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
            setFormData(prevState => ({
                ...prevState,
                [name]: rutFormateado
            }));

            if (value && !validarRut(rutFormateado)) {
                setFormErrors(prev => ({ ...prev, [name]: 'El RUT ingresado no es válido.' }));
            } else {
                setFormErrors(prev => ({ ...prev, [name]: undefined }));
            }
        } else {
            setFormData(prevState => ({ ...prevState, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        if (Object.values(formErrors).some(err => err)) {
            setError('Por favor, corrige los errores en el formulario antes de continuar.');
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
            if (err.response) {
                if (err.response.status === 401 || err.response.status === 403) {
                    setError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
                    localStorage.removeItem('token');
                    setTimeout(() => navigate('/login'), 2000);
                } else {
                    setError(err.response.data.error || 'Error al generar el PDF.');
                }
            } else {
                setError('Error de conexión al generar el documento.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    if (error && error.includes('sesión')) {
        return <div className="generador-container"><p className="error-message">{error}</p></div>;
    }

    if (isLoading && plantillas.length === 0) {
        return <div className="generador-container"><p>Cargando plantillas...</p></div>;
    }

    return (
        <div className="generador-container">
            <h2>Generador de Documentos</h2>
            <p>Selecciona una plantilla y completa los campos para crear tu documento.</p>

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
                    
                    {plantillaSeleccionada.campos_requeridos.map(campo => (
                        <div className="form-group" key={campo.nombre_campo}>
                            <label>{campo.label}</label>
                            {campo.tipo === 'textarea' ? (
                                <textarea
                                    name={campo.nombre_campo}
                                    value={formData[campo.nombre_campo] || ''}
                                    onChange={handleChange}
                                    className={formErrors[campo.nombre_campo] ? 'input-error' : ''}
                                    required
                                />
                            ) : (
                                <input 
                                type={campo.tipo || 'text'}
                                name={campo.nombre_campo}
                                value={formData[campo.nombre_campo] || ''}
                                onChange={handleChange}
                                className={formErrors[campo.nombre_campo] ? 'input-error' : ''}
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
