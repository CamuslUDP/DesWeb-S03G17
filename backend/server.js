const apiRoutes = require('./routes');
const config = require('../commons/configs/site.config.js');
const express = require('express');
const path = require('path');

const app = express();
app.use(express.json());
app.use(cookieParser()); // <-- AÑADIR: Para manejar cookies de sesión

// == API ===============================
app.use('/api', apiRoutes);

// == Archivos Estáticos ==========================
app.use(express.static(path.join(__dirname, '../frontend')));

// == Fallback =====================================
app.use((req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/html/index.html'));
});

/*
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
*/
// == Servidor ==========================
app.listen(3042, () => {
    console.log(`Servidor Express escuchando en puerto 3042`);
    console.log(`Dominio configurado: ${config.DOMAIN}`);
});


// Añadir esto al final del archivo
const { connectDB } = require('./utils/db');

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

startServer(); // Llamar a la función para iniciar