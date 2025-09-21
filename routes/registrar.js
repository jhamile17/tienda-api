const express = require('express');
const router = express.Router();
const pool = require('../db'); // mysql2/promise
const bcrypt = require('bcryptjs');

router.get('/', (req, res) => {
  res.render('registrar', { error: "" });
});

router.post('/', async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.render('registrar', { error: 'Faltan datos' });
  }

  try {
    const [existingUsers] = await pool.query(
      'SELECT id FROM usuarios WHERE usuario = ?',
      [usuario]
    );

    if (existingUsers.length > 0) {
      return res.render('registrar', { error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO usuarios (usuario, password) VALUES (?, ?)',
      [usuario, hashedPassword]
    );

    res.redirect('/login');

  } catch (error) {
    console.error('Error en /registrar:', error.code, error.sqlMessage);
    res.status(500).render('registrar', { error: 'Error interno del servidor' });
  }
});

module.exports = router;


