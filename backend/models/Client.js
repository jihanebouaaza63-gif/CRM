const mongoose = require("mongoose");

const clientSchema = new mongoose.Schema({
  nom: { type: String, required: [true, "Le nom est obligatoire"], trim: true },
  email: { type: String, required: [true, "L'email est obligatoire"], unique: true, lowercase: true, trim: true },
  telephone: { type: String, trim: true, default: "" },
  entreprise: { type: String, trim: true, default: "" },
  statut: { type: String, enum: ["prospect", "client", "inactif"], default: "prospect" }
}, { timestamps: true });

module.exports = mongoose.model("Client", clientSchema);