const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todas las categorías
router.get('/', async (req, res) => {
	try {
		const [results] = await pool.query('SELECT * FROM categorias');
		res.render('categorias', { categorias: results });
	} catch (err) {
		console.error(err);
		res.render('error', { mensaje: 'Error al obtener categorías' });
	}
});

// Mostrar formulario para nueva categoría
router.get('/nueva', (req, res) => {
	res.render('categoria_form', { categoria: {}, accion: 'Crear', error: null });
});

// Crear nueva categoría
router.post('/nueva', async (req, res) => {
	const { nombre } = req.body;
	if (!nombre) return res.render('categoria_form', { categoria: {}, accion: 'Crear', error: 'El nombre es obligatorio' });

	try {
		await pool.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre]);
		res.redirect('/categorias');
	} catch (err) {
		console.error(err);
		res.render('categoria_form', { categoria: {}, accion: 'Crear', error: 'Error al crear categoría' });
	}
});

// Mostrar formulario para editar categoría
router.get('/editar/:id', async (req, res) => {
	const { id } = req.params;
	try {
		const [results] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
		if (results.length === 0) return res.render('error', { mensaje: 'Categoría no encontrada' });
		res.render('categoria_form', { categoria: results[0], accion: 'Editar', error: null });
	} catch (err) {
		console.error(err);
		res.render('error', { mensaje: 'Error al obtener categoría' });
	}
});

// Editar categoría
router.post('/editar/:id', async (req, res) => {
	const { id } = req.params;
	const { nombre } = req.body;
	if (!nombre) return res.render('categoria_form', { categoria: { id, nombre }, accion: 'Editar', error: 'El nombre es obligatorio' });

	try {
		await pool.query('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, id]);
		res.redirect('/categorias');
	} catch (err) {
		console.error(err);
		res.render('categoria_form', { categoria: { id, nombre }, accion: 'Editar', error: 'Error al actualizar categoría' });
	}
});

// Eliminar categoría
router.post('/eliminar/:id', async (req, res) => {
	const { id } = req.params;
	try {
		await pool.query('DELETE FROM categorias WHERE id = ?', [id]);
		res.redirect('/categorias');
	} catch (err) {
		console.error(err);
		res.render('error', { mensaje: 'Error al eliminar categoría' });
	}
});

// Mostrar productos de una categoría
router.get('/:id/productos', async (req, res) => {
	const { id } = req.params;
	try {
		// Obtener información de la categoría
		const [catResults] = await pool.query('SELECT * FROM categorias WHERE id = ?', [id]);
		if (catResults.length === 0) {
			return res.render('error', { 
				mensaje: 'Categoría no encontrada',
				session: req.session
			});
		}

		const categoria = catResults[0];

		// Obtener productos con sus imágenes
		const [prodResults] = await pool.query(`
			SELECT p.*, 
				   (SELECT ip.url 
					FROM imagenes_productos ip 
					WHERE ip.producto_id = p.id 
					LIMIT 1) as imagen_url
			FROM productos p
			WHERE p.categoria_id = ?
			ORDER BY p.id DESC
		`, [id]);

		res.render('productos_categoria', { 
			categoria, 
			productos: prodResults, 
			session: req.session 
		});
	} catch (err) {
		console.error('Error al obtener productos de la categoría:', err);
		res.render('error', { 
			mensaje: 'Error al obtener productos de la categoría',
			session: req.session
		});
	}
});

module.exports = router;
