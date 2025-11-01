import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Register.css'; // Usamos el CSS específico para Register

function Register() {
    const [nombreCompleto, setNombreCompleto] = useState("");
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(""); 
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError("");
        setSuccess("");

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}api/auth/register`;
            const respuesta = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ nombre_completo: nombreCompleto, email, contrasena }),
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(data.error || 'Error al registrar la cuenta.');
            }

            setSuccess("¡Cuenta registrada con éxito! Redirigiendo al login...");
            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (err) {
            setError(err.message);
            console.error("Error en el registro:", err.message);
        }
    };

    return (
        <div className="register-container"> 
            <h2>Crear Cuenta</h2>
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="nombreCompleto">Nombre Completo</label>
                    <input 
                        type="text" 
                        id="nombreCompleto"
                        value={nombreCompleto}
                        onChange={(e) => setNombreCompleto(e.target.value)}
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input 
                        type="email" 
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required 
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="contrasena">Contraseña</label>
                    <input 
                        type="password" 
                        id="contrasena"
                        value={contrasena}
                        onChange={(e) => setContrasena(e.target.value)}
                        minLength="6" 
                        required 
                    />
                </div>

                {error && <p className="error-message">{error}</p>}
                {success && <p className="success-message">{success}</p>}

                <button type="submit">Registrarse</button>
            </form>
            <div className="login-link"> 
                ¿Ya tienes cuenta? <Link to="/login">Inicia sesión aquí</Link>
            </div>
        </div>
    );
}

export default Register;
