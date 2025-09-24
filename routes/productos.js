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

// Configuración Multer para subir imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
});
const upload = multer({ storage });

// ---------------------
// Listar productos con filtros
// ---------------------
router.get('/', async (req, res) => {
  try {
    const { nombre, precio_min, precio_max, categoria } = req.query;

    // Consulta base para obtener productos con sus relaciones
    let query = `
      SELECT DISTINCT p.id, p.nombre, p.precio, c.nombre AS categoria, 
             (SELECT ip.url FROM imagenes_productos ip WHERE ip.producto_id = p.id LIMIT 1) AS imagen_url
      FROM productos p
      LEFT JOIN categorias c ON p.categoria_id = c.id
      WHERE 1=1
    `;
    const params = [];

    // Aplicar filtros si se proporcionan
    if (nombre) {
      query += ' AND p.nombre LIKE ?';
      params.push(`%${nombre}%`);
    }

    if (precio_min) {
      query += ' AND p.precio >= ?';
      params.push(parseFloat(precio_min));
    }

    if (precio_max) {
      query += ' AND p.precio <= ?';
      params.push(parseFloat(precio_max));
    }

    if (categoria) {
      query += ' AND c.nombre = ?';
      params.push(categoria);
    }

    // Ordenar productos por ID descendente
    query += ' ORDER BY p.id DESC';

    // Ejecutar consultas
    const [productos] = await pool.query(query, params);
    const [categorias] = await pool.query('SELECT nombre FROM categorias ORDER BY nombre ASC');

    // Renderizar vista con resultados
    res.render('productos', {
      productos,
      categorias,
      nombre: nombre || '',
      precio_min: precio_min || '',
      precio_max: precio_max || '',
      categoria: categoria || '',
      session: req.session
    });

  } catch (err) {
    console.error('Error al obtener productos:', err);
    res.render('error', { 
      mensaje: 'Error al obtener productos',
      session: req.session
    });
  }
});

// ---------------------
// Formulario nuevo producto
// ---------------------
router.get('/nuevo', requireAuth, async (req, res) => {
  try {
    const [categorias] = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre ASC');
    const categoria_id = req.query.categoria_id;
    let producto = {};
    
    if (categoria_id) {
      const [catResult] = await pool.query('SELECT id, nombre FROM categorias WHERE id = ?', [categoria_id]);
      if (catResult.length > 0) {
        producto.categoria_id = catResult[0].id;
        producto.categoria = catResult[0].nombre;
      }
    }
    
    res.render('producto_form', { 
      producto, 
      categorias, 
      accion: 'Crear', 
      session: req.session 
    });
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

    // Validaciones
    if (!nombre || !precio || !categoria) {
      return res.render('error', { 
        mensaje: 'Todos los campos son obligatorios',
        session: req.session
      });
    }

    // Buscar la categoría por nombre
    const [catResults] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [categoria]);
    if (catResults.length === 0) {
      return res.render('error', { 
        mensaje: 'La categoría seleccionada no es válida',
        session: req.session
      });
    }
    const categoria_id = catResults[0].id;

    // Crear el producto
    const [result] = await pool.query(
      'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)',
      [nombre, precio, categoria_id]
    );

    // Manejar la imagen si se proporcionó una
    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await pool.query(
        'INSERT INTO imagenes_productos (producto_id, url) VALUES (?, ?)',
        [result.insertId, imageUrl]
      );
    }

    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    const [categorias] = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre ASC');
    res.render('producto_form', {
      producto: req.body,
      categorias,
      accion: 'Crear',
      error: 'Error al crear el producto: ' + err.message,
      session: req.session
    });
  }
});

// ---------------------
// Ver detalle de producto
// ---------------------
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [productos] = await pool.query(
      `SELECT p.*, c.nombre AS categoria_nombre
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
// Formulario editar producto
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
// Actualizar producto
// ---------------------
router.post('/editar/:id', requireAuth, upload.single('imagen'), async (req, res) => {
  try {
    const { nombre, precio, categoria } = req.body;
    const productoId = req.params.id;

    // Validaciones
    if (!nombre || !precio || !categoria) {
      return res.render('error', { 
        mensaje: 'Todos los campos son obligatorios',
        session: req.session
      });
    }

    // Verificar que el producto existe
    const [prodExists] = await pool.query('SELECT id FROM productos WHERE id = ?', [productoId]);
    if (prodExists.length === 0) {
      return res.render('error', { 
        mensaje: 'El producto no existe',
        session: req.session
      });
    }

    // Buscar la categoría por nombre
    const [catResults] = await pool.query('SELECT id FROM categorias WHERE nombre = ?', [categoria]);
    if (catResults.length === 0) {
      return res.render('error', { 
        mensaje: 'La categoría seleccionada no es válida',
        session: req.session
      });
    }
    const categoria_id = catResults[0].id;

    // Actualizar el producto
    await pool.query(
      'UPDATE productos SET nombre = ?, precio = ?, categoria_id = ? WHERE id = ?',
      [nombre, precio, categoria_id, productoId]
    );

    // Manejar la imagen si se proporcionó una
    if (req.file) {
      const imageUrl = '/uploads/' + req.file.filename;
      await pool.query(
        'INSERT INTO imagenes_productos (producto_id, url) VALUES (?, ?)',
        [productoId, imageUrl]
      );
    }

    res.redirect('/productos');
  } catch (err) {
    console.error(err);
    const [categorias] = await pool.query('SELECT id, nombre FROM categorias ORDER BY nombre ASC');
    const [producto] = await pool.query(
      'SELECT p.*, c.nombre as categoria FROM productos p ' +
      'LEFT JOIN categorias c ON p.categoria_id = c.id ' +
      'WHERE p.id = ?',
      [req.params.id]
    );
    res.render('producto_form', {
      producto: producto[0],
      categorias,
      accion: 'Editar',
      error: 'Error al actualizar el producto: ' + err.message,
      session: req.session
    });
  }
});

// ---------------------
// Eliminar producto
// ---------------------
router.post('/eliminar/:id', requireAuth, async (req, res) => {
  const { id } = req.params;
  try {
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
