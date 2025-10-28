import './navbar.css';

function Navbar() {
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-content">
                    <div className="navbar-logo">
                        <a href="/" className="logo-link">
                        🏛️ TramitaFácil
                        </a>
                    </div>

                    <div className="nav-links-container">
                        <div className="nav-links">
                            <a 
                                href="/" 
                                className="nav-link"
                            >
                                Home
                            </a>
                            <a 
                                href="/guia-ojv" 
                                className="nav-link"
                            >
                                Guía OJV
                            </a>
                            <a 
                                href="/generador" 
                                className="nav-link"
                            >
                                Generador Docs
                            </a>
                            <a 
                                href="/diccionario" 
                                className="nav-link"
                            >
                                Diccionario
                            </a>
                        </div>
                    </div>

                    <div className="login-button-container">
                        <a 
                            href="/login" 
                            className="login-button"
                        >
                            Iniciar Sesión
                        </a>
                    </div>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;

