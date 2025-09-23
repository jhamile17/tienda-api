const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../db');
const path = require('path');
const fs = require('fs');

// Configuración de almacenamiento para multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// Listar imágenes y filtrar por categoría/producto
router.get('/', (req, res) => {
  pool.query('SELECT * FROM categorias', (err, categorias) => {
    if (err) return res.render('error', { mensaje: 'Error al obtener categorías' });
    pool.query('SELECT * FROM productos', (err, productos) => {
      if (err) return res.render('error', { mensaje: 'Error al obtener productos' });
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

      pool.query(query, params, (err, imagenes) => {
        if (err) return res.render('error', { mensaje: 'Error al obtener imágenes' });
        res.render('imagenes', { categorias, productos, categoria_id, producto_id, imagenes });
      });
    });
  });
});

// Formulario para subir imágenes
router.get('/producto/nueva', (req, res) => {
  pool.query('SELECT * FROM categorias', (err, categorias) => {
    if (err) return res.render('error', { mensaje: 'Error al obtener categorías' });
    pool.query('SELECT * FROM productos', (err, productos) => {
      if (err) return res.render('error', { mensaje: 'Error al obtener productos' });
      res.render('imagen_form', { categorias, productos });
    });
  });
});

// Subir imágenes a producto
router.post('/producto/:producto_id', upload.array('imagenes', 10), async (req, res) => {
  const { producto_id } = req.params;
  const files = req.files;

  if (!files || files.length === 0) {
    return res.render('error', { mensaje: 'Por favor, selecciona al menos una imagen' });
  }

  try {
    for (const file of files) {
      const imageUrl = '/uploads/' + file.filename;
      await new Promise((resolve, reject) => {
        pool.query(
          'INSERT INTO imagenes_productos (url, producto_id) VALUES (?, ?)',
          [imageUrl, producto_id],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });
    }
    res.redirect(`/imagenes?producto_id=${producto_id}`);
  } catch (err) {
    console.error(err);
    res.render('error', { mensaje: 'Error al guardar las imágenes' });
  }
});

// Eliminar imagen
router.post('/eliminar/:id', (req, res) => {
  const { id } = req.params;
  pool.query('SELECT * FROM imagenes_productos WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) {
      return res.render('error', { mensaje: 'Imagen no encontrada' });
    }

    const imagen = results[0];

    // Eliminar registro de la base de datos
    pool.query('DELETE FROM imagenes_productos WHERE id = ?', [id], (err) => {
      if (err) {
        return res.render('error', { mensaje: 'Error al eliminar la imagen' });
      }

      // Eliminar archivo físico
      const imagePath = path.join('public', imagen.url);
      fs.unlink(imagePath, (err) => {
        // Ignorar error si el archivo no existe
        res.redirect('/imagenes' + (imagen.producto_id ? `?producto_id=${imagen.producto_id}` : ''));
      });
    });
  });
});

module.exports = router;
