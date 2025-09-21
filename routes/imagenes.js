const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../db');
const path = require('path');
const fs = require('fs').promises;

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'public/uploads'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// Listar imágenes y filtrar por categoría/producto
router.get('/', async (req, res) => {
  try {
    const [categorias] = await pool.query('SELECT * FROM categorias');
    const [productos] = await pool.query('SELECT * FROM productos');
    const { categoria_id, producto_id } = req.query;

    let query = 'SELECT * FROM imagenes_productos';
    let params = [];

    if (producto_id) {
      query += ' WHERE producto_id = ?';
      params.push(producto_id);
    } else if (categoria_id) {
      query += ' WHERE producto_id IN (SELECT id FROM productos WHERE categoria_id = ?)';
      params.push(categoria_id);
    }

    const [imagenes] = await pool.query(query, params);

    res.render('imagenes', { categorias, productos, categoria_id, producto_id, imagenes });
  } catch (err) {
    res.render('error', { mensaje: 'Error al obtener imágenes' });
  }
});

// Formulario para subir imágenes
router.get('/producto/nueva', async (req, res) => {
  try {
    const [categorias] = await pool.query('SELECT * FROM categorias');
    const [productos] = await pool.query('SELECT * FROM productos');
    res.render('imagen_form', { categorias, productos });
  } catch (err) {
    res.render('error', { mensaje: 'Error al obtener categorías o productos' });
  }
});

// Subir imágenes
router.post('/producto/:producto_id', upload.array('imagenes', 10), async (req, res) => {
  const { producto_id } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.render('error', { mensaje: 'Por favor, selecciona al menos una imagen' });
  }

  const values = files.map(f => ['/uploads/' + f.filename, producto_id]);

  try {
    await pool.query('INSERT INTO imagenes_productos (url, producto_id) VALUES ?', [values]);
    res.redirect(`/imagenes?producto_id=${producto_id}`);
  } catch (err) {
    res.render('error', { mensaje: 'Error al guardar las imágenes' });
  }
});

// Eliminar imagen
router.post('/eliminar/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [results] = await pool.query('SELECT * FROM imagenes_productos WHERE id = ?', [id]);
    if (results.length === 0) return res.render('error', { mensaje: 'Imagen no encontrada' });

    const imagen = results[0];

    await pool.query('DELETE FROM imagenes_productos WHERE id = ?', [id]);

    // Eliminar archivo físico
    const imagePath = path.join('public', imagen.url);
    try { await fs.unlink(imagePath); } catch (e) { /* ignorar error si no existe */ }

    res.redirect('/imagenes' + (imagen.producto_id ? `?producto_id=${imagen.producto_id}` : ''));
  } catch (err) {
    res.render('error', { mensaje: 'Error al eliminar la imagen' });
  }
});

module.exports = router;

