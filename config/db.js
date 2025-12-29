const mysql = require('mysql2'); // Importamos el módulo `mysql2` para trabajar con MySQL
require('dotenv').config(); // Importamos el módulo `dotenv` para cargar variables de entorno

// Creamos un pool de conexiones a la base de datos
const pool = mysql.createPool({
  host: process.env.DB_HOST, // Dirección del servidor de la base de datos
  user: process.env.DB_USER, // Nombre de usuario para la base de datos
  password: process.env.DB_PASSWORD, // Contraseña para la base de datos
  database: process.env.DB_NAME, // Nombre de la base de datos
  waitForConnections: true, // Si el pool debe esperar conexiones si se agotan
  connectionLimit: 10, // Número máximo de conexiones simultáneas
  queueLimit: 0, // Máximo número de conexiones pendientes en la cola (0 significa ilimitado)
});

// Exportamos el pool de conexiones prometido
module.exports = pool.promise();
