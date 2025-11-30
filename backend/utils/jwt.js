const jwt = require("jsonwebtoken");
// Intentamos leer el secreto desde la config, o usamos uno por defecto
const config = require("../../commons/configs/site.config.js");
const SECRET = config.JWT_SECRET || "super-secret-key";

function crearToken(datos) {
  // Expiración de 10 minutos requerida
  return jwt.sign(datos, SECRET, { expiresIn: "10m" });
}

function validarToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { crearToken, validarToken };