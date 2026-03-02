const jwt = require("jsonwebtoken");

const verifyToken = (roles = []) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return res.status(401).json({
          ok: false,
          message: "Token requerido"
        });
      }

      const token = authHeader.split(" ")[1];

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;

      if (roles.length && !roles.includes(decoded.rol)) {
        return res.status(403).json({
          ok: false,
          message: "Acceso denegado"
        });
      }

      next();

    } catch (error) {
      return res.status(401).json({
        ok: false,
        message: "Token inválido"
      });
    }
  };
};

module.exports = verifyToken;