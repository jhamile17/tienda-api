const mysql = require('mysql2');

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root', // Cambia esto por tu usuario de MySQL
  password: '', // Cambia esto por tu contraseña de MySQL
  database: 'tienda', // Cambia esto por el nombre de tu base de datos
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
