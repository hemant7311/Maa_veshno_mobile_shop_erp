const fs = require('fs');
const path = require('path');

const src = "C:\\Users\\Dell\\.gemini\\antigravity\\brain\\6d77e0b0-1c34-4ec8-a2ae-0d5633e46f47\\mobile_landing_1785406337298.jpg";
const dest = "c:\\Users\\Dell\\OneDrive\\Desktop\\Maa veshno\\public\\mobile_landing.png";

try {
  fs.copyFileSync(src, dest);
  console.log("SUCCESS: Image copied to " + dest);
} catch (err) {
  console.error("ERROR: " + err.message);
}
