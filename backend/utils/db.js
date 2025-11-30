const mongoose = require("mongoose");

async function connectDB() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/ruleta", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Conexión a MongoDB exitosa!");
  } catch (err) {
    console.error("Error conectando a MongoDB:", err);
    throw err;
  }
}

module.exports = { connectDB };
