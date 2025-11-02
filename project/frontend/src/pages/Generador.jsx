import React, { useState } from 'react';
//import './Generador.css';  Crearemos este archivo para los estilos

function Generador() {
    const [formData, setFormData] = useState({
        nombreCliente: '',
        rutCliente: '',
        nombreAbogado: '',
        descripcionCaso: ''
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        const token = localStorage.getItem('token');
        if (!token) {
            setError('Debes iniciar sesión para generar documentos.');
            setIsLoading(false);
            return;
        }

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}api/documentos/generar`;
            const respuesta = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // ¡Importante! Enviar el token
                },
                body: JSON.stringify(formData),
            });

            if (!respuesta.ok) {
                const errData = await respuesta.json();
                throw new Error(errData.error || 'Error al generar el PDF.');
            }

            // El backend responde con el PDF, lo convertimos a un blob para descargarlo
            const blob = await respuesta.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'poder-simple.pdf'; // Nombre del archivo a descargar
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="generador-container">
            <h2>Generador de Poder Simple</h2>
            <p>Completa los campos para crear tu documento legal en formato PDF.</p>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Nombre del Cliente</label>
                    <input type="text" name="nombreCliente" value={formData.nombreCliente} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>RUT del Cliente</label>
                    <input type="text" name="rutCliente" value={formData.rutCliente} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Nombre del Abogado</label>
                    <input type="text" name="nombreAbogado" value={formData.nombreAbogado} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label>Descripción del Caso</label>
                    <textarea name="descripcionCaso" value={formData.descripcionCaso} onChange={handleChange} required />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Generando...' : 'Generar PDF'}
                </button>
            </form>
        </div>
    );
}

export default Generador;
