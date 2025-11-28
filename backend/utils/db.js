const { MongoClient } = require('mongodb');

// Reemplaza esta URL con la cadena de conexión real de tu MongoDB
// Si usas un servicio Atlas, la URL será diferente.
const MONGODB_URI = 'mongodb://localhost:27017';
const DB_NAME = 'rappibet_db';

let db;

/**
 * Conecta a MongoDB.
 * @returns {Promise<Db>} La instancia de la base de datos conectada.
 */
async function connectDB() {
    if (db) {
        return db; // Devuelve la conexión existente si ya está disponible
    }
    try {
        console.log('Intentando conectar a MongoDB...');
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        db = client.db(DB_NAME);
        console.log('Conexión a MongoDB exitosa!');
        return db;
    } catch (error) {
        console.error('Error al conectar a MongoDB:', error);
        // En un proyecto real, lanzaríamos el error para detener el servidor
        throw error; 
    }
}

/**
 * Obtiene la instancia de la base de datos.
 * @returns {Db}
 */
function getDB() {
    if (!db) {
        throw new Error("La base de datos no está conectada. Llama a connectDB primero.");
    }
    return db;
}

module.exports = { connectDB, getDB };