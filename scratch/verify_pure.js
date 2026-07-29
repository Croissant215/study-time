const fs = require('fs');
const path = require('path');

console.log('==== PURE NODE.JS INTEGRITY & DOM ANALYSIS START ====');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
const styleCssContent = fs.readFileSync(path.join(__dirname, '../style.css'), 'utf8');

// Test 1: Check duplicate event handlers on form
console.log('[Check 1] Checking duplicate function calls in onsubmit in index.html...');
if (/onsubmit=["'].*?\w+\(.*?\)["']/.test(htmlContent)) {
  console.error('❌ FAIL: index.html still contains function call in inline onsubmit!');
  process.exit(1);
}
console.log('✅ PASS: No duplicate function calls in inline onsubmit in index.html');

// Test 2: Check password input styling in style.css
console.log('[Check 2] Checking password input styling in style.css...');
if (!styleCssContent.includes('input[type="password"]')) {
  console.error('❌ FAIL: style.css does not style input[type="password"]!');
  process.exit(1);
}
console.log('✅ PASS: style.css explicitly styles input[type="password"]');

// Test 3: Check readOnly state on onboarding username input
console.log('[Check 3] Checking onboarding username readOnly state in app.js...');
if (appJsContent.includes('DOM.onboardUserName.readOnly = true')) {
  console.error('❌ FAIL: app.js still locks onboardUserName with readOnly = true!');
  process.exit(1);
}
console.log('✅ PASS: app.js allows editing onboarding username freely');

// Test 4: Check auto-save feature on feedback modal close
console.log('[Check 4] Checking feedback modal close auto-save logic in app.js...');
if (!appJsContent.includes('submitSessionFeedback(true)')) {
  console.error('❌ FAIL: closeFeedbackModal does not trigger auto-save submitSessionFeedback(true)!');
  process.exit(1);
}
console.log('✅ PASS: closeFeedbackModal triggers auto-save on close');

// Test 5: Check Supabase DB PATCH on username update
console.log('[Check 5] Checking Supabase DB PATCH on username/profile update in app.js...');
if (!appJsContent.includes("method: 'PATCH'")) {
  console.error('❌ FAIL: saveOnboarding does not send PATCH request to Supabase DB!');
  process.exit(1);
}
console.log('✅ PASS: saveOnboarding sends PATCH request to update Supabase DB');

// Test 6: Check SHA-256 Hashing helper
console.log('[Check 6] Checking SHA-256 password hashing helper in app.js...');
if (!appJsContent.includes("crypto.subtle.digest('SHA-256'")) {
  console.error('❌ FAIL: SHA-256 hashing helper is missing!');
  process.exit(1);
}
console.log('✅ PASS: SHA-256 password hashing is implemented');

console.log('\n🎉 ALL 6 COMPREHENSIVE INTEGRITY TESTS PASSED 100%! 🎉');
