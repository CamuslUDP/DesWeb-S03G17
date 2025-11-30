const express = require("express");
const bcrypt = require("bcrypt");
const { crearToken } = require("../utils/jwt");
const mongoose = require("mongoose");

const router = express.Router();
const usuarios = mongoose.connection.collection("usuarios");

router.post("/register", async (req, res) => {
  try {
    const { fullName, email, username, password, birthDate } = req.body;

    if (!fullName || !email || !username || !password || !birthDate) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    const nacimiento = new Date(birthDate);
    const hoy = new Date();
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const m = hoy.getMonth() - nacimiento.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < nacimiento.getDate())) {
        edad--;
    }
    if (edad < 18) return res.status(400).json({ error: "Debe ser mayor de 18 años" });

    const existe = await usuarios.findOne({ 
      $or: [{ email }, { username }] 
    });
    if (existe) return res.status(400).json({ error: "Email o username ya existe" });

    const passwordHash = await bcrypt.hash(password, 10);

    await usuarios.insertOne({
      fullName,
      email,
      username,
      passwordHash,
      birthDate,
      balance: 0,
      createdAt: new Date()
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error en registro:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
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
      maxAge: 10 * 60 * 1000
    });

    res.json({ success: true, username: user.username });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.clearCookie("session", {
    httpOnly: true,
    secure: true,
    sameSite: "strict"
  });
  return res.json({ success: true });
});

module.exports = router;