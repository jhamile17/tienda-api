const express = require('express');
const router = express.Router();
const pool = require('../db');

// Middleware para proteger rutas (solo usuarios autenticados)
function requireAuth(req, res, next) {
	if (req.session && req.session.user) {
		return next();
	}
	res.status(403).render('error', { mensaje: 'Acceso denegado. Inicia sesión.' });
}

// Listar productos
router.get('/', async (req, res) => {
	try {
		const [results] = await pool.query(
			`SELECT p.*, 
				(SELECT url FROM imagenes_productos WHERE producto_id = p.id LIMIT 1) as imagen_url 
			 FROM productos p`
		);
		res.render('productos', { productos: results, session: req.session });
	} catch (err) {
		console.error(err);
		res.render('error', { mensaje: 'Error al obtener productos' });
	}
});

// Mostrar formulario para crear producto (protegido)
router.get('/nuevo', requireAuth, (req, res) => {
	const categoria_id = req.query.categoria_id || '';
	res.render('producto_form', { producto: { categoria_id }, accion: 'Crear', session: req.session });
});

// Crear producto (protegido)
router.post('/', requireAuth, async (req, res) => {
	try {
		let { nombre, precio, categoria_id } = req.body;
		if (!categoria_id || categoria_id === '') categoria_id = null;

		const query = categoria_id
			? 'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)'
			: 'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, NULL)';
		const params = categoria_id ? [nombre, precio, categoria_id] : [nombre, precio];

		await pool.query(query, params);

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

// Ver detalle de producto
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

// Mostrar formulario para editar producto (protegido)
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

// Actualizar producto (protegido)
router.post('/editar/:id', requireAuth, async (req, res) => {
	const { id } = req.params;
	const { nombre, precio } = req.body;
	try {
		await pool.query('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?', [nombre, precio, id]);
		res.redirect('/productos');
	} catch (err) {
		console.error(err);
		res.render('error', { mensaje: 'Error al actualizar producto' });
	}
});

// Eliminar producto (protegido)
router.post('/eliminar/:id', requireAuth, async (req, res) => {
	const { id } = req.params;
	try {
		await pool.query('DELETE FROM productos WHERE id = ?', [id]);
		res.redirect('/productos');
	} catch (err) {
		console.error(err);
		res.render('error', { mensaje: 'Error al eliminar producto' });
	}
});

module.exports = router;

