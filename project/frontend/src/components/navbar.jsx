import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import { FaUserCircle, FaChevronDown } from 'react-icons/fa';
import './navbar.css';

function Navbar() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [user, setUser] = useState(null);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const dropdownRef = useRef(null); 

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            try {
                const decodedToken = jwtDecode(token);
                setUser({ nombre: decodedToken.nombre_completo });
                setIsAuthenticated(true);
            } catch (error) {
                console.error("Token inválido, cerrando sesión:", error);
                handleLogout();
            }
        } else {
            setIsAuthenticated(false);
            setUser(null);
        }
    }, [location]); 
    
    useEffect(() => {
        function handleClickOutside(event) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsDropdownOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [dropdownRef]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        setIsAuthenticated(false);
        setUser(null);
        navigate('/login'); 
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

                    <div className="navbar-right-section">
                        <div className="nav-links-container">
                            <div className="nav-links">
                                <Link to="/" className="nav-link">
                                    Home
                                </Link>
                                <Link to="/guia-ojv" className="nav-link">
                                    Guía OJV
                                </Link>
                                <Link to="/generador" className="nav-link">
                                    Generador Docs
                                </Link>
                                <Link to="/diccionario" className="nav-link">
                                    Diccionario
                                </Link>
                            </div>
                        </div>

                        <div className="login-button-container">
                            {isAuthenticated ? (
                                <div className="profile-menu-container" ref={dropdownRef}>
                                    <button 
                                        className={`profile-trigger ${isDropdownOpen ? 'active' : ''}`} 
                                        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                    >
                                        <FaUserCircle className="profile-icon" />
                                        <span className="profile-name">{user?.nombre}</span>
                                        <FaChevronDown className="dropdown-arrow" />
                                    </button>
                                    {isDropdownOpen && (
                                        <div className="dropdown-menu">
                                            <Link to="/perfil" className="dropdown-item">
                                                Mi Perfil
                                            </Link>
                                            <button onClick={handleLogout} className="dropdown-item dropdown-item-logout">
                                                Cerrar Sesión
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link to="/login" className="login-button">
                                    Iniciar Sesión
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
