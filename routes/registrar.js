const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// Función para consultas seguras con reintento
async function safeQuery(query, params = [], retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      const [rows] = await pool.promise().query(query, params);
      return rows;
    } catch (err) {
      console.error(`Intento ${i + 1} fallido:`, err.code, err.sqlMessage);
      if (i === retries - 1) throw err;
      await new Promise(res => setTimeout(res, 500));
    }
  }
}

// Mostrar formulario de registro
router.get('/', (req, res) => {
  res.render('registrar', { error: "" });
});

// Procesar registro
router.post('/', async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.render('registrar', { error: 'Faltan datos' });
  }

  try {
    // Verificar si ya existe el usuario
    const existingUsers = await safeQuery('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    if (existingUsers.length > 0) {
      return res.render('registrar', { error: 'El usuario ya existe' });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const result = await safeQuery(
      'INSERT INTO usuarios (usuario, password) VALUES (?, ?)',
      [usuario, hashedPassword]
    );

    if (result.affectedRows === 1) {
      return res.redirect('/login');
    } else {
      throw new Error('No se pudo registrar el usuario');
    }

  } catch (error) {
    console.error('Error en /registrar:', error.code, error.sqlMessage);

    let mensajeError = 'Error interno del servidor';
    if (error.code === 'ER_DUP_ENTRY') {
      mensajeError = 'El usuario ya existe';
    } else if (error.code === 'ECONNREFUSED') {
      mensajeError = 'No se pudo conectar a la base de datos, intenta más tarde';
    } else if (error.code === 'ER_DATA_TOO_LONG') {
      mensajeError = 'El usuario o la contraseña son demasiado largos';
    }

    return res.status(500).render('registrar', { error: mensajeError });
  }
});

module.exports = router;
