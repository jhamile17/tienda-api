const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');

// Middleware de autenticación (ajústalo según tu lógica real)
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    next();
  } else {
    res.redirect('/login');
  }
}

// ---------------------
// Configuración de multer para subir imágenes
// ---------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/uploads'));
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// ---------------------
// Listar productos con su imagen principal
// ---------------------
router.get('/', async (req, res) => {
  try {
    const [productos] = await pool.query(`
      SELECT p.*, 
             (SELECT url 
              FROM imagenes_productos 
              WHERE producto_id = p.id 
              ORDER BY id DESC 
              LIMIT 1) AS imagen_url
      FROM productos p
    `);

    res.render('productos', { productos });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener productos' });
  }
});

// ---------------------
// Detalle de producto con todas sus imágenes
// ---------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [[producto]] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    const [[categoria]] = await pool.query(
      'SELECT * FROM categorias WHERE id = ?',
      [producto.categoria_id]
    );
    const [imagenes] = await pool.query('SELECT * FROM imagenes_productos WHERE producto_id = ?', [id]);

    res.render('detalleProducto', { producto, categoria, imagenes });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener detalle del producto' });
  }
});

// ---------------------
// Crear producto (+ imagen)
// ---------------------
router.post('/crear', requireAuth, upload.single('imagen'), async (req, res) => {
  const { nombre, precio, categoria_id } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)',
      [nombre, precio, categoria_id]
    );

    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await pool.query('INSERT INTO imagenes_productos (producto_id, url) VALUES (?, ?)', [
        result.insertId,
        imageUrl
      ]);
    }

    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al crear producto' });
  }
});

// ---------------------
// Editar producto (+ nueva imagen opcional)
// ---------------------
router.post('/editar/:id', requireAuth, upload.single('imagen'), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio } = req.body;
  try {
    await pool.query('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?', [
      nombre,
      precio,
      id
    ]);

    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await pool.query('INSERT INTO imagenes_productos (producto_id, url) VALUES (?, ?)', [
        id,
        imageUrl
      ]);
    }

    res.redirect('/productos/' + id);
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al actualizar producto' });
  }
});

// ---------------------
// Eliminar producto (y sus imágenes)
// ---------------------
router.post('/eliminar/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM imagenes_productos WHERE producto_id = ?', [id]);
    await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al eliminar producto' });
  }
});

module.exports = router;
