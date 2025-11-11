import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaFileUpload, FaSpinner } from 'react-icons/fa';
import './AnalizadorPDF.css';

function AnalizadorPDF() {
    const [archivo, setArchivo] = useState(null);
    const [nombreArchivo, setNombreArchivo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file && file.type === 'application/pdf') {
            setArchivo(file);
            setNombreArchivo(file.name);
            setError('');
        } else {
            setArchivo(null);
            setNombreArchivo('');
            setError('Por favor, selecciona un archivo en formato PDF.');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!archivo) {
            setError('Debes seleccionar un archivo PDF para analizar.');
            return;
        }

        setIsLoading(true);
        setError('');

        const formData = new FormData();
        formData.append('documento', archivo);

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}api/analisis/analizar-pdf`;
            const token = localStorage.getItem('token');

            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData,
            });

            if (!response.ok) {
                // Si la respuesta no es OK, intentamos leer el error del cuerpo de la respuesta
                const errorData = await response.json();
                // Creamos un error que contiene el mensaje del backend
                const error = new Error(errorData.error || `Error HTTP: ${response.status}`);
                // También adjuntamos el status para poder usarlo en el catch
                error.status = response.status;
                throw error;
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'documento_anotado.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

        } catch (err) {
            if (err.status === 401 || err.status === 403) {
                setError('Tu sesión ha expirado. Por favor, inicia sesión de nuevo.');
                setTimeout(() => navigate('/login'), 2000);
            } else if (err instanceof TypeError && err.message === 'Failed to fetch') {
                // Este es el error de conexión (ERR_CONNECTION_REFUSED)
                setError('Error de conexión: No se pudo comunicar con el servidor. ¿Está encendido?');
            } else {
                // Para todos los demás errores, mostramos el mensaje que construimos antes
                setError(err.message || 'Ocurrió un error inesperado al analizar el documento.');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="analizador-container">
            <h2>Analizador de Documentos PDF</h2>
            <p>Sube un documento en formato PDF. El sistema lo analizará, identificará términos legales y generará una versión anotada con un glosario al final.</p>

            <form onSubmit={handleSubmit} className="upload-form">
                <label htmlFor="file-upload" className="custom-file-upload">
                    <FaFileUpload /> {nombreArchivo || 'Seleccionar archivo PDF...'}
                </label>
                <input id="file-upload" type="file" accept=".pdf" onChange={handleFileChange} />

                <button type="submit" disabled={isLoading || !archivo}>
                    {isLoading ? <><FaSpinner className="spinner" /> Analizando...</> : 'Analizar y Generar PDF'}
                </button>

                {error && <p className="error-message">{error}</p>}
            </form>
        </div>
    );
}

export default AnalizadorPDF;