const express = require('express');
const router = express.Router();


const pool = require('../db');

// Listar productos
router.get('/', (req, res) => {
	pool.query('SELECT p.*, (SELECT url FROM imagenes_productos WHERE producto_id = p.id LIMIT 1) as imagen_url FROM productos p', (err, results) => {
		if (err) {
			return res.render('error', { mensaje: 'Error al obtener productos' });
		}
		res.render('productos', { productos: results, session: req.session });
	});
});


// Middleware para proteger rutas (solo usuarios autenticados)
function requireAuth(req, res, next) {
	if (req.session && req.session.user) {
		return next();
	}
	res.status(403).render('error', { mensaje: 'Acceso denegado. Inicia sesión.' });
}

// Mostrar formulario para crear producto (protegido)
router.get('/nuevo', requireAuth, (req, res) => {
	const categoria_id = req.query.categoria_id || '';
	res.render('producto_form', { producto: { categoria_id }, accion: 'Crear', session: req.session });
});

// Crear producto (protegido)
router.post('/', requireAuth, (req, res) => {
	let { nombre, precio, categoria_id } = req.body;
	if (!categoria_id || categoria_id === '') categoria_id = null;
	const query = categoria_id ?
		'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, ?)' :
		'INSERT INTO productos (nombre, precio, categoria_id) VALUES (?, ?, NULL)';
	const params = categoria_id ? [nombre, precio, categoria_id] : [nombre, precio];
	pool.query(query, params, (err) => {
		if (err) {
			return res.render('error', { mensaje: 'Error al crear producto: ' + err.message });
		}
		if (categoria_id) {
			res.redirect(`/categorias/${categoria_id}/productos`);
		} else {
			res.redirect('/productos');
		}
	});
});
// Ver detalle de producto
router.get('/:id', (req, res) => {
	const { id } = req.params;
	pool.query('SELECT p.*, c.nombre as categoria_nombre FROM productos p LEFT JOIN categorias c ON p.categoria_id = c.id WHERE p.id = ?', [id], (err, productos) => {
		if (err || productos.length === 0) {
			return res.render('error', { mensaje: 'Producto no encontrado' });
		}
		const producto = productos[0];
		pool.query('SELECT * FROM imagenes_productos WHERE producto_id = ?', [id], (err, imagenes) => {
			if (err) {
				return res.render('error', { mensaje: 'Error al obtener las imágenes del producto' });
			}
			res.render('producto_detalle', {
				producto,
				categoria: producto.categoria_nombre ? { nombre: producto.categoria_nombre } : null,
				imagenes,
				session: req.session
			});
		});
	});
});

// Mostrar formulario para editar producto (protegido)
router.get('/editar/:id', requireAuth, (req, res) => {
	const { id } = req.params;
	pool.query('SELECT * FROM productos WHERE id = ?', [id], (err, results) => {
		if (err || results.length === 0) {
			return res.render('error', { mensaje: 'Producto no encontrado' });
		}
		res.render('producto_form', { producto: results[0], accion: 'Editar', session: req.session });
	});
});

// Actualizar producto (protegido)
router.post('/editar/:id', requireAuth, (req, res) => {
	const { id } = req.params;
	const { nombre, precio } = req.body;
	pool.query('UPDATE productos SET nombre = ?, precio = ? WHERE id = ?', [nombre, precio, id], (err) => {
		if (err) {
			return res.render('error', { mensaje: 'Error al actualizar producto' });
		}
		res.redirect('/productos');
	});
});

// Eliminar producto (protegido)
router.post('/eliminar/:id', requireAuth, (req, res) => {
	const { id } = req.params;
	pool.query('DELETE FROM productos WHERE id = ?', [id], (err) => {
		if (err) {
			return res.render('error', { mensaje: 'Error al eliminar producto' });
		}
		res.redirect('/productos');
	});
});

module.exports = router;
