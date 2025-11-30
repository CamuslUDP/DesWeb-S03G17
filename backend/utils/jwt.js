const jwt = require("jsonwebtoken");

const SECRET = "CAMBIAR_ESTE_VALOR";

function crearToken(datos) {
  return jwt.sign(datos, SECRET, { expiresIn: "10m" });
}

function validarToken(token) {
  return jwt.verify(token, SECRET);
}

module.exports = { crearToken, validarToken };
