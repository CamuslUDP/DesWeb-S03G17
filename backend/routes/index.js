const express = require("express");
const router = express.Router();

const hb = require("./heartbeat");
const auth = require("./auth");
const user = require("./user");
const game = require("./game");

router.use("/heartbeat", hb);
router.use("/auth", auth);
router.use("/user", authRequired, userRoutes);
router.use("/game", authRequired, gameRoutes);


// middleware authRequired (para usar en rutas protegidas)
function authRequired(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "No autenticado" });
    req.user = validarToken(token); // usa tu utils/jwt.validarToken
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}

module.exports = router;
