const express = require("express");
const mongoose = require("mongoose");
const { validarToken } = require("../utils/jwt");

const router = express.Router();
const usuarios = mongoose.connection.collection("usuarios");

router.use((req, res, next) => {
  try {
    const token = req.cookies.session;
    const datos = validarToken(token);
    req.user = datos;
    next();
  } catch {
    return res.status(401).json({ error: "Sesión no válida o expirada" });
  }
});

router.get("/profile", async (req, res) => {
  const user = await usuarios.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });

  res.json({
    username: user.username,
    fullName: user.fullName,
    balance: user.balance
  });
});

router.post("/deposit", async (req, res) => {
  const amount = Number(req.body.amount);

  if (amount <= 0) return res.status(400).json({ error: "Monto inválido" });

  await usuarios.updateOne(
    { _id: new mongoose.Types.ObjectId(req.user.id) },
    { $inc: { balance: amount } }
  );

  const user = await usuarios.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });

  res.json({ success: true, balance: user.balance });
});

router.post("/withdraw", async (req, res) => {
  const amount = Number(req.body.amount);
  const user = await usuarios.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });

  if (amount <= 0 || amount > user.balance)
    return res.status(400).json({ error: "Monto inválido" });

  await usuarios.updateOne(
    { _id: user._id },
    { $inc: { balance: -amount } }
  );

  res.json({ success: true, balance: user.balance - amount });
});

module.exports = router;
