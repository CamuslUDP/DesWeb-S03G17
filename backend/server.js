const apiRoutes = require('./routes');
const config = require('../commons/configs/site.config.js');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');

const { connectDB } = require('./utils/db');

const app = express();
app.use(express.json());
app.use(cookieParser());

// == API ===============================
app.use('/api', apiRoutes);

// == Archivos ==========================
app.use(express.static(path.join(__dirname, '../frontend/html')));
app.use(express.static(path.join(__dirname, '../frontend/css')));
app.use(express.static(path.join(__dirname, '../frontend/js')));
app.use(express.static(path.join(__dirname, '../frontend/fotos')));

// == Fallback =====================================
app.use('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

// == Servidor ==========================
async function startServer() {
    try {
        // Conectar a MongoDB antes de empezar a escuchar peticiones
        await connectDB();
        
        // El servidor se inicia solo si la conexión a la DB es exitosa
        app.listen(3042, () => {
            console.log(`Servidor Express escuchando en puerto 3042`);
            console.log(`Dominio configurado: ${config.DOMAIN}`);
        });

    } catch (error) {
        console.error("No se pudo iniciar el servidor debido a un error de conexión a la DB.");
        process.exit(1);
    }
}

startServer();