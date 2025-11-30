const apiRoutes = require('./routes');
const config = require('../commons/configs/site.config.js');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const { connectDB } = require('./utils/db');

const app = express();

// Middleware
app.use(express.json());
app.use(cookieParser());

// == API ===============================
app.use('/api', apiRoutes);

// == Archivos Estáticos (Frontend) =====
app.use(express.static(path.join(__dirname, '../frontend/html')));
app.use(express.static(path.join(__dirname, '../frontend/css')));
app.use(express.static(path.join(__dirname, '../frontend/js')));
app.use(express.static(path.join(__dirname, '../frontend/fotos')));

// == Rutas específicas para archivos HTML si no se resuelven automáticamente ==
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/index.html')));
app.get('/login', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/login.html')));
app.get('/registro', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/registro.html')));
app.get('/perfil', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/perfil.html')));
app.get('/ruleta', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/ruleta.html')));
app.get('/transacciones', (req, res) => res.sendFile(path.join(__dirname, '../frontend/html/transacciones.html')));

// == Fallback SPA (Opcional, redirige a index si no encuentra nada) ==
app.use((req, res) => {
    if (req.originalUrl.startsWith('/api')) {
        return res.status(404).json({ error: "API endpoint not found" });
    }
    res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

// == Servidor ==========================
async function startServer() {
    try {
        await connectDB();
        app.listen(3042, "0.0.0.0", () => {
            console.log(`Servidor Express escuchando en puerto 3042`);
            console.log(`Dominio configurado: ${config.DOMAIN}`);
        });
    } catch (error) {
        console.error("Error crítico iniciando servidor:", error);
    }
}

startServer();