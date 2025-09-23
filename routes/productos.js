const express = require('express');
const router = express.Router();
const pool = require('../db');
const multer = require('multer');
const path = require('path');

// ---------------------
// Middleware de sesión
// ---------------------
function requireAuth(req, res, next) {
  if (req.session && req.session.user) {
    return next();
  }
  res.status(403).render('error', { mensaje: 'Acceso denegado. Inicia sesión.' });
}

// ---------------------
// Configuración Multer
// ---------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'public/uploads'); // Carpeta donde se guardan las imágenes
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Nombre único
  }
});
const upload = multer({ storage });

// ---------------------
// Listar productos (con imagen principal)
// ---------------------
router.get('/', async (req, res) => {
  try {
    const [results] = await pool.query(`
      SELECT p.id, p.nombre, p.precio, p.categoria_id,
             ip.url AS imagen_url
      FROM productos p
      LEFT JOIN imagenes_productos ip 
        ON p.id = ip.producto_id
      GROUP BY p.id
    `);

    res.render('productos', { productos: results, session: req.session });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener productos' });
  }
});

// ---------------------
// Mostrar formulario nuevo
// ---------------------
router.get('/nuevo', requireAuth, (req, res) => {
  const categoria_id = req.query.categoria_id || '';
  res.render('producto_form', { producto: { categoria_id }, accion: 'Crear', session: req.session });
});

// ---------------------
// Crear producto con imagen
// ---------------------
router.post('/', requireAuth, upload.single('imagen'), async (req, res) => {
  try {
    let { nombre, precio, categoria_id } = req.body;
    if (!categoria_id || categoria_id === '') categoria_id = null;

    // Insertar producto
    const [result] = await pool.query(
      'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)',
      [nombre, precio, categoria_id]
    );

    const productoId = result.insertId;

    // Guardar imagen si existe
    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await pool.query(
        'INSERT INTO imagenes_productos (producto_id, url) VALUES (?, ?)',
        [productoId, imageUrl]
      );
    }

    if (categoria_id) {
      res.redirect(`/categorias/${categoria_id}/productos`);
    } else {
      res.redirect('/productos');
    }
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

    if (productos.length === 0) {
      return res.render('error', { mensaje: 'Producto no encontrado' });
    }

    const producto = productos[0];
    const [imagenes] = await pool.query(
      'SELECT * FROM imagenes_productos WHERE producto_id = ?',
      [id]
    );

    res.render('producto_detalle', {
      producto,
      categoria: producto.categoria_nombre ? { nombre: producto.categoria_nombre } : null,
      imagenes,
      session: req.session
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener el producto' });
  }
});

// ---------------------
// Mostrar formulario editar
// ---------------------
router.get('/editar/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
    const [results] = await pool.query('SELECT * FROM productos WHERE id = ?', [id]);
    if (results.length === 0) {
      return res.render('error', { mensaje: 'Producto no encontrado' });
    }
    res.render('producto_form', { producto: results[0], accion: 'Editar', session: req.session });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener producto' });
  }
});

// ---------------------
// Actualizar producto (+ nueva imagen opcional)
// ---------------------
router.post('/editar/:id', requireAuth, upload.single('imagen'), async (req, res) => {
  const { id } = req.params;
  const { nombre, precio } = req.body;
  try {
    await pool.query('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?', [nombre, precio, id]);

    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await pool.query('INSERT INTO imagenes_productos (producto_id, url) VALUES (?, ?)', [id, imageUrl]);
    }

    res.redirect('/productos/' + id); // redirige al detalle
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
    await pool.query('DELETE FROM productos WHERE id = ?', [id]);
    await pool.query('DELETE FROM imagenes_productos WHERE producto_id = ?', [id]);
    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al eliminar producto' });
  }
});
// ---------------------
// Listar productos (filtrados por categoría predeterminada)
// ---------------------
router.get('/', async (req, res) => {
  try {
    // Puedes definir aquí la categoría predeterminada
    // Por ejemplo, la categoría con id = 1
    const categoria_predeterminada = 1;

    let query = `
      SELECT p.id, p.nombre, p.precio, p.categoria_id,
             ip.url AS imagen_url
      FROM productos p
      LEFT JOIN imagenes_productos ip 
        ON p.id = ip.producto_id
      WHERE p.categoria_id = ?
      GROUP BY p.id
    `;
    
    const [results] = await pool.query(query, [categoria_predeterminada]);

    // Obtener todas las categorías para mostrar en el header o selector
    const [categorias] = await pool.query('SELECT * FROM categorias');

    res.render('productos', { 
      productos: results, 
      categorias, 
      categoria_id: categoria_predeterminada, 
      session: req.session 
    });
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al obtener productos' });
  }
});


module.exports = router;

