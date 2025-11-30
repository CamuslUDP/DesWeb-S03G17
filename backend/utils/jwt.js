const jwt = require("jsonwebtoken");
const config = require("../../commons/configs/site.config.js");
const SECRET = config.JWT_SECRET || "super-secret-key";

function crearToken(datos) {
  return jwt.sign(datos, SECRET, { expiresIn: "10m" });
}

function validarToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { crearToken, validarToken };