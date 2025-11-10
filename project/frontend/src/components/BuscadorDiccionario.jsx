import React, { useState, useEffect } from 'react';
import apiClient from '../services/api'; 
import useDebounce from '../hooks/useDebounce'; 
import './BuscadorDiccionario.css'; 
import { FaSearch } from 'react-icons/fa';

const BuscadorDiccionario = () => {
    const alfabeto = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    const [letraSeleccionada, setLetraSeleccionada] = useState('');
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    const debouncedTermino = useDebounce(terminoBusqueda, 500);

    useEffect(() => {
        if (!debouncedTermino && !letraSeleccionada) {
            setResultados([]);
            setError(null);
            return;
        }

        const buscar = async () => {
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
        };

        buscar();

    }, [debouncedTermino, letraSeleccionada]);

    const handleLetraClick = (letra) => {
        if (letra === letraSeleccionada) {
            setLetraSeleccionada('');
        } else {
            setTerminoBusqueda('');
            setLetraSeleccionada(letra);
        }
    };

    return (
        <div className="diccionario-container">
            <h1>Diccionario Legal</h1>
            <div className="search-bar-container">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    className="search-input"
                    placeholder="Busca un término legal..."
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
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

            {isLoading && <p className="status-message">Buscando...</p>}
            {error && <p className="status-message error-message">{error}</p>}
            {!isLoading && !error && (debouncedTermino || letraSeleccionada) && resultados.length === 0 && (
                <p className="status-message">No se encontraron resultados.</p>
            )}

            <div className="resultados-lista">
                {!isLoading && resultados.map((item) => (
                    <div key={item.id} className="result-item">
                        <h3>{item.termino}</h3>
                        <p>{item.definicion}</p>
                        {item.referencia_legal && <p className="fuente-legal">Referencia: {item.referencia_legal}</p>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BuscadorDiccionario;