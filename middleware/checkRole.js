const checkRole = (...requiredRoles) => {
  return (req, res, next) => {
    const user = req.user;

    // Validar que el payload contenga los campos necesarios
    if (!user || !user.id || !user.email) {
      console.error(
        '[ERROR CHECKROLE]: Token inválido: falta información esencial.'
      );
      return res
        .status(403)
        .json({ error: 'Token inválido: falta información esencial.' });
    }

    // Validar que requiredRoles sea una lista de cadenas válidas
    if (
      !Array.isArray(requiredRoles) ||
      requiredRoles.some((role) => typeof role !== 'string')
    ) {
      console.error(
        '[ERROR CHECKROLE]: Los roles requeridos deben ser cadenas.'
      );
      return res.status(500).json({ error: 'Error interno del servidor' });
    }

    // Verificar si el rol del usuario existe y está incluido en la lista de roles requeridos
    if (
      user.rol &&
      requiredRoles
        .map((role) => role.toLowerCase())
        .includes(user.rol.toLowerCase())
    ) {
      next();
    } else {
      console.error(
        `[ERROR CHECKROLE]: Acceso denegado. Rol del usuario: ${user.rol}, Roles requeridos: ${requiredRoles.join(', ')}`
      );
      return res.status(403).json({
        error: `Acceso denegado. Se requiere uno de los siguientes roles: ${requiredRoles.join(', ')}.`,
      });
    }
  };
};

module.exports = checkRole;
