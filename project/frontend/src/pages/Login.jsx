import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Login.css'; // Usamos el CSS específico para Login

function Login() {
    const [email, setEmail] = useState("");
    const [contrasena, setContrasena] = useState("");
    const [error, setError] = useState("");
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault(); // Evita que el formulario recargue la página
        setError(""); // Limpia errores previos

        try {
            const apiUrl = `${import.meta.env.VITE_API_URL}api/auth/login`;
            const respuesta = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, contrasena }),
            });

            const data = await respuesta.json();

            if (!respuesta.ok) {
                // Si el servidor responde con 401 o 500, 'data.error' tendrá el mensaje
                throw new Error(data.error || 'Error al iniciar sesión.');
            }

            // --- ¡ÉXITO! ---
            // 1. Guardamos el token en el almacenamiento local del navegador
            localStorage.setItem('token', data.token);

            // 2. Redireccionamos al usuario al Home (o a su dashboard)
            // (Usando react-router-dom, esto sería con useNavigate(), 
            // pero window.location es más simple)
            window.location.href = '/'; // Redirige al Home

        } catch (err) {
            setError(err.message);
            console.error("Error en el login:", err.message);
        }
    };

    return (
        <div className="login-container"> {/* Aplica tus estilos aquí */}
            <h2>Iniciar Sesión</h2>
            <form onSubmit={handleSubmit}>
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
                        required 
                    />
                </div>
                {error && <p className="error-message">{error}</p>}
                <button type="submit">Ingresar</button>
            </form>
            <div className="register-link">
                ¿No tienes cuenta? <Link to="/register">Regístrate aquí</Link>
            </div>
        </div>
    );
}

export default Login;