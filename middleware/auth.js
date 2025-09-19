const jwt = require('jsonwebtoken');

const SECRET_KEY = 'mi_clave_secreta'; // Usa la misma clave que en login.js

function verifyToken(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1]; // Espera "Bearer <token>"

  if (!token) {
    return res.status(403).json({ error: 'Token requerido' });
  }

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) {
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
    req.user = decoded; // Guarda los datos del usuario (id, usuario)
    next();
  });
}

module.exports = verifyToken;
