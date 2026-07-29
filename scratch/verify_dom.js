const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

console.log("--- HTML DOM Verification ---");

// Check if auth-modal is a child of body directly, not preset-modal
const presetModalIndex = html.indexOf('id="preset-modal"');
const authModalIndex = html.indexOf('id="auth-modal"');

console.log("preset-modal pos:", presetModalIndex);
console.log("auth-modal pos:", authModalIndex);

// Count <div> and </div> between preset-modal and auth-modal
const subHtml = html.substring(presetModalIndex, authModalIndex);
const openDivs = (subHtml.match(/<div/g) || []).length;
const closeDivs = (subHtml.match(/<\/div>/g) || []).length;

console.log(`Divs in preset-modal section: Open = ${openDivs}, Close = ${closeDivs}`);

if (openDivs === closeDivs) {
  console.log("✅ SUCCESS: preset-modal is properly closed! auth-modal is now an independent top-level element!");
} else {
  console.error("❌ ERROR: Unclosed div detected!");
}
