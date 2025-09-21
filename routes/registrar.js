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
    const [results] = await pool.promise().query('SELECT * FROM usuarios WHERE usuario = ?', [usuario]);

    if (results.length > 0) {
      return res.render('registrar', { error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await pool.promise().query('INSERT INTO usuarios (usuario, password) VALUES (?, ?)', [usuario, hashedPassword]);

    res.redirect('/login');

  } catch (error) {
    console.error('Error en /registrar:', error);
    res.status(500).render('registrar', { error: 'Error interno del servidor' });
  }
});

module.exports = router;


