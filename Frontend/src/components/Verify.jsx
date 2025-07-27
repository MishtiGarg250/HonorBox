import { useState, useRef, useEffect } from "react";
import DarkVeil from "./DarkVeil";

const Verify = () => {
  const [certificateId, setCertificateId] = useState("");
  const [certificateData, setCertificateData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const canvasRef = useRef(null);
  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

  const handleVerify = async () => {
    setError("");
    setCertificateData(null);
    setLoading(true);

    if (!certificateId.trim()) {
      setError("Please enter a certificate ID.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${BACKEND_URL}/api/verify/${certificateId}`
      );
      const data = await response.json();
      if (response.ok) {
        setCertificateData(data);
        // Generate certificate canvas with background image if available
        setTimeout(() => generateCertificateCanvas(data), 100);
      } else {
        setError(data.message || "Certificate not found.");
      }
    } catch (err) {
      setError("Error verifying the certificate. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const generateCertificateCanvas = (certificate) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext("2d");
    canvas.width = 800;
    canvas.height = 600;

    // Check if there are background images
    if (certificate.backgroundImages && certificate.backgroundImages.length > 0) {
      const latestImage = certificate.backgroundImages[certificate.backgroundImages.length - 1];
      const bgImage = new Image();
      bgImage.src = `data:image/jpeg;base64,${latestImage.image}`;
      bgImage.onload = () => {
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        drawCertificateText(ctx, certificate);
      };
    } else {
      // Default background
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      drawCertificateText(ctx, certificate);
    }
  };

  const drawCertificateText = (ctx, certificate) => {
    ctx.fillStyle = "#000";
    ctx.font = "bold 50px Arial";
    ctx.textAlign = "center";
    ctx.fillText(`Certificate of ${certificate.certificateType}`, 400, 200);
    
    ctx.font = "50px Arial bold italic";
    ctx.fillStyle = "#004aad";
    ctx.fillText(certificate.name, 400, 320);
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#000";
    ctx.fillText("Congratulations on your achievement!", 400, 500);
    
    ctx.font = "16px Arial";
    ctx.fillStyle = "#333";
    ctx.textAlign = "left";
    ctx.fillText(`ID: ${certificate.uniqueId}`, 20, 580);
    
    // Add QR code if available
    if (certificate.qrCodeUrl) {
      const qrImage = new Image();
      qrImage.crossOrigin = "anonymous";
      qrImage.src = certificate.qrCodeUrl;
      qrImage.onload = () => {
        ctx.drawImage(qrImage, 660, 460, 100, 100);
      };
    }
  };

  return (
    <div style={{ width: '100%', minHeight: '100vh', position: 'relative', overflow: 'visible' }}>
      <div style={{ position: 'absolute', inset: 0, zIndex: 0 }}>
        <DarkVeil />
      </div>
      <div style={{ position: 'relative', zIndex: 1 }} className="flex flex-col items-center justify-center min-h-screen py-12 px-4">
        <h1 className="text-4xl sm:text-5xl font-extrabold text-center mb-8 text-white drop-shadow-lg tracking-tight">Verify Certificate</h1>
        <div className="w-full max-w-lg rounded-2xl bg-[rgba(255,255,255,0.10)] backdrop-blur-md border border-[rgba(180,120,255,0.18)] shadow-2xl p-8 flex flex-col gap-4">
          <label className="block text-lg font-semibold mb-2 text-white/90">Enter Certificate ID:</label>
          <input
            type="text"
            className="input input-bordered w-full bg-white/80 text-gray-900 font-semibold rounded-lg focus:ring-2 focus:ring-blue-400"
            value={certificateId}
            onChange={(e) => setCertificateId(e.target.value)}
            placeholder="e.g., 123e4567"
          />
          <button
            className="mt-4 px-7 py-3 rounded-full bg-gradient-to-r from-blue-600 to-violet-600 text-white text-lg font-extrabold font-[Inter] shadow-lg transition-transform hover:scale-105 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-400"
            onClick={handleVerify}
            disabled={loading}
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
          {error && <p className="text-red-400 mt-3 text-center font-semibold">{error}</p>}
          {certificateData && (
            <div className="mt-6 space-y-4">
              <div className="p-6 bg-white/80 rounded-xl shadow-lg border-l-4 border-green-500 animate-fade-in-up">
                <h2 className="text-xl font-bold text-green-700 mb-2">Certificate Verified ✅</h2>
                <div className="text-gray-800 font-semibold space-y-1">
                  <p><strong>Name:</strong> {certificateData.name}</p>
                  <p><strong>Email:</strong> {certificateData.email}</p>
                  <p><strong>Certificate Type:</strong> {certificateData.certificateType ? certificateData.certificateType : "N/A"}</p>
                  <p><strong>Unique ID:</strong> {certificateData.uniqueId}</p>
                  <p><strong>Date Issued:</strong> {certificateData.issuedAt ? new Date(certificateData.issuedAt).toLocaleDateString() : "N/A"}</p>
                  {certificateData.backgroundImages && certificateData.backgroundImages.length > 0 && (
                    <p><strong>Background Images:</strong> {certificateData.backgroundImages.length} image(s) available</p>
                  )}
                </div>
              </div>
              
              {/* Certificate Canvas Preview */}
              <div className="p-4 bg-white/80 rounded-xl shadow-lg">
                <h3 className="text-lg font-bold text-gray-800 mb-2">Certificate Preview</h3>
                <canvas 
                  ref={canvasRef} 
                  className="w-full border rounded-lg shadow-md"
                  style={{ maxWidth: '100%', height: 'auto' }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Verify;
