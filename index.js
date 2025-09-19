const express = require('express');
const bodyParser = require('body-parser');
const methodOverride = require('method-override');
const cors = require('cors');
const session = require('express-session');

const app = express(); 
const PORT = 3000;

// Configuración de EJS
app.set('view engine', 'ejs');
app.set('views', __dirname + '/views');

// Servir archivos estáticos
app.use(express.static('public'));
app.use('/uploads', express.static('public/uploads'));

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
app.use(methodOverride('_method'));
app.use(session({
  secret: 'mi_clave_secreta',
  resave: false,
  saveUninitialized: false
}));
// Hacer la sesión disponible en todas las vistas EJS
app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

// Importar rutas
const categoriasRoutes = require('./routes/categorias');
const productosRoutes = require('./routes/productos');
const imagenesRoutes = require('./routes/imagenes');
const loginRoutes = require('./routes/login');
const registrarRoutes = require ('./routes/registrar');
const homeRoutes = require ('./routes/home')




// Registrar rutas
app.use('/login', loginRoutes);
app.use('/registrar',registrarRoutes);
app.use('/home',homeRoutes);
app.use('/categorias', categoriasRoutes);
app.use('/productos', productosRoutes);
app.use('/imagenes', imagenesRoutes);

// Redirección por defecto a productos
app.get('/', (req, res) => {
  res.redirect('/productos');
});

// Manejo de errores
app.use((req, res) => {
  res.status(404).render('error', { mensaje: 'Página no encontrada' });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

module.exports = app;
