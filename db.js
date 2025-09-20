const mysql = require('mysql2');

const pool = mysql.createPool({
  host: process.env.DB_HOST,       // Host de la DB en Railway
  user: process.env.DB_USER,       // Usuario de la DB
  password: process.env.DB_PASSWORD, // Contraseña
  database: process.env.DB_NAME,   // Nombre de la DB
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
