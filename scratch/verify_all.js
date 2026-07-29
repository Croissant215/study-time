const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

console.log('==== COMPREHENSIVE SYSTEM VERIFICATION START ====');

const htmlContent = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');

const dom = new JSDOM(htmlContent, {
  url: 'http://localhost:8080',
  runScripts: 'dangerously',
  resources: 'usable'
});

const { window } = dom;
const { document } = window;

// Inject Mock localStorage & Crypto
window.localStorage = (function() {
  let store = {};
  return {
    getItem: (key) => store[key] || null,
    setItem: (key, value) => { store[key] = value.toString(); },
    removeItem: (key) => { delete store[key]; },
    clear: () => { store = {}; }
  };
})();

// Inject app.js content manually
const appJsContent = fs.readFileSync(path.join(__dirname, '../app.js'), 'utf8');
window.eval(appJsContent);

console.log('1. Checking Auth Modal & Form Elements...');
const authModal = document.getElementById('auth-modal');
const authForm = document.getElementById('auth-form');
const onboardUserName = document.getElementById('onboard-user-name');

if (!authModal) throw new Error('FAIL: auth-modal not found');
if (!authForm) throw new Error('FAIL: auth-form not found');
if (authForm.getAttribute('onsubmit')) throw new Error('FAIL: auth-form still has inline onsubmit attribute!');
console.log('✅ Form submission duplicate triggers: CLEAN');

console.log('2. Checking Onboarding Nickname Editability...');
window.openOnboardingModal();
if (onboardUserName.readOnly) throw new Error('FAIL: onboard-user-name is still readOnly!');
console.log('✅ Onboarding nickname input is EDITABLE (readOnly = false)');

console.log('3. Testing Profile & Nickname Update...');
window.state.currentUser = { id: 'user-123', email: 'testuser', username: '원래닉네임' };
onboardUserName.value = '새로운닉네임';
window.saveOnboarding();

const updatedUser = JSON.parse(window.localStorage.getItem('study_current_user'));
if (updatedUser.username !== '새로운닉네임') throw new Error('FAIL: localStorage currentUser username was not updated!');
console.log('✅ Nickname update & session saving: VERIFIED (Updated to: ' + updatedUser.username + ')');

console.log('4. Testing Feedback Modal Auto-Save on Close...');
window.openFeedbackModal({ bookTitle: '테스트교재', problemCount: 10, predictedMin: 20, subject: '수학' }, 15);
window.closeFeedbackModal(); // Close via X button without explicit submit

if (window.state.history.length === 0) throw new Error('FAIL: Study history was not saved on feedback modal close!');
console.log('✅ Feedback modal auto-save on X close: VERIFIED (Saved log count: ' + window.state.history.length + ')');

console.log('==== ALL SYSTEM VERIFICATIONS PASSED SUCCESSFULLY ====');
