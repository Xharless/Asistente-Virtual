
import './Home.css'; 
function Home() {
    return (
        <div className="home-container">
            <div className="home-content">
                <h1 className="home-title">
                    Tu Asistente Legal, Simplificado
                </h1>
                <p className="home-subtitle">
                    Navega la Oficina Judicial Virtual (OJV) sin complicaciones, genera documentos legales en minutos y accede a un diccionario de términos al instante.
                </p>
                <div className="button-group">
                    <a
                        href="/generador"
                        className="cta-button cta-button-primary"
                    >
                        Empezar a Generar
                    </a>
                    <a
                        href="/guia-ojv"
                        className="cta-button cta-button-secondary"
                    >
                        Ver Guía OJV
                    </a>
                </div>
            </div>
        </div>
    );
}

export default Home;

