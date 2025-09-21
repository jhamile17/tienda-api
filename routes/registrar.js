const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// Mostrar formulario de registro
router.get('/', (req, res) => {
  res.render('registrar', { error: "" });
});

// Procesar registro (POST /registrar)
router.post('/', async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.render('registrar', { error: 'Faltan datos' });
  }

  try {
    // Verificar si ya existe el usuario
    const [existingUsers] = await pool.query(
      'SELECT id FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    if (existingUsers.length > 0) {
      return res.render('registrar', { error: 'El usuario ya existe' });
    }

    // Encriptar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insertar nuevo usuario
    const [insertResult] = await pool.query(
      'INSERT INTO usuarios (usuario, password) VALUES (?, ?)',
      [usuario, hashedPassword]
    );

    // Confirmar que se insertó
    if (insertResult.affectedRows === 1) {
      return res.redirect('/login');
    } else {
      throw new Error('No se pudo crear el usuario');
    }

  } catch (error) {
    console.error('Error en registro:', error);

    // Mostrar error exacto en Render para depuración
    let errorMsg = 'Error interno del servidor';
    if (error.code === 'ER_DUP_ENTRY') {
      errorMsg = 'El usuario ya existe';
    } else if (error.sqlMessage) {
      errorMsg = error.sqlMessage;
    }

    return res.status(500).render('registrar', { error: errorMsg });
  }
});

module.exports = router;


