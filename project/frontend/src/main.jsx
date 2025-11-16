import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Navbar from './components/navbar'
import Home from './pages/home'
import Login from './pages/Login'
import Register from './pages/Register'
import Generador from './pages/Generador'
import BuscadorDiccionario from './components/BuscadorDiccionario.jsx'
import AnalizadorPDF from './pages/AnalizadorPDF.jsx'
import GuiaOJV from "./pages/guiaOJV";

// Definición de las rutas
const router = createBrowserRouter([
  {
    path: '/', // Ruta principal
    element: <App />, // Componente principal de la aplicación
    errorElement: <div>Error al cargar la aplicación</div>, // Componente de error
    children: [
      {
        index: true,               // Ruta por defecto
        element: <Home />,         // Componente para la ruta principal
      },
      {
        path: 'Inicio',            // Ruta para la página de inicio
        element: <Home />,         // Componente para la página de inicio
      }, 
      { 
        path: 'login', 
        element: <Login /> 
      },
      { 
        path: 'register', 
        element: <Register /> 
      },
      {
        path: 'generador',
        element: <Generador />,
      }, 
      {
        path: 'guia-ojv',
        element: <GuiaOJV />, // Placeholder para la guía
      },{
        path: 'analizador',
        element: <AnalizadorPDF />
      },
      {
        path: 'diccionario', 
        element: <BuscadorDiccionario />,
      
      }
    ],
  },
])


const root = createRoot(document.getElementById("root"));
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);