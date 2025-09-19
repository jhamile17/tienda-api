
const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../db');
const path = require('path');

// Selector de categoría y producto y mostrar imágenes filtradas
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

// Listar imágenes por producto
// Ya no es necesario, todo se maneja desde la raíz

// Listar imágenes por categoría
router.get('/categoria/:categoria_id', (req, res) => {
	const { categoria_id } = req.params;
	pool.query('SELECT * FROM imagenes_productos WHERE producto_id IN (SELECT id FROM productos WHERE categoria_id = ?)', [categoria_id], (err, results) => {
		if (err) return res.render('error', { mensaje: 'Error al obtener imágenes' });
		res.render('imagenes', { imagenes: results, categoria_id });
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
router.post('/producto/:producto_id', upload.array('imagenes', 10), (req, res) => {
	const { producto_id } = req.params;
	const files = req.files;

	if (!files || files.length === 0) {
		return res.render('error', { mensaje: 'Por favor, selecciona al menos una imagen' });
	}

	const values = files.map(f => ['/uploads/' + f.filename, producto_id]);
	pool.query('INSERT INTO imagenes_productos (url, producto_id) VALUES ?', [values], (err) => {
		if (err) {
			return res.render('error', { mensaje: 'Error al guardar las imágenes' });
		}
		res.redirect(`/imagenes?producto_id=${producto_id}`);
	});
});

// Eliminar imagen
router.post('/eliminar/:id', (req, res) => {
	const { id } = req.params;
	pool.query('SELECT * FROM imagenes_productos WHERE id = ?', [id], (err, results) => {
		if (err || results.length === 0) {
			return res.render('error', { mensaje: 'Imagen no encontrada' });
		}

		const imagen = results[0];
		const fs = require('fs');

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
