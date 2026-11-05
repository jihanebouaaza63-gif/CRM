
const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config();

const app = express();

// Middlewares
app.use(express.json());

// Route Clients
const clientRoutes = require("./routes/client");
app.use(" ", clientRoutes);

// Frontend statique
app.use(express.static(path.join(__dirname, "../frontend")));

// Route de test
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Bienvenue dans l'API CRM !"
  });
});

// Connexion MongoDB et démarrage du serveur
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connecté avec succès !");

    app.listen(PORT, () => {
      console.log(`Serveur démarré sur le port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Erreur de connexion MongoDB :", error.message);
  });
