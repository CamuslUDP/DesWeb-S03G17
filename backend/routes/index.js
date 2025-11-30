const express = require("express");
const router = express.Router();

const hb = require("./heartbeat");
const authRoutes = require("./auth");
const userRoutes = require("./user");
const gameRoutes = require("./game");

const { validarToken } = require("../utils/jwt");

function authRequired(req, res, next) {
  try {
    const token = req.cookies?.session;
    if (!token) return res.status(401).json({ error: "No autenticado" });
    req.user = validarToken(token);
    return next();
  } catch (err) {
    return res.status(401).json({ error: "Sesión inválida o expirada" });
  }
}

router.use("/heartbeat", hb);
router.use("/auth", authRoutes);
router.use("/user", authRequired, userRoutes);
router.use("/game", authRequired, gameRoutes);

module.exports = router;
