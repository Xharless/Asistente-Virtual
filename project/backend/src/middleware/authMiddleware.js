import jwt from 'jsonwebtoken';

function authMiddleware(req, res, next) {
    // 1. Obtener el header de autorización
    const authHeader = req.header('Authorization');

    // 2. Si no hay header o no tiene el formato 'Bearer ...', denegar acceso
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Acceso denegado. No hay token.' });
    }

    try {
        // Extraer solo el token, quitando "Bearer "
        const token = authHeader.split(' ')[1];

        // 3. Verificar si el token es válido
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // 4. Si es válido, guardamos los datos del usuario en la request
        // para que las siguientes rutas puedan usarlo
        req.usuario = decoded.usuario;
        
        // 5. Continuar a la siguiente función (la ruta principal)
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token no es válido.' });
    }
}

export default authMiddleware;
