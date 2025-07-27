const Certificate = require("../models/Certificate");
const Image = require("../models/Image");
const QRCode = require("qrcode");
const nodemailer = require("nodemailer");
const Joi = require("joi");


const certificateSchema = Joi.object({
  name: Joi.string().min(3).max(50).required(),
  email: Joi.string().email().required(),
  certificateType: Joi.string().valid("Participation", "Completion", "Excellence", "Achievement").required(),
});


// Function to generate a unique 7-letter alphanumeric ID
const generateUniqueId = () => {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let uniqueId = "";
  for (let i = 0; i < 7; i++) {
    uniqueId += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return uniqueId;
};

// Generate Certificate
exports.generateCertificate = async (req, res) => {
  try {
    const { name, email, certificateType } = req.body;
    const { error } = certificateSchema.validate({ name, email, certificateType });
    if (error) return res.status(400).json({ message: error.details[0].message });

    let uniqueId;
    let existingCertificate;
    do {
      uniqueId = generateUniqueId();
      existingCertificate = await Certificate.findOne({ uniqueId });
    } while (existingCertificate);

    // Generate QR Code linking to the verification page
    const verificationUrl = `${process.env.FRONTEND_URL}/verify/${uniqueId}`;
    const qrCodeUrl = await QRCode.toDataURL(verificationUrl);

    // Save to database
    const certificate = new Certificate({ name, email, certificateType, uniqueId, qrCodeUrl });
    await certificate.save();

    res.status(201).json({ message: "Certificate generated", uniqueId, qrCodeUrl, certificate });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📧 Send Certificate API
exports.sendCertificate = async (req, res) => {
  const { email, image } = req.body;
  
  if (!email || !image) return res.status(400).json({ message: "Email and image are required" });

  try {
    // Setup Nodemailer
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Email Options
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your Certificate",
      html: "<p>Congratulations! Here is your certificate.</p>",
      attachments: [
        {
          filename: "certificate.png",
          content: image.split(";base64,").pop(),
          encoding: "base64",
        },
      ],
    };

    // Send Email
    await transporter.sendMail(mailOptions);
    res.json({ message: "Certificate sent successfully!" });
  } catch (error) {
    res.status(500).json({ message: "Error sending certificate", error });
  }
};

// Verify Certificate
exports.verifyCertificate = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const certificate = await Certificate.findOne({ uniqueId });

    if (!certificate) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Fetch associated background images
    const images = await Image.find({ certificateId: uniqueId });
    
    // Add images to certificate response
    const certificateWithImages = {
      ...certificate.toObject(),
      backgroundImages: images
    };

    res.json(certificateWithImages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get All Certificates
exports.getAllCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find();
    res.json(certificates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


exports.verifyCertificateMAil = async (req, res) => {
  try {
    const { uniqueId } = req.params;
    const certificate = await Certificate.findOne({ uniqueId });

    if (!certificate) {
      return res.status(404).send("<h2 style='color:red;'>❌ Invalid Certificate</h2>");
    }

    res.send(`
      <html>
        <head>
          <title>Certificate Verification</title>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 50px; }
            h2 { color: green; }
            p { font-size: 18px; }
          </style>
        </head>
        <body>
          <h2>✅ Certificate Verified</h2>
          <p><strong>Name:</strong> ${certificate.name}</p>
          <p><strong>Email:</strong> ${certificate.email}</p>
          <p><strong>Unique ID:</strong> ${certificate.uniqueId}</p>
          <p>Your certificate is valid! 🎉</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).send("<h2 style='color:red;'>❌ Server Error</h2>");
  }
};

