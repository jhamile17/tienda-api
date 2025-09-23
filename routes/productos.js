const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Middleware de sesión
function requireAuth(req, res, next) {
  if (req.session && req.session.user) return next();
  res.status(403).render('error', { mensaje: 'Acceso denegado. Inicia sesión.' });
}

// Configuración Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ---------------------
// Listar productos (filtro opcional por nombre de categoría)
// ---------------------
router.get('/', async (req, res) => {
  try {
    const { categoria } = req.query;
    let query = `
      SELECT p.id, p.nombre, p.precio, c.nombre AS categoria, ip.url AS imagen_url
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      LEFT JOIN imagenes_productos ip ON p.id = ip.producto_id
    `;
    const params = [];
    if (categoria) {
      query += ' WHERE c.nombre = ?';
      params.push(categoria);
    }
    query += ' GROUP BY p.id';

    const [productos] = await pool.query(query, params);
    const [categorias] = await pool.query('SELECT nombre FROM categorias');

    res.render('productos', { productos, categorias, categoria: categoria || '', session: req.session });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener productos' });
  }
});

// ---------------------
// Mostrar formulario nuevo
// ---------------------
router.get('/nuevo', requireAuth, async (req, res) => {
  try {
    const [categorias] = await pool.query('SELECT nombre FROM categorias');
    res.render('producto_form', { producto: {}, categorias, accion: 'Crear', session: req.session });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al cargar formulario' });
  }
});

// ---------------------
// Crear producto con imagen
// ---------------------
router.post('/nuevo', requireAuth, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, precio, categoria } = req.body;

    const [catResults] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [categoria]);
    if (catResults.length === 0) return res.render('error', { mensaje: 'Categoría no válida' });
    const categoria_id = catResults[0].id;

    const [result] = await pool.query(
      'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)',
      [nombre, precio, categoria_id]
    );

    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await pool.query('INSERT INTO imagenes_productos (producto_id, url) VALUES (?, ?)', [result.insertId, imageUrl]);
    }

    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al crear producto: ' + err.message });
  }
});

// ---------------------
// Ver detalle de producto
// ---------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [productos] = await pool.query(
      `SELECT p.*, c.nombre as categoria_nombre 
       FROM productos p 
       LEFT JOIN categorias c ON p.categoria_id = c.id 
       WHERE p.id = ?`, [id]
    );

    if (productos.length === 0) return res.render('error', { mensaje: 'Producto no encontrado' });

    const producto = productos[0];
    const [imagenes] = await pool.query('SELECT * FROM imagenes_productos WHERE producto_id = ?', [id]);

    res.render('producto_detalle', {
      producto,
      categoria: producto.categoria_nombre ? { nombre: producto.categoria_nombre } : null,
      imagenes,
      session: req.session
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener producto' });
  }
});

// ---------------------
// Mostrar formulario editar
// ---------------------
router.get('/editar/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [productos] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (productos.length === 0) return res.render('error', { mensaje: 'Producto no encontrado' });

    const producto = productos[0];
    const [catNombre] = await pool.query('SELECT nombre FROM categorias WHERE id = ?', [producto.categoria_id]);
    producto.categoria = catNombre.length ? catNombre[0].nombre : '';

    const [categorias] = await pool.query('SELECT nombre FROM categorias');
    res.render('producto_form', { producto, categorias, accion: 'Editar', session: req.session });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al cargar formulario' });
  }
});

// ---------------------
// Actualizar producto (+ imagen opcional)
// ---------------------
router.post('/editar/:id', requireAuth, upload.single('imagen'), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio, categoria } = req.body;

  try {
    const [catResults] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [categoria]);
    if (catResults.length === 0) return res.render('error', { mensaje: 'Categoría no válida' });
    const categoria_id = catResults[0].id;

    await pool.query('UPDATE productos SET nombre = ?, precio = ?, categoria_id = ? WHERE id = ?', [nombre, precio, categoria_id, id]);

    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await pool.query('INSERT INTO imagenes_productos (producto_id, url) VALUES (?, ?)', [id, imageUrl]);
    }

    res.redirect(`/productos/${id}`);
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al actualizar producto' });
  }
});

// ---------------------
// Eliminar producto
// ---------------------
router.post('/eliminar/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    // Borrar imágenes físicas
    const [imagenes] = await pool.query('SELECT * FROM imagenes_productos WHERE producto_id = ?', [id]);
    for (let img of imagenes) {
      const imagePath = path.join('public', img.url);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }

    await pool.query('DELETE FROM imagenes_productos WHERE producto_id = ?', [id]);
    await pool.query('DELETE FROM productos WHERE id = ?', [id]);

    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al eliminar producto' });
  }
});

module.exports = router;
