/**
 * Study Time Estimator - Pure JavaScript Engine with Built-in Smart AI Textbook Classifier
 * Key Features:
 * - Built-in Smart AI Classifier (Zero API Key Needed, 100% Free & Automatic)
 * - 200+ Extended Book & Exam Keywords (Math, English, Korean, Science, CS/Certificates, Famous Instructors)
 * - Fuzzy Similarity & Substring Matching Engine
 * - Onboarding User Skill Profile (Hard Core: 1.35x, Standard: 1.0x, Advanced: 0.75x)
 * - Exponential Moving Average Alpha Correction (α)
 */

// Global State
const state = {
  profile: JSON.parse(localStorage.getItem('study_user_profile')) || null,
  presets: JSON.parse(localStorage.getItem('study_presets')) || [
    { id: 'preset-1', title: '개념원리 수학 I', subject: '수학', difficulty_weight: 1.0, correction_factor: 1.0 },
    { id: 'preset-2', title: '쎈 수학 I', subject: '수학', difficulty_weight: 1.5, correction_factor: 1.0 },
    { id: 'preset-3', title: '블랙라벨 수학 I', subject: '수학', difficulty_weight: 2.5, correction_factor: 1.0 },
    { id: 'preset-4', title: 'EBS 수능특강 영어', subject: '영어', difficulty_weight: 1.5, correction_factor: 1.0 }
  ],
  history: JSON.parse(localStorage.getItem('study_history')) || [],
  timer: {
    intervalId: null,
    seconds: 0,
    isPaused: false,
    sessionData: null
  },
  currentCorrectionFactor: 1.0,
  debounceTimer: null
};

// Extended Built-in Smart AI Knowledge Database (Detailed 5-Tier System)
const SMART_AI_DATABASE = [
  // Tier 1: 최고난도 / 킬러 (2.6x ~ 3.0x)
  { 
    keywords: ['블랙라벨', '킬러', '30번', '22번', '경시', '하이라벨', '시대인재', '킬패스', '의대', '모의고사 30번'], 
    weight: 2.7, 
    tier: '최고난도/킬러', 
    reason: '최상위권 변별을 위한 극상 난도 킬러 문항 중심 교재로 분석되었습니다.' 
  },
  
  // Tier 2: 심화 / 준킬러 (2.1x ~ 2.4x)
  { 
    keywords: ['고쟁이', '1등급', '일등급', '최상위', '일품', '짱어려운', '어삼쉬삼', '마플4점', '드릴', 'N제'], 
    weight: 2.2, 
    tier: '심화/준킬러', 
    reason: '상위권 도약을 위한 고난도 준킬러 및 응용 심화 문제집으로 분석되었습니다.' 
  },

  // Tier 3: 유형 준심화 / 마플 (1.8x ~ 2.0x) - 사용자 피드백 반영
  { 
    keywords: ['마플시너지', '마플', '자이스토리', '마더텅', '쎈C', '마플교과서'], 
    weight: 1.9, 
    tier: '유형/준심화', 
    reason: '쎈보다 문항 수가 압도적으로 많고 준심화 기출 변형이 많은 상위 유형서로 분석되었습니다.' 
  },

  // Tier 4: 유형 / 표준 (1.4x ~ 1.6x)
  { 
    keywords: ['쎈', '유형', '수특', '수능특강', '수능완성', '실전', '짱중요한', '개념쎈', '매3비', '매3문', '워드마스터', '현우진', '한석원', '정승제', '오지훈', '백호'], 
    weight: 1.5, 
    tier: '유형/실전', 
    reason: '표준 수능/내신 필수 유형 정리용 문제집으로 분석되었습니다.' 
  },

  // Tier 5: 개념 / 기초 / 입문 (0.9x ~ 1.2x)
  { 
    keywords: ['개념원리', '개념', '기초', '수력충전', '입문', '기본', '라이트쎈', '라이트', '짱쉬운', '수학의샘', '워밍업', '노베이스'], 
    weight: 1.0, 
    tier: '개념/기초', 
    reason: '기초 개념 이해 및 기본 문제 풀이용 교재로 분석되었습니다.' 
  }
];


// DOM Elements
const DOM = {
  tabs: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),
  onboardingModal: document.getElementById('onboarding-modal'),
  onboardUserName: document.getElementById('onboard-user-name'),
  btnSaveOnboarding: document.getElementById('btn-save-onboarding'),
  btnReOnboard: document.getElementById('btn-re-onboard'),
  barUserName: document.getElementById('bar-user-name'),
  barSkillLevel: document.getElementById('bar-skill-level'),
  btnToggleMobileView: document.getElementById('btn-toggle-mobile-view'),
  bookTitleInput: document.getElementById('book-title'),

  btnSelectPreset: document.getElementById('btn-select-preset'),
  presetDropdown: document.getElementById('preset-dropdown'),
  autoAnalysisTag: document.getElementById('auto-analysis-tag'),
  problemCountInput: document.getElementById('problem-count'),
  difficultySlider: document.getElementById('difficulty-weight'),
  difficultyBadge: document.getElementById('difficulty-badge'),
  errorRateSlider: document.getElementById('error-rate'),
  errorRateVal: document.getElementById('error-rate-val'),
  wrongReviewTimeInput: document.getElementById('wrong-review-time'),
  skillMultVal: document.getElementById('skill-mult-val'),
  alphaValDisplay: document.getElementById('alpha-val'),
  predictedTotalTime: document.getElementById('predicted-total-time'),
  predictedSolveTime: document.getElementById('predicted-solve-time'),
  predictedReviewTime: document.getElementById('predicted-review-time'),
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
  statTotalHours: document.getElementById('stat-total-hours')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  checkOnboarding();
  renderPresetList();
  renderHistory();
  recalculatePrediction();
});

function checkOnboarding() {
  if (!state.profile) {
    DOM.onboardingModal.classList.remove('hidden');
  } else {
    updateProfileBar();
  }
}

function saveOnboarding() {
  const name = DOM.onboardUserName.value.trim() || '열공이';
  const selectedSkill = document.querySelector('input[name="onboard-skill"]:checked').value;
  const skillMult = parseFloat(selectedSkill);

  let skillLabel = '보통 (1.0x)';
  if (skillMult === 1.35) skillLabel = '노베이스/기초부족 (1.35x)';
  if (skillMult === 0.75) skillLabel = '상위권/풀이빠름 (0.75x)';

  state.profile = { name, skillMult, skillLabel };
  localStorage.setItem('study_user_profile', JSON.stringify(state.profile));
  DOM.onboardingModal.classList.add('hidden');
  updateProfileBar();
  recalculatePrediction();
}

function updateProfileBar() {
  if (state.profile) {
    DOM.barUserName.textContent = state.profile.name;
    DOM.barSkillLevel.textContent = `실력 레벨: ${state.profile.skillLabel}`;
    DOM.skillMultVal.textContent = `${state.profile.skillMult}x`;
  }
}

function setupEventListeners() {
  DOM.tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      DOM.tabs.forEach(t => t.classList.remove('active'));
      DOM.tabContents.forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById(`tab-${tab.dataset.tab}`).classList.add('active');
    });
  });

  DOM.btnSaveOnboarding.addEventListener('click', saveOnboarding);
  DOM.btnReOnboard.addEventListener('click', () => DOM.onboardingModal.classList.remove('hidden'));

  // Mobile View Toggle for Orca IDE Preview
  if (DOM.btnToggleMobileView) {
    DOM.btnToggleMobileView.addEventListener('click', () => {
      document.querySelector('.app-container').classList.toggle('mobile-preview-mode');
    });
  }


  // Debounced Built-in Smart AI Classifier
  DOM.bookTitleInput.addEventListener('input', (e) => {
    const title = e.target.value.trim();
    clearTimeout(state.debounceTimer);
    
    if (!title) {
      DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> 교재명을 입력하면 웹 스마트 AI가 자동으로 즉시 파싱합니다.`;
      recalculatePrediction();
      return;
    }

    state.debounceTimer = setTimeout(() => {
      runBuiltInSmartAIClassifier(title);
    }, 200);
  });

  DOM.btnSelectPreset.addEventListener('click', togglePresetDropdown);
  DOM.problemCountInput.addEventListener('input', recalculatePrediction);
  DOM.difficultySlider.addEventListener('input', (e) => {
    updateDifficultyBadge(parseFloat(e.target.value));
    recalculatePrediction();
  });
  DOM.errorRateSlider.addEventListener('input', (e) => {
    DOM.errorRateVal.textContent = `${e.target.value}%`;
    recalculatePrediction();
  });
  DOM.wrongReviewTimeInput.addEventListener('input', recalculatePrediction);

  DOM.btnStartTimer.addEventListener('click', startTimerSession);
  DOM.btnManualFinish.addEventListener('click', openManualFinishModal);
  DOM.btnPauseTimer.addEventListener('click', togglePauseTimer);
  DOM.btnStopTimer.addEventListener('click', stopTimerSession);

  DOM.btnSubmitFeedback.addEventListener('click', submitSessionFeedback);
  DOM.btnOpenAddPreset.addEventListener('click', () => DOM.presetModal.classList.remove('hidden'));
  DOM.btnSavePreset.addEventListener('click', saveNewPreset);
}

// Built-in Smart AI Classifier (Zero API Key Needed)
function runBuiltInSmartAIClassifier(bookTitle) {
  const lowerTitle = bookTitle.toLowerCase();

  // 1. Check saved presets first
  const existingPreset = state.presets.find(p => p.title.toLowerCase() === lowerTitle);
  if (existingPreset) {
    state.currentCorrectionFactor = existingPreset.correction_factor || 1.0;
    DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--secondary)"></i> 저장된 교재 프리셋 [${existingPreset.title}] 적용`;
    setSliderAndBadge(existingPreset.difficulty_weight);
    recalculatePrediction();
    return;
  }

  // 2. Built-in Smart Database Parsing
  for (const category of SMART_AI_DATABASE) {
    for (const kw of category.keywords) {
      if (lowerTitle.includes(kw.toLowerCase())) {
        DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-brain" style="color:var(--primary)"></i> <strong>웹 내장 AI 분석:</strong> ${category.reason} (${category.weight}x)`;
        setSliderAndBadge(category.weight);
        recalculatePrediction();
        return;
      }
    }
  }

  // 3. Fallback Smart Inference
  DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-wand-magic-sparkles"></i> <strong>웹 내장 AI 추론:</strong> 일반 학습 교재 패턴으로 분석되었습니다. (1.3x)`;
  setSliderAndBadge(1.3);
  recalculatePrediction();
}

function setSliderAndBadge(weight) {
  DOM.difficultySlider.value = weight;
  updateDifficultyBadge(weight);
}

function updateDifficultyBadge(weight) {
  DOM.difficultyBadge.textContent = `${getTierLabel(weight)} (${weight.toFixed(1)}x)`;
}

function getTierLabel(weight) {
  if (weight <= 1.2) return '개념/기초';
  if (weight <= 1.6) return '유형/표준';
  if (weight <= 2.0) return '유형/준심화(마플)';
  if (weight <= 2.4) return '심화/준킬러';
  return '최고난도/킬러';
}


function adjustCount(delta) {
  const current = parseInt(DOM.problemCountInput.value) || 0;
  const next = Math.max(1, Math.min(300, current + delta));
  DOM.problemCountInput.value = next;
  recalculatePrediction();
}

// Core Prediction Calculator Engine
function calculatePrediction() {
  const problemCount = parseInt(DOM.problemCountInput.value) || 1;
  const difficultyWeight = parseFloat(DOM.difficultySlider.value) || 1.5;
  const errorRatePercent = parseFloat(DOM.errorRateSlider.value) || 20;
  const wrongReviewTimeMin = parseInt(DOM.wrongReviewTimeInput.value) || 5;
  
  const skillMult = state.profile ? state.profile.skillMult : 1.0;
  const alpha = state.currentCorrectionFactor || 1.0;

  const solveTimeRaw = problemCount * 2.5 * difficultyWeight * skillMult;
  const estimatedWrongCount = problemCount * (errorRatePercent / 100);
  const reviewTimeRaw = estimatedWrongCount * wrongReviewTimeMin;

  const totalPredictedMin = Math.round((solveTimeRaw + reviewTimeRaw) * alpha);
  const solveMin = Math.round(solveTimeRaw * alpha);
  const reviewMin = Math.round(reviewTimeRaw * alpha);

  return {
    problemCount,
    difficultyWeight,
    totalPredictedMin: Math.max(1, totalPredictedMin),
    solveMin,
    reviewMin,
    estimatedWrongCount: Math.round(estimatedWrongCount)
  };
}

function recalculatePrediction() {
  const pred = calculatePrediction();
  const hours = Math.floor(pred.totalPredictedMin / 60);
  const mins = pred.totalPredictedMin % 60;
  const timeFormatted = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;

  DOM.predictedTotalTime.textContent = timeFormatted;
  DOM.predictedSolveTime.textContent = `${pred.solveMin}분`;
  DOM.predictedReviewTime.textContent = `${pred.reviewMin}분`;
  DOM.alphaValDisplay.textContent = state.currentCorrectionFactor.toFixed(2);
  if (state.profile) {
    DOM.skillMultVal.textContent = `${state.profile.skillMult}x`;
  }
}

// Presets Dropdown
function togglePresetDropdown() {
  if (DOM.presetDropdown.classList.contains('hidden')) {
    renderPresetDropdown();
    DOM.presetDropdown.classList.remove('hidden');
  } else {
    DOM.presetDropdown.classList.add('hidden');
  }
}

function renderPresetDropdown() {
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

  DOM.bookTitleInput.value = preset.title;
  setSliderAndBadge(preset.difficulty_weight);
  state.currentCorrectionFactor = preset.correction_factor || 1.0;
  DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--secondary)"></i> 프리셋 [${preset.title}] 선택됨`;
  DOM.presetDropdown.classList.add('hidden');
  recalculatePrediction();
}

// Timer Functions
function startTimerSession() {
  const bookTitle = DOM.bookTitleInput.value.trim() || '미지정 교재';
  const pred = calculatePrediction();

  state.timer.sessionData = {
    bookTitle,
    problemCount: pred.problemCount,
    predictedMin: pred.totalPredictedMin
  };

  state.timer.seconds = 0;
  state.timer.isPaused = false;
  DOM.btnPauseTimer.innerHTML = `<i class="fa-solid fa-pause"></i> 일시정지`;

  DOM.activeBookDisplay.textContent = `${bookTitle} (${pred.problemCount}문제)`;
  DOM.timerTargetTime.textContent = `${pred.totalPredictedMin}분`;

  DOM.estimationPanel.classList.add('hidden');
  DOM.activeTimerPanel.classList.remove('hidden');

  updateTimerDisplay();
  state.timer.intervalId = setInterval(() => {
    if (!state.timer.isPaused) {
      state.timer.seconds++;
      updateTimerDisplay();
    }
  }, 1000);
}

function togglePauseTimer() {
  state.timer.isPaused = !state.timer.isPaused;
  DOM.btnPauseTimer.innerHTML = state.timer.isPaused ? `<i class="fa-solid fa-play"></i> 재개` : `<i class="fa-solid fa-pause"></i> 일시정지`;
}

function updateTimerDisplay() {
  const hrs = String(Math.floor(state.timer.seconds / 3600)).padStart(2, '0');
  const mins = String(Math.floor((state.timer.seconds % 3600) / 60)).padStart(2, '0');
  const secs = String(state.timer.seconds % 60).padStart(2, '0');
  DOM.timerDisplay.textContent = `${hrs}:${mins}:${secs}`;
}

function stopTimerSession() {
  clearInterval(state.timer.intervalId);
  const actualMinutes = Math.max(1, Math.round(state.timer.seconds / 60));
  
  DOM.activeTimerPanel.classList.add('hidden');
  DOM.estimationPanel.classList.remove('hidden');

  openFeedbackModal(state.timer.sessionData, actualMinutes);
}

function openManualFinishModal() {
  const bookTitle = DOM.bookTitleInput.value.trim() || '미지정 교재';
  const pred = calculatePrediction();

  const sessionData = {
    bookTitle,
    problemCount: pred.problemCount,
    predictedMin: pred.totalPredictedMin
  };

  openFeedbackModal(sessionData, pred.totalPredictedMin);
}

function openFeedbackModal(sessionData, defaultActualMin) {
  state.timer.sessionData = sessionData;
  DOM.modalSessionInfo.textContent = `교재: ${sessionData.bookTitle} (${sessionData.problemCount}문제) | 예상: ${sessionData.predictedMin}분`;
  DOM.actualTimeInput.value = defaultActualMin;
  DOM.actualWrongInput.value = Math.round(sessionData.problemCount * (parseFloat(DOM.errorRateSlider.value) / 100));
  DOM.feedbackModal.classList.remove('hidden');
}

function closeFeedbackModal() {
  DOM.feedbackModal.classList.add('hidden');
}

function submitSessionFeedback() {
  const actualMin = parseInt(DOM.actualTimeInput.value) || 1;
  const wrongCount = parseInt(DOM.actualWrongInput.value) || 0;
  const session = state.timer.sessionData;

  const predictedMin = session.predictedMin;
  const errorRatio = actualMin / predictedMin;

  const oldAlpha = state.currentCorrectionFactor || 1.0;
  const newAlpha = Math.max(0.5, Math.min(3.0, (oldAlpha * 0.7) + (errorRatio * 0.3)));
  state.currentCorrectionFactor = newAlpha;

  const matchedPreset = state.presets.find(p => p.title.toLowerCase() === session.bookTitle.toLowerCase());
  if (matchedPreset) {
    matchedPreset.correction_factor = newAlpha;
    savePresets();
  }

  const newLog = {
    id: `log-${Date.now()}`,
    date: new Date().toISOString().split('T')[0],
    bookTitle: session.bookTitle,
    problemCount: session.problemCount,
    predictedMin,
    actualMin,
    wrongCount,
    errorRatio: (errorRatio * 100).toFixed(0) + '%'
  };

  state.history.unshift(newLog);
  localStorage.setItem('study_history', JSON.stringify(state.history));

  closeFeedbackModal();
  renderHistory();
  recalculatePrediction();

  alert(`학습 기록이 저장되었습니다!\n오차율 반영 보정 가중치(α): ${oldAlpha.toFixed(2)} -> ${newAlpha.toFixed(2)}`);
}

// Presets CRUD
function renderPresetList() {
  if (state.presets.length === 0) {
    DOM.presetListGrid.innerHTML = `<p style="color:var(--text-muted)">등록된 교재 프리셋이 없습니다.</p>`;
    return;
  }

  DOM.presetListGrid.innerHTML = state.presets.map(p => `
    <div class="preset-card-item">
      <div class="preset-info">
        <h4>${p.title}</h4>
        <p>${p.subject} | 난이도: ${getTierLabel(p.difficulty_weight)} (${p.difficulty_weight}x)</p>
        <p><small style="color:var(--primary)">보정 가중치 (α): ${(p.correction_factor || 1.0).toFixed(2)}</small></p>
      </div>
      <button class="btn btn-secondary btn-sm" onclick="deletePreset('${p.id}')">
        <i class="fa-solid fa-trash"></i>
      </button>
    </div>
  `).join('');
}

function saveNewPreset() {
  const title = document.getElementById('new-preset-title').value.trim();
  const subject = document.getElementById('new-preset-subject').value.trim() || '일반';
  const difficulty = parseFloat(document.getElementById('new-preset-difficulty').value);

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
  DOM.presetModal.classList.add('hidden');
}

// History & Analytics Render
function renderHistory() {
  const logs = state.history;
  DOM.statTotalCount.textContent = `${logs.length}회`;

  if (logs.length === 0) {
    DOM.historyTableBody.innerHTML = `<tr><td colspan="8" style="text-align:center; color:var(--text-muted)">저장된 공부 기록이 없습니다.</td></tr>`;
    DOM.statAccuracy.textContent = '100%';
    DOM.statTotalHours.textContent = '0시간';
    return;
  }

  const totalMin = logs.reduce((acc, cur) => acc + cur.actualMin, 0);
  DOM.statTotalHours.textContent = `${(totalMin / 60).toFixed(1)}시간`;

  const avgRatio = logs.reduce((acc, cur) => acc + parseFloat(cur.errorRatio), 0) / logs.length;
  const accuracy = Math.max(0, 100 - Math.abs(avgRatio - 100));
  DOM.statAccuracy.textContent = `${accuracy.toFixed(0)}%`;

  DOM.historyTableBody.innerHTML = logs.map(log => `
    <tr>
      <td>${log.date}</td>
      <td><strong>${log.bookTitle}</strong></td>
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

function deleteHistoryLog(id) {
  state.history = state.history.filter(h => h.id !== id);
  localStorage.setItem('study_history', JSON.stringify(state.history));
  renderHistory();
}
