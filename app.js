/**
 * Study Time Estimator - Pure JavaScript Engine
 * Features:
 * 1. User-customizable Study & Rest Pomodoro Intervals
 * 2. Optional Error Review Time Calculation (Disabled by Default)
 */

// Global State
const state = {
  profile: JSON.parse(localStorage.getItem('study_user_profile')) || null,
  presets: JSON.parse(localStorage.getItem('study_presets')) || [
    { id: 'preset-1', title: '개념원리 수학 I', subject: '수학', difficulty_weight: 1.0, correction_factor: 1.0 },
    { id: 'preset-2', title: '쎈 수학 I', subject: '수학', difficulty_weight: 1.5, correction_factor: 1.0 },
    { id: 'preset-3', title: '마플시너지 수학 I', subject: '수학', difficulty_weight: 1.9, correction_factor: 1.0 },
    { id: 'preset-4', title: '블랙라벨 수학 I', subject: '수학', difficulty_weight: 2.7, correction_factor: 1.0 },
    { id: 'preset-5', title: 'EBS 수능특강 영어', subject: '영어', difficulty_weight: 1.5, correction_factor: 1.0 }
  ],
  subjectAlphas: JSON.parse(localStorage.getItem('study_subject_alphas')) || {
    '수학': 1.0,
    '영어': 1.0,
    '국어': 1.0,
    '탐구': 1.0,
    '일반': 1.0
  },
  history: JSON.parse(localStorage.getItem('study_history')) || [],
  supabaseConfig: JSON.parse(localStorage.getItem('study_supabase_config')) || {
    url: 'https://ioyjbdhkzyatgurqvsmz.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveWpiZGhrenlhdGd1cnF2c216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjc4OTMsImV4cCI6MjEwMDgwMzg5M30.noBv8DJtCmoL5JpBniS2HkvPd-rpW1Vqgnt69JKwJUo'
  },
  supabaseClient: null,
  authUser: null,
  authMode: 'login', // 'login' or 'signup'
  timer: {
    worker: null,
    startTime: null,
    pauseStartTime: null,
    totalPausedMs: 0,
    seconds: 0,
    isPaused: false,
    sessionData: null,
    notificationSent: false
  },
  debounceTimer: null
};

// Subject Colors Palette
const SUBJECT_COLORS = {
  '수학': '#D96B43',
  '영어': '#D97706',
  '국어': '#577557',
  '탐구': '#2563EB',
  '일반': '#8B5CF6'
};

// Built-in Smart AI Database (5-Tier System)
const SMART_AI_DATABASE = [
  { keywords: ['블랙라벨', '킬러', '30번', '22번', '경시', '하이라벨', '시대인재', '킬패스', '의대', '모의고사 30번'], weight: 2.7, tier: '최고난도/킬러', reason: '최상위권 변별을 위한 극상 난도 킬러 문항 중심 교재로 분석되었습니다.' },
  { keywords: ['고쟁이', '1등급', '일등급', '최상위', '일품', '짱어려운', '어삼쉬삼', '마플4점', '드릴', 'N제'], weight: 2.2, tier: '심화/준킬러', reason: '상위권 도약을 위한 고난도 준킬러 및 응용 심화 문제집으로 분석되었습니다.' },
  { keywords: ['마플시너지', '마플', '자이스토리', '마더텅', '쎈C', '마플교과서'], weight: 1.9, tier: '유형/준심화', reason: '쎈보다 문항 수가 압도적으로 많고 준심화 기출 변형이 많은 상위 유형서로 분석되었습니다.' },
  { keywords: ['쎈', '유형', '수특', '수능특강', '수능완성', '실전', '짱중요한', '개념쎈', '매3비', '매3문', '워드마스터', '현우진', '한석원', '정승제', '오지훈', '백호'], weight: 1.5, tier: '유형/실전', reason: '표준 수능/내신 필수 유형 정리용 문제집으로 분석되었습니다.' },
  { keywords: ['개념원리', '개념', '기초', '수력충전', '입문', '기본', '라이트쎈', '라이트', '짱쉬운', '수학의샘', '워밍업', '노베이스'], weight: 1.0, tier: '개념/기초', reason: '기초 개념 이해 및 기본 문제 풀이용 교재로 분석되었습니다.' }
];

// DOM Elements
const DOM = {
  tabs: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  btnExportData: document.getElementById('btn-export-data'),
  importFileInput: document.getElementById('import-file-input'),
  onboardingModal: document.getElementById('onboarding-modal'),
  onboardUserName: document.getElementById('onboard-user-name'),
  btnSaveOnboarding: document.getElementById('btn-save-onboarding'),
  btnReOnboard: document.getElementById('btn-re-onboard'),
  barUserName: document.getElementById('bar-user-name'),
  barSkillLevel: document.getElementById('bar-skill-level'),
  bookTitleInput: document.getElementById('book-title'),
  btnSelectPreset: document.getElementById('btn-select-preset'),
  presetDropdown: document.getElementById('preset-dropdown'),
  autoAnalysisTag: document.getElementById('auto-analysis-tag'),
  problemCountInput: document.getElementById('problem-count'),
  difficultySlider: document.getElementById('difficulty-weight'),
  difficultyBadge: document.getElementById('difficulty-badge'),
  enableReviewTime: document.getElementById('enable-review-time'),
  reviewTimeInputsContainer: document.getElementById('review-time-inputs-container'),
  errorRateSlider: document.getElementById('error-rate'),
  errorRateVal: document.getElementById('error-rate-val'),
  wrongReviewTimeInput: document.getElementById('wrong-review-time'),
  enablePomodoro: document.getElementById('enable-pomodoro'),
  pomodoroInputsContainer: document.getElementById('pomodoro-inputs-container'),
  pomodoroStudyIntervalInput: document.getElementById('pomodoro-study-interval'),
  pomodoroRestIntervalInput: document.getElementById('pomodoro-rest-interval'),
  skillMultVal: document.getElementById('skill-mult-val'),
  alphaValDisplay: document.getElementById('alpha-val'),
  predictedTotalTime: document.getElementById('predicted-total-time'),
  targetFinishClock: document.getElementById('target-finish-clock'),
  predictedSolveTime: document.getElementById('predicted-solve-time'),
  predictedReviewTime: document.getElementById('predicted-review-time'),
  predictedRestTime: document.getElementById('predicted-rest-time'),
  breakdownReviewItem: document.getElementById('breakdown-review-item'),
  breakdownRestItem: document.getElementById('breakdown-rest-item'),
  btnStartTimer: document.getElementById('btn-start-timer'),
  btnManualFinish: document.getElementById('btn-manual-finish'),
  estimationPanel: document.getElementById('estimation-result-panel'),
  activeTimerPanel: document.getElementById('active-timer-panel'),
  activeBookDisplay: document.getElementById('active-book-display'),
  timerDisplay: document.getElementById('timer-display'),
  timerTargetTime: document.getElementById('timer-target-time'),
  btnPauseTimer: document.getElementById('btn-pause-timer'),
  btnStopTimer: document.getElementById('btn-stop-timer'),
  feedbackModal: document.getElementById('feedback-modal'),
  presetModal: document.getElementById('preset-modal'),
  modalSessionInfo: document.getElementById('modal-session-info'),
  actualTimeInput: document.getElementById('actual-time-input'),
  actualWrongInput: document.getElementById('actual-wrong-input'),
  btnSubmitFeedback: document.getElementById('btn-submit-feedback'),
  btnOpenAddPreset: document.getElementById('btn-open-add-preset'),
  btnSavePreset: document.getElementById('btn-save-preset'),
  presetListGrid: document.getElementById('preset-list-grid'),
  historyTableBody: document.getElementById('history-table-body'),
  statTotalCount: document.getElementById('stat-total-count'),
  statAccuracy: document.getElementById('stat-accuracy'),
  statTotalHours: document.getElementById('stat-total-hours'),
  subjectProgressBar: document.getElementById('subject-progress-bar'),
  subjectLegend: document.getElementById('subject-legend'),
  
  // PWA & Supabase Auth DOM
  btnPwaNoti: document.getElementById('btn-pwa-noti'),
  notiBtnText: document.getElementById('noti-btn-text'),
  btnOpenAuth: document.getElementById('btn-open-auth'),
  userAuthBadge: document.getElementById('user-auth-badge'),
  userEmailDisplay: document.getElementById('user-email-display'),
  btnLogout: document.getElementById('btn-logout'),
  authModal: document.getElementById('auth-modal'),
  tabAuthLogin: document.getElementById('tab-auth-login'),
  tabAuthSignup: document.getElementById('tab-auth-signup'),
  authForm: document.getElementById('auth-form'),
  authEmail: document.getElementById('auth-email'),
  authPassword: document.getElementById('auth-password'),
  btnSubmitAuth: document.getElementById('btn-submit-auth'),
  btnGoogleOauth: document.getElementById('btn-google-oauth')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initPWAAndNotifications();
  checkAuthSession();
  checkOnboarding();
  renderPresetList();
  renderHistory();
  recalculatePrediction();
});

function initSupabaseClient() {
  if (!state.supabaseConfig.url || !state.supabaseConfig.anonKey) {
    state.supabaseConfig.url = 'https://ioyjbdhkzyatgurqvsmz.supabase.co';
    state.supabaseConfig.anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveWpiZGhrenlhdGd1cnF2c216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjc4OTMsImV4cCI6MjEwMDgwMzg5M30.noBv8DJtCmoL5JpBniS2HkvPd-rpW1Vqgnt69JKwJUo';
    localStorage.setItem('study_supabase_config', JSON.stringify(state.supabaseConfig));
  }

  if (state.supabaseConfig.url && state.supabaseConfig.anonKey && window.supabase) {
    try {
      state.supabaseClient = window.supabase.createClient(state.supabaseConfig.url, state.supabaseConfig.anonKey);
    } catch (e) {}
  }
}

function openOnboardingModal() {
  if (DOM.onboardUserName) {
    DOM.onboardUserName.value = (state.currentUser && state.currentUser.username) || (state.profile ? state.profile.name : '열공이');
    DOM.onboardUserName.readOnly = false;
    DOM.onboardUserName.style.background = '';
  }

  // Pre-select existing skill level
  const currentSkillMult = (state.currentUser && state.currentUser.skillMult) || (state.profile && state.profile.skillMult) || 1.0;
  const radioToSelect = document.querySelector(`input[name="onboard-skill"][value="${currentSkillMult}"]`);
  if (radioToSelect) radioToSelect.checked = true;

  DOM.onboardingModal?.classList.remove('hidden');
}

function checkOnboarding() {
  if (!state.profile && !state.currentUser) {
    openOnboardingModal();
  } else {
    updateProfileBar();
  }
}

async function saveOnboarding() {
  const newName = DOM.onboardUserName ? DOM.onboardUserName.value.trim() || '열공이' : '열공이';
  const selectedSkillRadio = document.querySelector('input[name="onboard-skill"]:checked');
  const skillMult = selectedSkillRadio ? parseFloat(selectedSkillRadio.value) : 1.0;

  let skillLabel = '보통 (1.0x)';
  if (skillMult === 1.35) skillLabel = '노베이스/기초부족 (1.35x)';
  if (skillMult === 0.75) skillLabel = '상위권/풀이빠름 (0.75x)';

  state.profile = { name: newName, skillMult, skillLabel };
  localStorage.setItem('study_user_profile', JSON.stringify(state.profile));

  if (state.currentUser) {
    state.currentUser.username = newName;
    state.currentUser.skillMult = skillMult;
    state.currentUser.skillLabel = skillLabel;
    localStorage.setItem('study_current_user', JSON.stringify(state.currentUser));

    let users = JSON.parse(localStorage.getItem('study_users')) || [];
    users = users.map(u => u.id === state.currentUser.id ? { ...u, username: newName, skillMult, skillLabel } : u);
    localStorage.setItem('study_users', JSON.stringify(users));

    // Update Supabase DB asynchronously
    const SUPABASE_URL = state.supabaseConfig.url || 'https://ioyjbdhkzyatgurqvsmz.supabase.co';
    const SUPABASE_KEY = state.supabaseConfig.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveWpiZGhrenlhdGd1cnF2c216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjc4OTMsImV4cCI6MjEwMDgwMzg5M30.noBv8DJtCmoL5JpBniS2HkvPd-rpW1Vqgnt69JKwJUo';
    try {
      fetch(`${SUPABASE_URL}/rest/v1/study_users?id=eq.${encodeURIComponent(state.currentUser.id)}`, {
        method: 'PATCH',
        headers: {
          'apikey': SUPABASE_KEY,
          'Authorization': `Bearer ${SUPABASE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username: newName, skill_mult: skillMult })
      });
    } catch (e) {}

    updateAuthUI(state.currentUser);
  }

  DOM.onboardingModal?.classList.add('hidden');
  updateProfileBar();
  recalculatePrediction();
}

function updateProfileBar() {
  const name = state.currentUser ? (state.currentUser.username || state.currentUser.email) : (state.profile ? state.profile.name : '열공이');
  const skillLabel = (state.currentUser && state.currentUser.skillLabel) || (state.profile ? state.profile.skillLabel : '보통 (1.0x)');
  const skillMult = (state.currentUser && state.currentUser.skillMult) || (state.profile ? state.profile.skillMult : 1.0);

  if (DOM.barUserName) DOM.barUserName.textContent = name;
  if (DOM.barSkillLevel) DOM.barSkillLevel.textContent = `실력 레벨: ${skillLabel}`;
  if (DOM.skillMultVal) DOM.skillMultVal.textContent = `${skillMult}x`;
}

function setupEventListeners() {
  DOM.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.tabs.forEach(t => t.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.add('active');
    });
  });

  DOM.btnSaveOnboarding?.addEventListener('click', saveOnboarding);
  DOM.btnReOnboard?.addEventListener('click', openOnboardingModal);

  DOM.btnExportData?.addEventListener('click', exportData);
  DOM.importFileInput?.addEventListener('change', importData);

  DOM.bookTitleInput?.addEventListener('input', (e) => {
    const title = e.target.value.trim();
    clearTimeout(state.debounceTimer);
    
    if (!title) {
      if (DOM.autoAnalysisTag) DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> 교재명을 입력하면 웹 스마트 AI가 자동으로 즉시 파싱합니다.`;
      recalculatePrediction();
      return;
    }

    state.debounceTimer = setTimeout(() => {
      runBuiltInSmartAIClassifier(title);
      fetchGlobalDifficultyFromSupabase(title);
    }, 200);
  });

  DOM.btnSelectPreset?.addEventListener('click', togglePresetDropdown);
  DOM.problemCountInput?.addEventListener('input', recalculatePrediction);
  DOM.difficultySlider?.addEventListener('input', (e) => {
    updateDifficultyBadge(parseFloat(e.target.value));
    recalculatePrediction();
  });

  // Toggle Error Review Time Input Section
  DOM.enableReviewTime?.addEventListener('change', (e) => {
    if (e.target.checked) {
      DOM.reviewTimeInputsContainer?.classList.remove('hidden');
      DOM.breakdownReviewItem?.classList.remove('hidden');
    } else {
      DOM.reviewTimeInputsContainer?.classList.add('hidden');
      DOM.breakdownReviewItem?.classList.add('hidden');
    }
    recalculatePrediction();
  });

  DOM.errorRateSlider?.addEventListener('input', (e) => {
    if (DOM.errorRateVal) DOM.errorRateVal.textContent = `${e.target.value}%`;
    recalculatePrediction();
  });
  DOM.wrongReviewTimeInput?.addEventListener('input', recalculatePrediction);

  // Toggle Custom Pomodoro Interval Input Section
  DOM.enablePomodoro?.addEventListener('change', (e) => {
    if (e.target.checked) {
      DOM.pomodoroInputsContainer?.classList.remove('hidden');
      DOM.breakdownRestItem?.classList.remove('hidden');
    } else {
      DOM.pomodoroInputsContainer?.classList.add('hidden');
      DOM.breakdownRestItem?.classList.add('hidden');
    }
    recalculatePrediction();
  });

  DOM.pomodoroStudyIntervalInput?.addEventListener('input', recalculatePrediction);
  DOM.pomodoroRestIntervalInput?.addEventListener('input', recalculatePrediction);

  DOM.btnStartTimer?.addEventListener('click', startTimerSession);
  DOM.btnManualFinish?.addEventListener('click', openManualFinishModal);
  DOM.btnPauseTimer?.addEventListener('click', togglePauseTimer);
  DOM.btnStopTimer?.addEventListener('click', stopTimerSession);

  DOM.btnSubmitFeedback?.addEventListener('click', submitSessionFeedback);
  DOM.btnOpenAddPreset?.addEventListener('click', () => DOM.presetModal?.classList.remove('hidden'));
  DOM.btnSavePreset?.addEventListener('click', saveNewPreset);

  // PWA Notification & Auth Event Listeners
  DOM.btnPwaNoti?.addEventListener('click', requestNotificationPermission);
  DOM.btnOpenAuth?.addEventListener('click', openAuthModal);
  DOM.btnLogout?.addEventListener('click', handleLogout);
  DOM.tabAuthLogin?.addEventListener('click', () => switchAuthTab('login'));
  DOM.tabAuthSignup?.addEventListener('click', () => switchAuthTab('signup'));
  DOM.authForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    handleAuthSubmit();
  });
}

// Supabase Global Crowdsourced Fetching
async function fetchGlobalDifficultyFromSupabase(bookTitle) {
  if (!state.supabaseClient) return;

  try {
    const { data, error } = await state.supabaseClient
      .from('study_logs')
      .select('actual_min, problem_count')
      .ilike('book_title', `%${bookTitle}%`)
      .limit(50);

    if (error || !data || data.length === 0) return;

    const avgMinsPerProblem = data.reduce((acc, row) => acc + (row.actual_min / Math.max(1, row.problem_count)), 0) / data.length;
    const globalWeight = Math.max(0.8, Math.min(3.0, avgMinsPerProblem / 2.5));

    if (DOM.autoAnalysisTag) {
      DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-globe" style="color:var(--primary)"></i> <strong>Supabase 집단지성 ${data.length}건 데이터 반영:</strong> [${bookTitle}] 글로벌 난이도 가중치 (${globalWeight.toFixed(1)}x)`;
    }
    setSliderAndBadge(globalWeight);
    recalculatePrediction();
  } catch (err) {}
}

function exportData() {
  const backupObj = {
    version: '2.0',
    timestamp: new Date().toISOString(),
    profile: state.profile,
    presets: state.presets,
    subjectAlphas: state.subjectAlphas,
    history: state.history
  };

  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(backupObj, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute("href", dataStr);
  downloadAnchor.setAttribute("download", `study_predict_backup_${new Date().toISOString().split('T')[0]}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}

function importData(event) {
  const fileReader = new FileReader();
  fileReader.onload = (e) => {
    try {
      const importedData = JSON.parse(e.target.result);
      if (importedData.profile) state.profile = importedData.profile;
      if (importedData.presets) state.presets = importedData.presets;
      if (importedData.subjectAlphas) state.subjectAlphas = importedData.subjectAlphas;
      if (importedData.history) state.history = importedData.history;

      localStorage.setItem('study_user_profile', JSON.stringify(state.profile));
      localStorage.setItem('study_presets', JSON.stringify(state.presets));
      localStorage.setItem('study_subject_alphas', JSON.stringify(state.subjectAlphas));
      localStorage.setItem('study_history', JSON.stringify(state.history));

      initSupabaseClient();
      updateProfileBar();
      renderPresetList();
      renderHistory();
      recalculatePrediction();
      alert('🎉 데이터가 성공적으로 복원되었습니다!');
    } catch (err) {
      alert('❌ 올바르지 않은 백업 파일 형식이거나 파일이 훼손되었습니다.');
    }
  };
  if (event.target.files && event.target.files[0]) {
    fileReader.readAsText(event.target.files[0]);
  }
}

function runBuiltInSmartAIClassifier(bookTitle) {
  const lowerTitle = bookTitle.toLowerCase();

  const existingPreset = state.presets.find(p => p.title.toLowerCase() === lowerTitle);
  if (existingPreset) {
    if (DOM.autoAnalysisTag) DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--secondary)"></i> 저장된 교재 프리셋 [${existingPreset.title}] 적용`;
    setSliderAndBadge(existingPreset.difficulty_weight);
    recalculatePrediction();
    return;
  }

  for (const category of SMART_AI_DATABASE) {
    for (const kw of category.keywords) {
      if (lowerTitle.includes(kw.toLowerCase())) {
        if (DOM.autoAnalysisTag) DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-brain" style="color:var(--primary)"></i> <strong>웹 내장 AI 분석:</strong> ${category.reason} (${category.weight}x)`;
        setSliderAndBadge(category.weight);
        recalculatePrediction();
        return;
      }
    }
  }

  if (DOM.autoAnalysisTag) DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <strong>웹 내장 AI 추론:</strong> 일반 학습 교재 패턴으로 분석되었습니다. (1.3x)`;
  setSliderAndBadge(1.3);
  recalculatePrediction();
}

function setSliderAndBadge(weight) {
  if (DOM.difficultySlider) DOM.difficultySlider.value = weight;
  updateDifficultyBadge(weight);
}

function updateDifficultyBadge(weight) {
  if (DOM.difficultyBadge) DOM.difficultyBadge.textContent = `${getTierLabel(weight)} (${weight.toFixed(1)}x)`;
}

function getTierLabel(weight) {
  if (weight <= 1.2) return '개념/기초';
  if (weight <= 1.6) return '유형/표준';
  if (weight <= 2.0) return '유형/준심화(마플)';
  if (weight <= 2.4) return '심화/준킬러';
  return '최고난도/킬러';
}

function getSubjectFromTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('수학') || t.includes('쎈') || t.includes('마플') || t.includes('블랙라벨') || t.includes('개념원리')) return '수학';
  if (t.includes('영어') || t.includes('수특') || t.includes('어휘') || t.includes('보카')) return '영어';
  if (t.includes('국어') || t.includes('매3비') || t.includes('매3문') || t.includes('문학')) return '국어';
  if (t.includes('탐구') || t.includes('사탐') || t.includes('과탐') || t.includes('지구') || t.includes('생명')) return '탐구';
  return '일반';
}

function adjustCount(delta) {
  if (!DOM.problemCountInput) return;
  const current = parseInt(DOM.problemCountInput.value) || 0;
  const next = Math.max(1, Math.min(300, current + delta));
  DOM.problemCountInput.value = next;
  recalculatePrediction();
}

// User-customizable Prediction Calculation
function calculatePrediction() {
  const problemCount = parseInt(DOM.problemCountInput?.value) || 1;
  const difficultyWeight = parseFloat(DOM.difficultySlider?.value) || 1.5;
  const isReviewTimeEnabled = DOM.enableReviewTime ? DOM.enableReviewTime.checked : false;
  const isPomodoroEnabled = DOM.enablePomodoro ? DOM.enablePomodoro.checked : false;

  const bookTitle = DOM.bookTitleInput ? DOM.bookTitleInput.value.trim() || '일반' : '일반';
  const subject = getSubjectFromTitle(bookTitle);
  
  const skillMult = state.profile ? state.profile.skillMult : 1.0;
  const alpha = state.subjectAlphas[subject] || 1.0;

  // 1. Pure Solving Time Calculation
  const solveTimeRaw = problemCount * 2.5 * difficultyWeight * skillMult;
  
  // 2. Optional Error Review Calculation
  let reviewTimeRaw = 0;
  let estimatedWrongCount = 0;
  if (isReviewTimeEnabled) {
    const errorRatePercent = parseFloat(DOM.errorRateSlider?.value) || 20;
    const wrongReviewTimeMin = parseInt(DOM.wrongReviewTimeInput?.value) || 5;
    estimatedWrongCount = problemCount * (errorRatePercent / 100);
    reviewTimeRaw = estimatedWrongCount * wrongReviewTimeMin;
  }

  const pureStudyMin = Math.round((solveTimeRaw + reviewTimeRaw) * alpha);
  
  // 3. User-customizable Pomodoro Rest Calculation
  let restMin = 0;
  if (isPomodoroEnabled && pureStudyMin > 0) {
    const studyInterval = Math.max(10, parseInt(DOM.pomodoroStudyIntervalInput?.value) || 50);
    const restInterval = Math.max(1, parseInt(DOM.pomodoroRestIntervalInput?.value) || 10);

    if (pureStudyMin >= studyInterval) {
      restMin = Math.floor(pureStudyMin / studyInterval) * restInterval;
    }
  }

  const totalPredictedMin = pureStudyMin + restMin;
  const solveMin = Math.round(solveTimeRaw * alpha);
  const reviewMin = Math.round(reviewTimeRaw * alpha);

  return {
    problemCount,
    subject,
    difficultyWeight,
    totalPredictedMin: Math.max(1, totalPredictedMin),
    solveMin,
    reviewMin,
    restMin,
    alpha,
    estimatedWrongCount: Math.round(estimatedWrongCount)
  };
}

function recalculatePrediction() {
  const pred = calculatePrediction();

  const hours = Math.floor(pred.totalPredictedMin / 60);
  const mins = pred.totalPredictedMin % 60;
  const timeFormatted = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;

  if (DOM.predictedTotalTime) DOM.predictedTotalTime.textContent = timeFormatted;
  if (DOM.predictedSolveTime) DOM.predictedSolveTime.textContent = `${pred.solveMin}분`;
  if (DOM.predictedReviewTime) DOM.predictedReviewTime.textContent = `${pred.reviewMin}분`;
  if (DOM.predictedRestTime) DOM.predictedRestTime.textContent = `${pred.restMin}분`;
  if (DOM.alphaValDisplay) DOM.alphaValDisplay.textContent = pred.alpha.toFixed(2);
  
  if (state.profile && DOM.skillMultVal) {
    DOM.skillMultVal.textContent = `${state.profile.skillMult}x`;
  }

  calculateTargetClock(pred.totalPredictedMin);
}

function calculateTargetClock(totalPredictedMin) {
  if (!DOM.targetFinishClock) return;
  const now = new Date();
  const finishTime = new Date(now.getTime() + totalPredictedMin * 60 * 1000);

  let hrs = finishTime.getHours();
  const mins = String(finishTime.getMinutes()).padStart(2, '0');
  const period = hrs >= 12 ? '오후' : '오전';

  hrs = hrs % 12;
  if (hrs === 0) hrs = 12;

  DOM.targetFinishClock.innerHTML = `<i class="fa-solid fa-clock"></i> <strong>${period} ${hrs}:${mins}</strong> 에 공부가 완료될 예정입니다!`;
}

function togglePresetDropdown() {
  if (!DOM.presetDropdown) return;
  if (DOM.presetDropdown.classList.contains('hidden')) {
    renderPresetDropdown();
    DOM.presetDropdown.classList.remove('hidden');
  } else {
    DOM.presetDropdown.classList.add('hidden');
  }
}

function renderPresetDropdown() {
  if (!DOM.presetDropdown) return;
  if (state.presets.length === 0) {
    DOM.presetDropdown.innerHTML = `<div style="padding:10px; color:var(--text-muted)">등록된 프리셋이 없습니다.</div>`;
    return;
  }

  DOM.presetDropdown.innerHTML = state.presets.map(p => `
    <div class="dropdown-item" onclick="selectPreset('${p.id}')">
      <strong>${p.title}</strong> (${p.subject} / ${getTierLabel(p.difficulty_weight)})
    </div>
  `).join('');
}

function selectPreset(presetId) {
  const preset = state.presets.find(p => p.id === presetId);
  if (!preset) return;

  if (DOM.bookTitleInput) DOM.bookTitleInput.value = preset.title;
  setSliderAndBadge(preset.difficulty_weight);
  if (DOM.autoAnalysisTag) DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--secondary)"></i> 프리셋 [${preset.title}] 선택됨`;
  if (DOM.presetDropdown) DOM.presetDropdown.classList.add('hidden');
  recalculatePrediction();
}

function startTimerSession() {
  const bookTitle = DOM.bookTitleInput ? DOM.bookTitleInput.value.trim() || '미지정 교재' : '미지정 교재';
  const pred = calculatePrediction();

  state.timer.sessionData = {
    bookTitle,
    subject: pred.subject,
    problemCount: pred.problemCount,
    predictedMin: pred.totalPredictedMin
  };

  state.timer.startTime = Date.now();
  state.timer.pauseStartTime = null;
  state.timer.totalPausedMs = 0;
  state.timer.seconds = 0;
  state.timer.isPaused = false;
  state.timer.notificationSent = false;

  if (DOM.btnPauseTimer) DOM.btnPauseTimer.innerHTML = `<i class="fa-solid fa-pause"></i> 일시정지`;
  if (DOM.activeBookDisplay) DOM.activeBookDisplay.textContent = `${bookTitle} (${pred.problemCount}문제)`;
  if (DOM.timerTargetTime) DOM.timerTargetTime.textContent = `${pred.totalPredictedMin}분`;

  DOM.estimationPanel?.classList.add('hidden');
  DOM.activeTimerPanel?.classList.remove('hidden');

  updateTimerDisplay();

  // Initialize Web Worker for Background Tick
  if (window.Worker) {
    if (state.timer.worker) state.timer.worker.terminate();
    try {
      state.timer.worker = new Worker('timer-worker.js');
      state.timer.worker.onmessage = (e) => {
        if (e.data.type === 'TICK' && !state.timer.isPaused) {
          calculateElapsedSeconds();
        }
      };
      state.timer.worker.postMessage({ command: 'START', interval: 1000 });
    } catch (err) {
      // Fallback if Worker fails
      startFallbackTimerInterval();
    }
  } else {
    startFallbackTimerInterval();
  }
}

function startFallbackTimerInterval() {
  if (state.timer.intervalId) clearInterval(state.timer.intervalId);
  state.timer.intervalId = setInterval(() => {
    if (!state.timer.isPaused) {
      calculateElapsedSeconds();
    }
  }, 1000);
}

function calculateElapsedSeconds() {
  if (!state.timer.startTime) return;
  const now = Date.now();
  const currentPausedMs = state.timer.isPaused && state.timer.pauseStartTime ? (now - state.timer.pauseStartTime) : 0;
  const effectiveMs = now - state.timer.startTime - state.timer.totalPausedMs - currentPausedMs;
  state.timer.seconds = Math.max(0, Math.floor(effectiveMs / 1000));
  updateTimerDisplay();

  // Background Notification check on target finish
  if (state.timer.sessionData && !state.timer.notificationSent) {
    const targetSecs = state.timer.sessionData.predictedMin * 60;
    if (state.timer.seconds >= targetSecs && targetSecs > 0) {
      state.timer.notificationSent = true;
      sendBackgroundNotification(
        `⏱️ [StudyPredict] 공부시간 완료!`,
        {
          body: `'${state.timer.sessionData.bookTitle}' 목표시간 (${state.timer.sessionData.predictedMin}분)에 도달했습니다!`,
          icon: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png'
        }
      );
    }
  }
}

function togglePauseTimer() {
  const now = Date.now();
  if (state.timer.isPaused) {
    // Resume
    if (state.timer.pauseStartTime) {
      state.timer.totalPausedMs += (now - state.timer.pauseStartTime);
      state.timer.pauseStartTime = null;
    }
    state.timer.isPaused = false;
    if (DOM.btnPauseTimer) DOM.btnPauseTimer.innerHTML = `<i class="fa-solid fa-pause"></i> 일시정지`;
    if (state.timer.worker) state.timer.worker.postMessage({ command: 'START', interval: 1000 });
  } else {
    // Pause
    state.timer.pauseStartTime = now;
    state.timer.isPaused = true;
    if (DOM.btnPauseTimer) DOM.btnPauseTimer.innerHTML = `<i class="fa-solid fa-play"></i> 재개`;
    if (state.timer.worker) state.timer.worker.postMessage({ command: 'PAUSE' });
  }
}

function updateTimerDisplay() {
  if (!DOM.timerDisplay) return;
  const hrs = String(Math.floor(state.timer.seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((state.timer.seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(state.timer.seconds % 60).padStart(2, '0');
  DOM.timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
}

function stopTimerSession() {
  if (state.timer.worker) {
    state.timer.worker.postMessage({ command: 'STOP' });
    state.timer.worker.terminate();
    state.timer.worker = null;
  }
  if (state.timer.intervalId) {
    clearInterval(state.timer.intervalId);
    state.timer.intervalId = null;
  }

  const actualMinutes = Math.max(1, Math.round(state.timer.seconds / 60));
  
  DOM.activeTimerPanel?.classList.add('hidden');
  DOM.estimationPanel?.classList.remove('hidden');

  openFeedbackModal(state.timer.sessionData, actualMinutes);
}

function openManualFinishModal() {
  const bookTitle = DOM.bookTitleInput ? DOM.bookTitleInput.value.trim() || '미지정 교재' : '미지정 교재';
  const pred = calculatePrediction();

  const sessionData = {
    bookTitle,
    subject: pred.subject,
    problemCount: pred.problemCount,
    predictedMin: pred.totalPredictedMin
  };

  openFeedbackModal(sessionData, pred.totalPredictedMin);
}

function openFeedbackModal(sessionData, defaultActualMin) {
  state.timer.sessionData = sessionData;
  state.timer.pendingActualMin = defaultActualMin;
  state.timer.pendingFeedbackSaved = false;

  if (DOM.modalSessionInfo) DOM.modalSessionInfo.textContent = `교재: ${sessionData.bookTitle} (${sessionData.problemCount}문제) | 예상: ${sessionData.predictedMin}분`;
  if (DOM.actualTimeInput) DOM.actualTimeInput.value = defaultActualMin;
  if (DOM.actualWrongInput) DOM.actualWrongInput.value = Math.round(sessionData.problemCount * ((parseFloat(DOM.errorRateSlider?.value) || 20) / 100));
  DOM.feedbackModal?.classList.remove('hidden');
}

function closeFeedbackModal() {
  if (state.timer.sessionData && !state.timer.pendingFeedbackSaved) {
    // X 버튼이나 취소를 눌러도 기록이 사라지지 않도록 자동 보존 저장!
    submitSessionFeedback(true);
    return;
  }
  DOM.feedbackModal?.classList.add('hidden');
}

async function submitSessionFeedback(isAutoSave = false) {
  const session = state.timer.sessionData;
  if (!session) return;

  state.timer.pendingFeedbackSaved = true;

  const actualMin = parseInt(DOM.actualTimeInput?.value) || state.timer.pendingActualMin || 1;
  const wrongCount = parseInt(DOM.actualWrongInput?.value) || 0;

  const predictedMin = session.predictedMin;
  const errorRatio = actualMin / predictedMin;
  const subject = session.subject || '일반';

  const oldAlpha = state.subjectAlphas[subject] || 1.0;
  const newAlpha = Math.max(0.5, Math.min(3.0, (oldAlpha * 0.7) + (errorRatio * 0.3)));
  state.subjectAlphas[subject] = newAlpha;
  localStorage.setItem('study_subject_alphas', JSON.stringify(state.subjectAlphas));

  const newLog = {
    id: `log-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    bookTitle: session.bookTitle,
    subject,
    problemCount: session.problemCount,
    predictedMin,
    actualMin,
    wrongCount,
    errorRatio: (errorRatio * 100).toFixed(0) + '%'
  };

  // 1. Local & Current User History Update
  state.history.unshift(newLog);
  localStorage.setItem('study_history', JSON.stringify(state.history));
  if (state.currentUser) {
    const userHistoryKey = `study_history_${state.currentUser.id}`;
    let userHistory = JSON.parse(localStorage.getItem(userHistoryKey)) || [];
    userHistory.unshift(newLog);
    localStorage.setItem(userHistoryKey, JSON.stringify(userHistory));
  }

  // 2. Supabase DB Save
  const SUPABASE_URL = state.supabaseConfig.url || 'https://ioyjbdhkzyatgurqvsmz.supabase.co';
  const SUPABASE_KEY = state.supabaseConfig.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveWpiZGhrenlhdGd1cnF2c216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjc4OTMsImV4cCI6MjEwMDgwMzg5M30.noBv8DJtCmoL5JpBniS2HkvPd-rpW1Vqgnt69JKwJUo';
  try {
    fetch(`${SUPABASE_URL}/rest/v1/study_logs`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        book_title: session.bookTitle,
        subject,
        problem_count: session.problemCount,
        predicted_min: predictedMin,
        actual_min: actualMin,
        wrong_count: wrongCount
      })
    });
  } catch (e) {}

  DOM.feedbackModal?.classList.add('hidden');
  renderHistory();
  recalculatePrediction();

  if (isAutoSave) {
    alert(`⏱️ 측정된 공부 기록(${actualMin}분)이 삭제되지 않고 안전하게 자동 저장되었습니다!`);
  } else {
    alert(`🎉 학습 기록이 성공적으로 저장되었습니다!\n[${subject}] 과목 보정 알파(α): ${oldAlpha.toFixed(2)} -> ${newAlpha.toFixed(2)}`);
  }
}

function renderPresetList() {
  if (!DOM.presetListGrid) return;
  if (state.presets.length === 0) {
    DOM.presetListGrid.innerHTML = `<p style="color:var(--text-muted)">등록된 교재 프리셋이 없습니다.</p>`;
    return;
  }

  DOM.presetListGrid.innerHTML = state.presets.map(p => `
    <div class="preset-card-item">
      <div class="preset-info">
        <h4>${p.title}</h4>
        <p>${p.subject} | 난이도: ${getTierLabel(p.difficulty_weight)} (${p.difficulty_weight}x)</p>
        <p><small style="color:var(--primary)">과목 보정 가중치 (α): ${(state.subjectAlphas[p.subject] || 1.0).toFixed(2)}</small></p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="deletePreset('${p.id}')">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function saveNewPreset() {
  const title = document.getElementById('new-preset-title')?.value.trim();
  const subject = document.getElementById('new-preset-subject')?.value.trim() || '일반';
  const difficulty = parseFloat(document.getElementById('new-preset-difficulty')?.value || 1.5);

  if (!title) {
    alert('교재명을 입력해주세요.');
    return;
  }

  const newPreset = {
    id: `preset-${Date.now()}`,
    title,
    subject,
    difficulty_weight: difficulty,
    correction_factor: 1.0
  };

  state.presets.push(newPreset);
  savePresets();
  renderPresetList();
  closePresetModal();
}

function deletePreset(id) {
  state.presets = state.presets.filter(p => p.id !== id);
  savePresets();
  renderPresetList();
}

function savePresets() {
  localStorage.setItem('study_presets', JSON.stringify(state.presets));
}

function closePresetModal() {
  DOM.presetModal?.classList.add('hidden');
}

function renderHistory() {
  if (!DOM.historyTableBody) return;
  const logs = state.history;
  if (DOM.statTotalCount) DOM.statTotalCount.textContent = `${logs.length}회`;

  if (logs.length === 0) {
    DOM.historyTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted)">저장된 공부 기록이 없습니다.</td></tr>`;
    if (DOM.statAccuracy) DOM.statAccuracy.textContent = '100%';
    if (DOM.statTotalHours) DOM.statTotalHours.textContent = '0시간';
    renderSubjectBreakdown({});
    return;
  }

  const totalMin = logs.reduce((acc, cur) => acc + cur.actualMin, 0);
  if (DOM.statTotalHours) DOM.statTotalHours.textContent = `${(totalMin / 60).toFixed(1)}시간`;

  const avgRatio = logs.reduce((acc, cur) => acc + parseFloat(cur.errorRatio), 0) / logs.length;
  const accuracy = Math.max(0, 100 - Math.abs(avgRatio - 100));
  if (DOM.statAccuracy) DOM.statAccuracy.textContent = `${accuracy.toFixed(0)}%`;

  const subjectTotals = {};
  logs.forEach(log => {
    const subj = log.subject || '일반';
    subjectTotals[subj] = (subjectTotals[subj] || 0) + log.actualMin;
  });
  renderSubjectBreakdown(subjectTotals);

  DOM.historyTableBody.innerHTML = logs.map(log => `
    <tr>
      <td>${log.date}</td>
      <td><strong>${log.bookTitle}</strong></td>
      <td><span class="badge badge-medium">${log.subject || '일반'}</span></td>
      <td>${log.problemCount}개</td>
      <td>${log.predictedMin}분</td>
      <td><strong style="color:var(--primary)">${log.actualMin}분</strong></td>
      <td>${log.wrongCount}개</td>
      <td><span class="badge ${parseFloat(log.errorRatio) > 115 ? 'badge-live' : 'badge-medium'}">${log.errorRatio}</span></td>
      <td>
        <button class="btn btn-secondary btn-sm" onclick="deleteHistoryLog('${log.id}')">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </td>
    </tr>
  `).join('');
}

function renderSubjectBreakdown(subjectTotals) {
  if (!DOM.subjectProgressBar || !DOM.subjectLegend) return;
  const total = Object.values(subjectTotals).reduce((a, b) => a + b, 0);

  if (total === 0) {
    DOM.subjectProgressBar.innerHTML = `<div class="progress-segment" style="width:100%; background:var(--border-subtle);"></div>`;
    DOM.subjectLegend.innerHTML = `<span style="color:var(--text-muted)">기록이 쌓이면 과목별 비중이 표시됩니다.</span>`;
    return;
  }

  let segmentsHtml = '';
  let legendsHtml = '';

  Object.entries(subjectTotals).forEach(([subj, mins]) => {
    const pct = ((mins / total) * 100).toFixed(1);
    const color = SUBJECT_COLORS[subj] || '#6B7280';
    segmentsHtml += `<div class="progress-segment" style="width:${pct}%; background:${color};" title="${subj}: ${pct}%"></div>`;
    legendsHtml += `
      <div class="legend-item">
        <span class="legend-color-dot" style="background:${color};"></span>
        <span>${subj}: <strong>${pct}%</strong> (${(mins / 60).toFixed(1)}h)</span>
      </div>
    `;
  });

  DOM.subjectProgressBar.innerHTML = segmentsHtml;
  DOM.subjectLegend.innerHTML = legendsHtml;
}

function deleteHistoryLog(id) {
  state.history = state.history.filter(h => h.id !== id);
  localStorage.setItem('study_history', JSON.stringify(state.history));
  renderHistory();
}

// --- PWA & Background Notification Functions ---
function initPWAAndNotifications() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').then(reg => {
      console.log('PWA ServiceWorker registered:', reg);
    }).catch(err => {
      console.warn('PWA ServiceWorker registration failed:', err);
    });
  }
  updateNotificationButtonState();
}

function updateNotificationButtonState() {
  if (!DOM.notiBtnText) return;
  if (!('Notification' in window)) {
    DOM.notiBtnText.textContent = '알림 미지원';
    return;
  }
  if (Notification.permission === 'granted') {
    DOM.notiBtnText.textContent = '알림 허용됨';
    DOM.btnPwaNoti?.classList.remove('btn-secondary');
    DOM.btnPwaNoti?.classList.add('btn-primary');
  } else {
    DOM.notiBtnText.textContent = '알림 허용';
  }
}

function requestNotificationPermission() {
  if (!('Notification' in window)) {
    alert('현재 브라우저가 데스크톱/백그라운드 알림을 지원하지 않습니다.');
    return;
  }
  Notification.requestPermission().then(permission => {
    updateNotificationButtonState();
    if (permission === 'granted') {
      sendBackgroundNotification('🔔 백그라운드 알림 활성화!', {
        body: '타이머가 완료되면 백그라운드에서도 즉시 알림이 발송됩니다.',
        icon: 'https://cdn-icons-png.flaticon.com/512/3426/3426653.png'
      });
    }
  });
}

function sendBackgroundNotification(title, options) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;
  if (navigator.serviceWorker && navigator.serviceWorker.controller) {
    navigator.serviceWorker.ready.then(reg => {
      reg.showNotification(title, options);
    });
  } else {
    new Notification(title, options);
  }
}

// --- Custom Local Authentication Engine ---
function checkAuthSession() {
  const users = JSON.parse(localStorage.getItem('study_users')) || [];
  const currentUser = JSON.parse(localStorage.getItem('study_current_user')) || null;
  state.users = users;
  updateAuthUI(currentUser);
}

function syncGuestDataToUser(user) {
  if (!user) return;
  const userHistoryKey = `study_history_${user.id}`;
  let userHistory = JSON.parse(localStorage.getItem(userHistoryKey)) || [];

  if (state.history && state.history.length > 0) {
    const existingIds = new Set(userHistory.map(h => h.id));
    const newGuestLogs = state.history.filter(h => !existingIds.has(h.id));
    if (newGuestLogs.length > 0) {
      userHistory = [...newGuestLogs, ...userHistory];
    }
  }

  state.history = userHistory;
  localStorage.setItem(userHistoryKey, JSON.stringify(userHistory));
  localStorage.setItem('study_history', JSON.stringify(userHistory));

  renderHistory();
}

function updateAuthUI(user) {
  state.currentUser = user;
  if (user) {
    if (DOM.btnOpenAuth) DOM.btnOpenAuth.classList.add('hidden');
    if (DOM.userAuthBadge) DOM.userAuthBadge.classList.remove('hidden');
    if (DOM.userEmailDisplay) DOM.userEmailDisplay.innerHTML = `<i class="fa-solid fa-user-check"></i> ${user.username || user.email}`;
    if (DOM.barUserName) DOM.barUserName.textContent = user.username || user.email;

    if (DOM.onboardUserName) {
      DOM.onboardUserName.value = user.username || user.email;
      DOM.onboardUserName.readOnly = false;
      DOM.onboardUserName.style.background = '';
    }

    const userSkillMult = user.skillMult || (state.profile ? state.profile.skillMult : 1.0);
    const radio = document.querySelector(`input[name="onboard-skill"][value="${userSkillMult}"]`);
    if (radio) radio.checked = true;

    syncGuestDataToUser(user);
  } else {
    if (DOM.btnOpenAuth) DOM.btnOpenAuth.classList.remove('hidden');
    if (DOM.userAuthBadge) DOM.userAuthBadge.classList.add('hidden');
    if (DOM.barUserName) DOM.barUserName.textContent = state.profile ? state.profile.name : '열공이';

    if (DOM.onboardUserName) {
      DOM.onboardUserName.value = state.profile ? state.profile.name : '열공이';
      DOM.onboardUserName.readOnly = false;
      DOM.onboardUserName.style.background = '';
    }
  }
  updateProfileBar();
  recalculatePrediction();
}

function openAuthModal() {
  document.getElementById('onboarding-modal')?.classList.add('hidden');
  document.getElementById('feedback-modal')?.classList.add('hidden');
  document.getElementById('preset-modal')?.classList.add('hidden');

  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.remove('hidden');
    modal.style.display = 'flex';
    modal.style.zIndex = '9999';
  }
}

function closeAuthModal() {
  const modal = document.getElementById('auth-modal');
  if (modal) {
    modal.classList.add('hidden');
    modal.style.display = '';
  }
}

window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;

function switchAuthTab(mode) {
  state.authMode = mode;
  const groupUsername = DOM.groupAuthUsername || document.getElementById('group-auth-username');
  const btnSubmit = DOM.btnSubmitAuth || document.getElementById('btn-submit-auth');
  const tabLogin = DOM.tabAuthLogin || document.getElementById('tab-auth-login');
  const tabSignup = DOM.tabAuthSignup || document.getElementById('tab-auth-signup');

  if (mode === 'login') {
    tabLogin?.classList.add('active');
    tabSignup?.classList.remove('active');
    groupUsername?.classList.add('hidden');
    if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-right-to-bracket"></i> 로그인`;
  } else {
    tabSignup?.classList.add('active');
    tabLogin?.classList.remove('active');
    groupUsername?.classList.remove('hidden');
    if (btnSubmit) btnSubmit.innerHTML = `<i class="fa-solid fa-user-plus"></i> 회원가입 완료`;
  }
}

window.switchAuthTab = switchAuthTab;

// SHA-256 Password Hashing Helper
async function hashPassword(password) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(password + "_study_predict_salt_2026");
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    return password; // Fallback if crypto subtle fails
  }
}

async function handleAuthSubmit() {
  if (state.isAuthProcessing) return;
  state.isAuthProcessing = true;

  const emailInput = DOM.authEmail || document.getElementById('auth-email');
  const passwordInput = DOM.authPassword || document.getElementById('auth-password');
  const usernameInput = DOM.authUsername || document.getElementById('auth-username');

  const email = emailInput?.value.trim();
  const password = passwordInput?.value.trim();
  const username = usernameInput?.value.trim() || email || '학습자';

  if (!email || !password) {
    alert('아이디와 비밀번호를 모두 입력해주세요.');
    state.isAuthProcessing = false;
    return;
  }

  const SUPABASE_URL = state.supabaseConfig.url || 'https://ioyjbdhkzyatgurqvsmz.supabase.co';
  const SUPABASE_KEY = state.supabaseConfig.anonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlveWpiZGhrenlhdGd1cnF2c216Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyMjc4OTMsImV4cCI6MjEwMDgwMzg5M30.noBv8DJtCmoL5JpBniS2HkvPd-rpW1Vqgnt69JKwJUo';

  try {
    const passwordHash = await hashPassword(password);

    if (state.authMode === 'signup') {
      // 1. Check existing user in Supabase DB
      let existingUsers = [];
      try {
        const checkRes = await fetch(`${SUPABASE_URL}/rest/v1/study_users?email=eq.${encodeURIComponent(email)}`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (checkRes.ok) existingUsers = await checkRes.json();
      } catch (e) {}

      if (existingUsers && existingUsers.length > 0) {
        alert('❌ 이미 존재하는 아이디입니다. 다른 아이디로 가입해주세요.');
        state.isAuthProcessing = false;
        return;
      }

      // 2. Insert new user with SHA-256 Hashed Password
      const newUser = {
        id: 'user-' + Date.now(),
        email: email,
        username: username,
        password: passwordHash,
        skill_mult: 1.0,
        created_at: new Date().toISOString()
      };

      try {
        await fetch(`${SUPABASE_URL}/rest/v1/study_users`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_KEY,
            'Authorization': `Bearer ${SUPABASE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify(newUser)
        });
      } catch (e) {}

      // Save Local Fallback Session
      let users = JSON.parse(localStorage.getItem('study_users')) || [];
      users.push(newUser);
      localStorage.setItem('study_users', JSON.stringify(users));

      const sessionUser = { id: newUser.id, email: newUser.email, username: newUser.username, skillMult: 1.0, skillLabel: '보통 (1.0x)' };
      localStorage.setItem('study_current_user', JSON.stringify(sessionUser));
      updateAuthUI(sessionUser);

      alert(`🎉 암호화 회원가입이 완료되었습니다! 모든 기기에서 공유됩니다. 반가워요, ${username} 님.`);
      closeAuthModal();
    } else {
      // Login - Fetch matching user from Supabase DB
      let matchedUsers = [];
      try {
        const loginRes = await fetch(`${SUPABASE_URL}/rest/v1/study_users?email=eq.${encodeURIComponent(email)}&password=eq.${encodeURIComponent(passwordHash)}`, {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': `Bearer ${SUPABASE_KEY}` }
        });
        if (loginRes.ok) matchedUsers = await loginRes.json();
      } catch (e) {}

      if (matchedUsers && matchedUsers.length > 0) {
        const dbUser = matchedUsers[0];
        const sessionUser = {
          id: dbUser.id,
          email: dbUser.email,
          username: dbUser.username,
          skillMult: parseFloat(dbUser.skill_mult) || 1.0,
          skillLabel: (parseFloat(dbUser.skill_mult) === 1.35) ? '노베이스/기초부족 (1.35x)' : (parseFloat(dbUser.skill_mult) === 0.75 ? '상위권/풀이빠름 (0.75x)' : '보통 (1.0x)')
        };
        localStorage.setItem('study_current_user', JSON.stringify(sessionUser));
        updateAuthUI(sessionUser);
        alert(`🎉 보안 로그인되었습니다. 모든 기기에서 데이터가 공유됩니다! 반가워요, ${sessionUser.username} 님!`);
        closeAuthModal();
      } else {
        // Fallback check in local users
        let users = JSON.parse(localStorage.getItem('study_users')) || [];
        const localUser = users.find(u => u && u.email && u.email.toLowerCase() === email.toLowerCase() && (u.password === password || u.password === passwordHash));
        if (localUser) {
          const sessionUser = { id: localUser.id, email: localUser.email, username: localUser.username, skillMult: localUser.skillMult || 1.0, skillLabel: localUser.skillLabel || '보통 (1.0x)' };
          localStorage.setItem('study_current_user', JSON.stringify(sessionUser));
          updateAuthUI(sessionUser);
          alert(`🎉 로그인되었습니다. 반가워요, ${sessionUser.username} 님!`);
          closeAuthModal();
        } else {
          alert('❌ 아이디 또는 비밀번호가 일치하지 않습니다.');
          state.isAuthProcessing = false;
          return;
        }
      }
    }
  } catch (err) {
    alert('❌ 처리 중 오류가 발생했습니다.');
  } finally {
    setTimeout(() => { state.isAuthProcessing = false; }, 500);
  }
}

window.handleAuthSubmit = handleAuthSubmit;

function handleLogout() {
  if (state.isLoggingOut) return;
  state.isLoggingOut = true;
  localStorage.removeItem('study_current_user');
  updateAuthUI(null);
  alert('👋 성공적으로 로그아웃되었습니다.');
  setTimeout(() => {
    state.isLoggingOut = false;
  }, 500);
}

window.handleLogout = handleLogout;
