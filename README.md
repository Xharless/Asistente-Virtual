# 🏛️ Asistente Legal OJV
Asistente virtual para abogados que simplifica la tramitación y generación de documentos en la Oficina Judicial Virtual (OJV) de Chile.

Este proyecto es desarrollado para la asignatura de Informática Legal y Derecho Informático (2S-2025) de la Universidad Técnica Federico Santa María.

### 🚨 El Problema
Identificamos una brecha digital significativa en el ejercicio del derecho en Chile.

* **Curva de Aprendizaje:** La Oficina Judicial Virtual (OJV) presenta una alta curva de aprendizaje para abogados no nativos digitales, generando una brecha generacional.

* **Errores y Retrasos:** Esta dificultad se traduce en retrasos en la tramitación, errores en la confección de escritos y una fuerte dependencia de personal de apoyo (procuradores, asistentes).

* **Proceso Manual:** La redacción de documentos legales (contratos, poderes, escritos) sigue siendo un proceso manual, lento y propenso a errores de formato.

* **Acceso a Información:** No existe un acceso rápido y centralizado a definiciones o guías sobre procedimientos específicos dentro de la misma herramienta de trabajo.

### 💡 La Solución
Asistente Legal OJV es una aplicación web diseñada para funcionar como un copiloto para el abogado, nivelando la cancha tecnológica.

* **Guía Interactiva:** Un módulo informativo con el "paso a paso" ilustrativo de las operaciones clave de la OJV (ej. subir escritos, revisar causas, agendar audiencias).

* **Generador de Documentos:** Un asistente que, mediante formularios simples, permite crear documentos legales (contratos, poderes, etc.) en formato PDF, listos para ser firmados y cargados.

* **Diccionario Legal Rápido:** Un buscador integrado para consultar terminología legal y referencias a leyes sin salir de la plataforma.

* **Autonomía Profesional:** Centralizamos las herramientas para reducir la fricción tecnológica, agilizar la redacción y aumentar la autonomía del profesional.

### 🎯 Misión
Reducir la brecha digital en el ejercicio del derecho en Chile, entregando autonomía a los abogados mediante una herramienta simple, intuitiva y centralizada que agiliza la tramitación y la generación de documentos.



# 📚 Documentación del Proyecto
### ⏱️ Requisitos Previos
Para poder ejecutar este proyecto, necesitas tener las siguientes herramientas instaladas en tu computadora:

Node.js (v16+ recomendado) → https://nodejs.org
* npm (v8+ recomendado, incluido con Node.js)
* git → https://git-scm.com/
* Editor de código (recomendado: VSCode)
* PostgreSQL (v13+ recomendado) → https://www.postgresql.org/download/

Verificar instalaciones (Terminal):

```bash
node -v
npm -v
git --version
```
### 🗂️ Estructura del Proyecto

El proyecto está organizado con directorios separados para el front-end y el back-end dentro de la carpeta project.
```bash
rescate-fresco-app/
├── project/
│   ├── frontend/   # Aplicación de front-end con React
│   └── backend/    # Servidor de back-end con Node.js y Express
├── tests/
│   └── test.py
├── .gitignore      # Archivo para ignorar directorios y archivos de Git
└── README.md       # Este archivo
```
### 🏛️ Dependencias

**Clonar Repositorio**

Abrir una terminal y ejecutar el siguiente comando para clonar el proyecto:
```bash
git clone https://github.com/Xharless/Asistente-Virtual.git
cd Asistente-Virtual
```

**Backend (package.json)**

* express → Framework para crear el servidor y gestionar rutas HTTP.
* cors → Middleware para habilitar peticiones cross-origin.
* dotenv → Librería para cargar variables de entorno.
* nodemon → Herramienta para reiniciar automáticamente la aplicación cada vez que detecta cambios
* pg → Cliente para PostgreSQL.
* bcrypt → Hasheo de contraseña.
* jsonwebtoken → Token para sesión.
* Otros módulos → Dependencias adicionales según el proyecto.

Instalación (Terminal):
```bash
cd project/backend
npm install
```
**Frontend (package.json)**

* react → Biblioteca principal para interfaces de usuario.
* react-dom → Gestión del DOM.
* react-scripts → Scripts para desarrollo y construcción.
* react-router-dom → Biblioteca que permite la navegación entre vistas.
* jwt-decode → Utilidad para decodificar tokens JWT en el cliente.
* react-icons → Librería de iconos propia de React   
* mocha-junit-reporter → Formatear en un archivo de salida con el formato JUnit XML
* Otros módulos → Dependencias adicionales según el proyecto.

Instalación (Terminal):
```bash
cd project/frontend
npm install
```

### ⚙️ Configuración del entorno
⚠️ IMPORTANTE: para configurar el entorno se debe crear un archivo .env en la carpeta backend/ y  frontend/. 

Luego, pegar el siguiente contenido en el archivo creado en backend:
```bash
PORT = 5000 # Se recomienda 5000
DATABASE_URL = postgres://usuario:contraseña@localhost:5432/asistente_db # Modificar ususario y contraseña de Postgres
```

Finalmente, pegar el siguiente contenido en el archivo creado en frontend:
```bash
VITE_API_URL=http://localhost:5000/
```
### 💾 Configuración de la Base de Datos

⚠️ IMPORTANTE: se debe tener PostgreSQL instalado y configurado con un **usuario y contraseña válidos**, los cuales deben ser agregados en el archivo .env (**Configuración del entorno**). 

Creae tablas: Antes de ejecutar el siguiente código en terminal, se debe modificar el usuario:
```bash
psql -U "usuario" -d asistente_db -f project/backend/src/database/init.sql
# Hay que cambiar el "usuario" y pedirá la contraseña de Postgres por terminal
```
### 🏆 Ejecución del Proyecto

Asegurar de tener ambos servidores corriendo para que el frontend pueda comunicarse con el backend.

**Backend (Terminal)**
```bash
# Para Desarrollo
cd project/backend
npm run dev

# Para Producción 
cd project/backend
npm run start
```

**Frontend (Terminal)**
```bash
cd project/frontend
npm run dev
```



# Cosas instaladas 
* npm install bcrypt jsonwebtoken en backend
* npm install jwt-decode en frontend
* npm install react-icons en frontend
* npm install puppeteer en backend