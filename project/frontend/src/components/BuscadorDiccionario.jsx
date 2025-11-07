import React, { useState, useEffect } from 'react';
import apiClient from '../../services/api'; // Nuestro cliente de API
import useDebounce from '../../hooks/useDebounce'; // Nuestro hook de debounce
import './BuscadorDiccionario.css'; // ¡Importamos nuestros nuevos estilos!
import { FaSearch } from 'react-icons/fa'; // Un ícono para el input

const BuscadorDiccionario = () => {
    const [terminoBusqueda, setTerminoBusqueda] = useState('');
    const [resultados, setResultados] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Usamos el hook para no buscar en cada pulsación de tecla
    const debouncedTermino = useDebounce(terminoBusqueda, 500);

    useEffect(() => {
        // Si el término "debounced" está vacío, limpiamos los resultados y no hacemos nada más
        if (!debouncedTermino) {
            setResultados([]);
            return;
        }

        const buscar = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Usamos nuestro apiClient que ya incluye el token
                const response = await apiClient.get('/api/diccionario/buscar', {
                    params: { termino: debouncedTermino }
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
    }, [debouncedTermino]); // Este efecto se ejecuta solo cuando 'debouncedTermino' cambia

    return (
        <div className="diccionario-container">
            <h2>Diccionario Legal</h2>
            <div className="search-bar">
                <FaSearch className="search-icon" />
                <input
                    type="text"
                    placeholder="Busca un término legal..."
                    value={terminoBusqueda}
                    onChange={(e) => setTerminoBusqueda(e.target.value)}
                />
            </div>

            {/* Mensajes de estado mejorados */}
            {isLoading && <p className="status-message">Buscando...</p>}
            {error && <p className="status-message error-message">{error}</p>}
            {!isLoading && !error && debouncedTermino && resultados.length === 0 && (
                <p className="status-message">No se encontraron resultados para "{debouncedTermino}".</p>
            )}

            <div className="results-list">
                {!isLoading && resultados.map((item) => (
                    <div key={item.id} className="result-item">
                        <h3>{item.termino}</h3>
                        <p>{item.definicion}</p>
                        {item.fuente && <small>Fuente: {item.fuente}</small>}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default BuscadorDiccionario;