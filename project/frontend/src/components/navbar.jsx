import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './navbar.css';

function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            setIsAuthenticated(true);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        navigate('/login'); // Redirige al login después de cerrar sesión
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-content">
                    <div className="navbar-logo">
                        <Link to="/" className="logo-link">
                        🏛️ TramitaFácil
                        </Link>
                    </div>

                    <div className="nav-links-container">
                        <div className="nav-links">
                            <Link 
                                to="/" 
                                className="nav-link"
                            >
                                Home
                            </Link>
                            <Link 
                                to="/guia-ojv" 
                                className="nav-link"
                            >
                                Guía OJV
                            </Link>
                            <Link 
                                to="/generador" 
                                className="nav-link"
                            >
                                Generador Docs
                            </Link>
                            <Link 
                                to="/diccionario" 
                                className="nav-link"
                            >
                                Diccionario
                            </Link>
                        </div>
                    </div>

                    <div className="login-button-container">
                        {isAuthenticated ? (
                            <button onClick={handleLogout} className="logout-button">
                                Cerrar Sesión
                            </button>
                        ) : (
                            <Link to="/login" className="login-button">
                                Iniciar Sesión
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
