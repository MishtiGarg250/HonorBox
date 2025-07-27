const Image = require("../models/Image");
const multer = require("multer");

// Configure Multer (store images in memory as Buffer)
const storage = multer.memoryStorage();
const upload = multer({ storage }).single("image");

// Upload Image
exports.uploadImage = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) return res.status(500).json({ success: false, message: "Upload failed", error: err });

    try {
      const imageBuffer = req.file.buffer.toString("base64"); // Convert image to Base64
      const { certificateId } = req.body; // Get certificate ID from request body

      const newImage = new Image({
        name: req.file.originalname,
        image: imageBuffer,
        certificateId: certificateId || null, // Associate with certificate if provided
      });

      await newImage.save();
      res.json({ success: true, message: "Image uploaded successfully!", image: newImage });
    } catch (error) {
      res.status(500).json({ success: false, message: "Upload failed", error });
    }
  });
};

// Retrieve Images
exports.getImages = async (req, res) => {
  try {
    const images = await Image.find();
    res.json(images);
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch images", error });
  }
};

// Get Images by Certificate ID
exports.getImagesByCertificateId = async (req, res) => {
  try {
    const { certificateId } = req.params;
    const images = await Image.find({ certificateId });
    res.json({ success: true, images });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch images", error });
  }
};