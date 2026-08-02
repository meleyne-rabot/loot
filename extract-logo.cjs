const fs = require("fs");
const content = fs.readFileSync("C:/Users/user/Downloads/loot.jsx", "utf8");
const m = content.match(/const LOGO = "data:image\/png;base64,([^"]+)"/);
if (!m) {
  console.error("LOGO not found");
  process.exit(1);
}
fs.writeFileSync("C:/Users/user/Loot/public/icons/logo.png", Buffer.from(m[1], "base64"));
console.log("done", m[1].length);
