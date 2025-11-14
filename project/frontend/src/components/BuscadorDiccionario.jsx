import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api'; 
import useDebounce from '../hooks/useDebounce'; 
import './BuscadorDiccionario.css'; 
import { FaSearch, FaPlus } from 'react-icons/fa';

const BuscadorDiccionario = () => {
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const [letraSeleccionada, setLetraSeleccionada] = useState('');
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({
        termino: '',
        definicion: '',
        referencia_legal: ''
    });
    const [modalError, setModalError] = useState('');
    const [modalLoading, setModalLoading] = useState(false);

    const debouncedTermino = useDebounce(terminoBusqueda, 500);

    const buscar = useCallback(async () => {
        setIsLoading(true);
        setError(null);
        try {
            const response = await apiClient.get('/api/diccionario/buscar', {
                params: { termino: debouncedTermino, letra: letraSeleccionada }
            });
            setResultados(response.data);
        } catch (err) {
            setError('Error al conectar con el servidor. Inténtalo de nuevo.');
            console.error(err);
        } finally {
            setIsLoading(false);
        }
    }, [debouncedTermino, letraSeleccionada]);

    useEffect(() => {
        if (!debouncedTermino && !letraSeleccionada) {
            setResultados([]);
            setError(null);
            return;
        }

        buscar();

    }, [debouncedTermino, letraSeleccionada, buscar]);

    const handleLetraClick = (letra) => {
        if (letra === letraSeleccionada) {
            setLetraSeleccionada('');
        } else {
            setTerminoBusqueda('');
            setLetraSeleccionada(letra);
        }
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.termino || !formData.definicion) {
            setModalError('El término y la definición son obligatorios.');
            return;
        }

        setModalLoading(true);
        setModalError('');

        try {
            await apiClient.post('/api/diccionario/agregar', formData);

            setModalLoading(false);
            setIsModalOpen(false);
            setFormData({ termino: '', definicion: '', referencia_legal: '' });
            
            if (letraSeleccionada) {
                setLetraSeleccionada('');
            }
            
            buscar(); 
            
        } catch (err) {
            setModalLoading(false);
            setModalError(err.response?.data?.error || 'Error al guardar. Inténtelo de nuevo.');
        }
    };

    const abrirModal = () => {
        setFormData({ termino: '', definicion: '', referencia_legal: '' });
        setModalError('');
        setIsModalOpen(true);
    };

    return (
        <React.Fragment>
            {/* Componente que inyecta el CSS */}
            
            <div className="diccionario-container">
                
                <div className="diccionario-header">
                    <h1>Diccionario Legal</h1>
                    <button onClick={abrirModal} className="btn-agregar">
                        <FaPlus /> Agregar Término
                    </button>
                </div>

            <div className="search-bar-container">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Busca un término legal..."
                    value={terminoBusqueda}
                    onChange={(e) => {
                        setLetraSeleccionada(''); 
                        setTerminoBusqueda(e.target.value);
                    }}
                />
            </div>
            <div className="alfabeto-container">
                {alfabeto.map((letra) => (
                    <button
                        key={letra}
                        className={`letra-button ${letraSeleccionada === letra ? 'active' : ''}`}
                        onClick={() => handleLetraClick(letra)}
                    >
                        {letra}
                    </button>
                ))}
            </div>

            {/* --- Mensajes de Estado de Búsqueda --- */}
            {isLoading && <p className="status-message">Buscando...</p>}
            {error && <p className="status-message error-message">{error}</p>}
            {!isLoading && !error && (debouncedTermino || letraSeleccionada) && resultados.length === 0 && (
                <p className="status-message">No se encontraron resultados.</p>
            )}

            {/* --- Lista de Resultados --- */}
            <div className="resultados-lista">
                {!isLoading && resultados.map((item) => (
                    <div key={item.id} className="result-item">
                        <h3>{item.termino}</h3>
                        <p>{item.definicion}</p>
                        {item.referencia_legal && <p className="fuente-legal">Referencia: {item.referencia_legal}</p>}
                    </div>
                ))}
            </div>

            {/* --- Modal para Agregar Término --- */}
            {isModalOpen && (
                <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2>Agregar Nuevo Término</h2>
                        <form onSubmit={handleFormSubmit}>
                            <div className="form-group">
                                <label htmlFor="termino">Término</label>
                                <input
                                    type="text"
                                    id="termino"
                                    name="termino"
                                    value={formData.termino}
                                    onChange={handleFormChange}
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="definicion">Definición</label>
                                <textarea
                                    id="definicion"
                                    name="definicion"
                                    value={formData.definicion}
                                    onChange={handleFormChange}
                                    rows="5"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="referencia_legal">Referencia Legal (Opcional)</label>
                                <input
                                    type="text"
                                    id="referencia_legal"
                                    name="referencia_legal"
                                    value={formData.referencia_legal}
                                    onChange={handleFormChange}
                                />
                            </div>
                            
                            {modalError && <p className="status-message error-message modal-error">{modalError}</p>}
                            
                            <div className="modal-actions">
                                <button 
                                    type="button" 
                                    className="btn-cancelar" 
                                    onClick={() => setIsModalOpen(false)} 
                                    disabled={modalLoading}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    className="btn-guardar" 
                                    disabled={modalLoading}
                                >
                                    {modalLoading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
        </React.Fragment>
    );
};

export default BuscadorDiccionario;