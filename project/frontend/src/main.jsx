import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import Navbar from './components/navbar';
// Importación de las páginas
import Home from './pages/home'







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