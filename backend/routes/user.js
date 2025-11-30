const express = require("express");
const mongoose = require("mongoose");
const { validarToken } = require("../utils/jwt");

const router = express.Router();
const usuarios = mongoose.connection.collection("usuarios");
const historial = mongoose.connection.collection("historial");

router.use((req, res, next) => {
  try {
    const token = req.cookies.session;
    if(!token) throw new Error("No token");
    req.user = validarToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "No autorizado" });
  }
});

// GET /api/user/profile
router.get("/profile", async (req, res) => {
  const user = await usuarios.findOne({ _id: new mongoose.Types.ObjectId(req.user.id) });
  if (!user) return res.status(404).json({ error: "Usuario no encontrado" });

  res.json({
    username: user.username,
    fullName: user.fullName,
    email: user.email,
    birthDate: user.birthDate,
    balance: user.balance
  });
});

// POST /api/user/deposit
router.post("/deposit", async (req, res) => {
  const amount = Number(req.body.amount);
  if (!amount || amount <= 0) return res.status(400).json({ error: "Monto inválido" });

  const userId = new mongoose.Types.ObjectId(req.user.id);

  await usuarios.updateOne(
    { _id: userId },
    { $inc: { balance: amount } }
  );

  await historial.insertOne({
      userId,
      action: "DEPOSIT",
      amount,
      date: new Date()
  });

  const user = await usuarios.findOne({ _id: userId });
  res.json({ success: true, balance: user.balance });
});

// POST /api/user/withdraw
router.post("/withdraw", async (req, res) => {
  const amount = Number(req.body.amount);
  const userId = new mongoose.Types.ObjectId(req.user.id);
  const user = await usuarios.findOne({ _id: userId });

  if (!amount || amount <= 0) return res.status(400).json({ error: "Monto inválido" });
  if (user.balance < amount) return res.status(400).json({ error: "Saldo insuficiente" });

  await usuarios.updateOne(
    { _id: userId },
    { $inc: { balance: -amount } }
  );

  await historial.insertOne({
    userId,
    action: "WITHDRAW",
    amount: -amount,
    date: new Date()
});

  res.json({ success: true, balance: user.balance - amount });
});

// GET /api/user/transactions
router.get("/transactions", async (req, res) => {
    const list = await historial
        .find({ 
            userId: new mongoose.Types.ObjectId(req.user.id),
            action: { $in: ["DEPOSIT", "WITHDRAW"] } 
        })
        .sort({ date: -1 })
        .limit(20)
        .toArray();
    res.json(list);
});

module.exports = router;