const express = require("express");
const bcrypt = require("bcrypt");
const { crearToken } = require("../utils/jwt");
const mongoose = require("mongoose");

const router = express.Router();
const usuarios = mongoose.connection.collection("usuarios");

router.post("/register", async (req, res) => {
  const { fullName, email, username, password, birthDate } = req.body;

  const nacimiento = new Date(birthDate);
  const edad = new Date().getFullYear() - nacimiento.getFullYear();
  if (edad < 18) return res.status(400).json({ error: "Debe ser mayor de 18 años" });

  const existe = await usuarios.findOne({ 
    $or: [{ email }, { username }] 
  });

  if (existe) return res.status(400).json({ error: "Email o username ya existe" });

  const hash = await bcrypt.hash(password, 10);

  await usuarios.insertOne({
    fullName,
    email,
    username,
    passwordHash: hash,
    birthDate,
    balance: 0
  });

  res.json({ success: true });
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  const user = await usuarios.findOne({ username });
  if (!user) return res.status(400).json({ error: "Credenciales inválidas" });

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) return res.status(400).json({ error: "Credenciales inválidas" });

  const token = crearToken({ id: user._id, username: user.username });

  res.cookie("session", token, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
  });

  res.json({ success: true });
});

router.post("/logout", (req, res) => {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict'
  };
  res.clearCookie("session", cookieOptions);
  return res.json({ success: true });
});
module.exports = router;
