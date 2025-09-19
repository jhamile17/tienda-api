const express = require('express');
const router = express.Router();
const pool = require('../db');

// Listar todas las categorías
router.get('/', (req, res) => {
	pool.query('SELECT * FROM categorias', (err, results) => {
		if (err) return res.render('error', { mensaje: 'Error al obtener categorías' });
		res.render('categorias', { categorias: results });
	});
});

// Mostrar formulario para nueva categoría
router.get('/nueva', (req, res) => {
	res.render('categoria_form', { categoria: {}, accion: 'Crear', error: null });
});

// Crear nueva categoría
router.post('/nueva', (req, res) => {
	const { nombre } = req.body;
	if (!nombre) return res.render('categoria_form', { categoria: {}, accion: 'Crear', error: 'El nombre es obligatorio' });
	pool.query('INSERT INTO categorias (nombre) VALUES (?)', [nombre], (err) => {
		if (err) return res.render('categoria_form', { categoria: {}, accion: 'Crear', error: 'Error al crear categoría' });
		res.redirect('/categorias');
	});
});

// Mostrar formulario para editar categoría
router.get('/editar/:id', (req, res) => {
	const { id } = req.params;
	pool.query('SELECT * FROM categorias WHERE id = ?', [id], (err, results) => {
		if (err || results.length === 0) return res.render('error', { mensaje: 'Categoría no encontrada' });
		res.render('categoria_form', { categoria: results[0], accion: 'Editar', error: null });
	});
});

// Editar categoría
router.post('/editar/:id', (req, res) => {
	const { id } = req.params;
	const { nombre } = req.body;
	if (!nombre) return res.render('categoria_form', { categoria: { id, nombre }, accion: 'Editar', error: 'El nombre es obligatorio' });
	pool.query('UPDATE categorias SET nombre = ? WHERE id = ?', [nombre, id], (err) => {
		if (err) return res.render('categoria_form', { categoria: { id, nombre }, accion: 'Editar', error: 'Error al actualizar categoría' });
		res.redirect('/categorias');
	});
});

// Eliminar categoría
router.post('/eliminar/:id', (req, res) => {
	const { id } = req.params;
	pool.query('DELETE FROM categorias WHERE id = ?', [id], (err) => {
		if (err) return res.render('error', { mensaje: 'Error al eliminar categoría' });
		res.redirect('/categorias');
	});
});

// Mostrar productos de una categoría
router.get('/:id/productos', (req, res) => {
	const { id } = req.params;
	pool.query('SELECT * FROM categorias WHERE id = ?', [id], (err, catResults) => {
		if (err || catResults.length === 0) return res.render('error', { mensaje: 'Categoría no encontrada' });
		const categoria = catResults[0];
		pool.query('SELECT * FROM productos WHERE categoria_id = ?', [id], (err, prodResults) => {
			if (err) return res.render('error', { mensaje: 'Error al obtener productos de la categoría' });
			res.render('productos_categoria', { categoria, productos: prodResults, session: req.session });
		});
	});
});

module.exports = router;
