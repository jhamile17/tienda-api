const express = require('express');
const router = express.Router();
const pool = require('../db');
const bcrypt = require('bcryptjs');

// Mostrar formulario de registro
router.get('/', (req, res) => {
  res.render('registrar', { error: ""});
});

// Procesar registro (POST /registrar)
router.post('/', async (req, res) => {
  const { usuario, password } = req.body;

  if (!usuario || !password) {
    return res.render('registrar', { error: 'Faltan datos' });
  }

  try {
    // Verificar si ya existe el usuario
    pool.query('SELECT * FROM usuarios WHERE usuario = ?', [usuario], async (err, results) => {
      if (err) {
         return res.render('registrar', { error: 'Error en la base de datos' });
      }

      if (results.length > 0) {
         return res.render('registrar', { error: 'El usuario ya existe' });
      }

      // Encriptar la contraseña
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insertar nuevo usuario
      pool.query('INSERT INTO usuarios (usuario, password) VALUES (?, ?)', [usuario, hashedPassword], (err) => {
        if (err) {
           return res.render('registrar', { error: 'Error al registrar el usuario' });
        }

        res.redirect('/login');
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
