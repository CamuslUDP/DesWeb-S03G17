const express = require("express");
const mongoose = require("mongoose");
const { validarToken } = require("../utils/jwt");
const { calcularPago } = require("../utils/payments");

const router = express.Router();
const usuarios = mongoose.connection.collection("usuarios");
const historial = mongoose.connection.collection("historial");

router.use((req, res, next) => {
  try {
    req.user = validarToken(req.cookies.session);
    next();
  } catch {
    return res.status(401).json({ error: "Sesión inválida" });
  }
});

router.post("/bet", (req, res) => {
  // Validación simple: existe el array de apuestas
  if (!Array.isArray(req.body.bets))
    return res.status(400).json({ error: "Apuestas inválidas" });

  res.json({ ok: true });
});

router.post("/spin", async (req, res) => {
  const bets = req.body.bets;
  const result = Math.floor(Math.random() * 37); // 0-36

  let total = 0;

  for (const b of bets) {
    total += calcularPago({
      type: b.type,
      value: b.value,
      amount: b.amount,
      result
    });
  }

  await usuarios.updateOne(
    { _id: new mongoose.Types.ObjectId(req.user.id) },
    { $inc: { balance: total } }
  );

  await historial.insertOne({
    userId: req.user.id,
    bets,
    result,
    win: total,
    date: new Date()
  });

  res.json({ result, win: total });
});

router.get("/history", async (req, res) => {
  const data = await historial
    .find({ userId: req.user.id })
    .sort({ date: -1 })
    .limit(20)
    .toArray();

  res.json(data);
});

module.exports = router;
