const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  // Obtener el token del encabezado Authorization
  const authHeader = req.header('Authorization');

  // Verificar que el encabezado exista y tenga el formato correcto
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      error: 'Acceso denegado. El encabezado Authorization es obligatorio.',
    });
  }

  // Extraer el token
  const token = authHeader.split(' ')[1];

  // Verificar que la clave secreta JWT esté configurada
  if (!process.env.JWT_SECRET) {
    return res.status(500).json({ error: 'Error interno del servidor' });
  }

  try {
    // Verificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Validar que el payload contenga los campos necesarios
    if (!decoded.id || !decoded.email) {
      return res
        .status(403)
        .json({ error: 'Token inválido: falta información esencial.' });
    }

    // Adjuntar los datos del usuario a la solicitud
    req.user = decoded;
    next();
  } catch (error) {
    // Manejar errores específicos
    if (error.name === 'TokenExpiredError') {
      return res.status(403).json({
        error: 'Token expirado. Por favor, inicia sesión nuevamente.',
      });
    }
    if (error.name === 'JsonWebTokenError') {
      return res
        .status(403)
        .json({ error: 'Token inválido o ha sido manipulado.' });
    }

    return res.status(403).json({ error: 'Token inválido o expirado.' });
  }
};
