const mongoose = require("mongoose");

const ImageSchema = new mongoose.Schema({
  name: String,
  image: String, // Stores Base64 string
  certificateId: { type: String, required: false }, // Associate image with certificate
  uploadedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Image", ImageSchema);