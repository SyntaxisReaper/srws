/**
 * HydroNode - QR Code Generator for Device Enclosure Onboarding
 * Generates ready-to-print QR codes for physical HydroNode ESP32 units.
 * Produces individual high-res PNGs and an HTML printable sticker sheet.
 */

const fs = require("fs");
const path = require("path");

const OUTPUT_DIR = path.join(__dirname, "..", "qr_codes");
const DEVICE_IDS = [
  "device_001",
  "device_002",
  "device_003",
  "hydronode_001",
];

async function generateQRCodes() {
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  console.log("=================================================");
  console.log("   HydroNode — Device QR Code Generator          ");
  console.log(`   Output Folder: ${OUTPUT_DIR}`);
  console.log("=================================================\n");

  const generatedList = [];

  for (const id of DEVICE_IDS) {
    // Plain deviceId payload for clean, instant camera scanning
    const payload = id;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=350x350&data=${encodeURIComponent(payload)}&format=png&margin=10`;
    const filePath = path.join(OUTPUT_DIR, `${id}.png`);

    try {
      console.log(`Generating QR for [${id}]...`);
      const res = await fetch(qrUrl);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const buffer = await res.arrayBuffer();
      fs.writeFileSync(filePath, Buffer.from(buffer));
      console.log(`✓ Saved: ${filePath}`);
      generatedList.push({ id, file: `${id}.png` });
    } catch (err) {
      console.error(`✗ Error generating QR for ${id}:`, err.message);
    }
  }

  // Generate an HTML sticker sheet ready to print on A4/Letter adhesive label paper
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>HydroNode — Device Enclosure QR Stickers</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 30px;
      color: #0f172a;
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .header h1 {
      font-size: 26px;
      margin: 0;
    }
    .header p {
      color: #64748b;
      margin-top: 6px;
    }
    .sticker-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
      gap: 20px;
      max-width: 900px;
      margin: 0 auto;
    }
    .sticker-card {
      background: #ffffff;
      border: 2px dashed #000000;
      border-radius: 16px;
      padding: 20px;
      text-align: center;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
      page-break-inside: avoid;
    }
    .brand-pill {
      display: inline-block;
      background: #000000;
      color: #ffffff;
      font-size: 11px;
      font-weight: 800;
      letter-spacing: 1px;
      padding: 4px 12px;
      border-radius: 20px;
      margin-bottom: 12px;
    }
    .qr-img {
      width: 180px;
      height: 180px;
      margin: 0 auto 10px;
      display: block;
    }
    .device-title {
      font-size: 18px;
      font-weight: 900;
      letter-spacing: 0.5px;
      margin: 6px 0 2px;
    }
    .device-sub {
      font-size: 11px;
      color: #64748b;
      font-weight: 600;
    }
    .instructions {
      font-size: 10px;
      color: #94a3b8;
      margin-top: 8px;
      border-top: 1px solid #f1f5f9;
      padding-top: 8px;
    }
    @media print {
      body { background: #ffffff; padding: 0; }
      .no-print { display: none; }
      .sticker-card { box-shadow: none; }
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>💧 HydroNode Device Stickers</h1>
    <p>Print on adhesive label paper and stick onto the ESP32 enclosure</p>
    <button class="no-print" onclick="window.print()" style="background:#000;color:#fff;border:none;padding:10px 20px;border-radius:8px;font-weight:bold;cursor:pointer;margin-top:10px;">🖨️ Print Labels</button>
  </div>

  <div class="sticker-grid">
    ${generatedList
      .map(
        (item) => `
    <div class="sticker-card">
      <div class="brand-pill">💧 HYDRONODE</div>
      <img class="qr-img" src="${item.file}" alt="${item.id}" />
      <div class="device-title">${item.id}</div>
      <div class="device-sub">Smart Water Controller</div>
      <div class="instructions">Scan with HydroNode mobile app to link</div>
    </div>`
      )
      .join("\n")}
  </div>
</body>
</html>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, "index.html"), htmlContent);
  console.log(`\n✓ Generated Printable Sheet: ${path.join(OUTPUT_DIR, "index.html")}`);
  console.log("Done! You can open index.html in any browser to print stickers.");
}

generateQRCodes();
