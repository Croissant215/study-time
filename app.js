/**
 * Study Time Estimator - Pure JavaScript Engine with Supabase Crowdsourced Cloud Integration
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
    url: '',
    anonKey: ''
  },


  supabaseClient: null,
  timer: {
    intervalId: null,
    seconds: 0,
    isPaused: false,
    sessionData: null
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
  btnOpenSupabaseConfig: document.getElementById('btn-open-supabase-config'),
  supabaseModal: document.getElementById('supabase-modal'),
  supabaseUrlInput: document.getElementById('supabase-url'),
  supabaseAnonKeyInput: document.getElementById('supabase-anon-key'),
  btnSaveSupabaseConfig: document.getElementById('btn-save-supabase-config'),
  supabaseStatusBadge: document.getElementById('supabase-status-badge'),
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
  errorRateSlider: document.getElementById('error-rate'),
  errorRateVal: document.getElementById('error-rate-val'),
  wrongReviewTimeInput: document.getElementById('wrong-review-time'),
  enablePomodoro: document.getElementById('enable-pomodoro'),
  skillMultVal: document.getElementById('skill-mult-val'),
  alphaValDisplay: document.getElementById('alpha-val'),
  predictedTotalTime: document.getElementById('predicted-total-time'),
  targetFinishClock: document.getElementById('target-finish-clock'),
  predictedSolveTime: document.getElementById('predicted-solve-time'),
  predictedReviewTime: document.getElementById('predicted-review-time'),
  predictedRestTime: document.getElementById('predicted-rest-time'),
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
  subjectLegend: document.getElementById('subject-legend')
};

// Initialize Application
document.addEventListener('DOMContentLoaded', () => {
  setupEventListeners();
  initSupabaseClient();
  checkOnboarding();
  renderPresetList();
  renderHistory();
  recalculatePrediction();
});

function initSupabaseClient() {
  if (state.supabaseConfig.url && state.supabaseConfig.anonKey && window.supabase) {
    try {
      state.supabaseClient = window.supabase.createClient(state.supabaseConfig.url, state.supabaseConfig.anonKey);
      DOM.supabaseStatusBadge.innerHTML = `<i class="fa-solid fa-cloud-check" style="color:var(--secondary)"></i> Supabase Cloud: 연결됨`;
    } catch (e) {
      DOM.supabaseStatusBadge.innerHTML = `<i class="fa-solid fa-cloud" style="color:var(--text-muted)"></i> Supabase Cloud: 연결 대기`;
    }
  } else {
    DOM.supabaseStatusBadge.innerHTML = `<i class="fa-solid fa-cloud" style="color:var(--text-muted)"></i> Supabase Cloud: 설정 대기 (클릭하여 연동)`;
  }
}



function openSupabaseModal() {
  DOM.supabaseUrlInput.value = state.supabaseConfig.url || '';
  DOM.supabaseAnonKeyInput.value = state.supabaseConfig.anonKey || '';
  DOM.supabaseModal.classList.remove('hidden');
}

function closeSupabaseModal() {
  DOM.supabaseModal.classList.add('hidden');
}

function saveSupabaseConfig() {
  const url = DOM.supabaseUrlInput.value.trim();
  const anonKey = DOM.supabaseAnonKeyInput.value.trim();

  state.supabaseConfig = { url, anonKey };
  localStorage.setItem('study_supabase_config', JSON.stringify(state.supabaseConfig));
  initSupabaseClient();
  closeSupabaseModal();
  alert('🌐 Supabase Cloud 연동 설정이 저장되었습니다!');
}

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

  DOM.btnOpenSupabaseConfig.addEventListener('click', openSupabaseModal);
  DOM.btnSaveSupabaseConfig.addEventListener('click', saveSupabaseConfig);

  DOM.btnSaveOnboarding.addEventListener('click', saveOnboarding);
  DOM.btnReOnboard.addEventListener('click', () => DOM.onboardingModal.classList.remove('hidden'));

  DOM.btnExportData.addEventListener('click', exportData);
  DOM.importFileInput.addEventListener('change', importData);

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
      fetchGlobalDifficultyFromSupabase(title);
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
  DOM.enablePomodoro.addEventListener('change', recalculatePrediction);

  DOM.btnStartTimer.addEventListener('click', startTimerSession);
  DOM.btnManualFinish.addEventListener('click', openManualFinishModal);
  DOM.btnPauseTimer.addEventListener('click', togglePauseTimer);
  DOM.btnStopTimer.addEventListener('click', stopTimerSession);

  DOM.btnSubmitFeedback.addEventListener('click', submitSessionFeedback);
  DOM.btnOpenAddPreset.addEventListener('click', () => DOM.presetModal.classList.remove('hidden'));
  DOM.btnSavePreset.addEventListener('click', saveNewPreset);
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

    // Calculate Crowdsourced Global Average Difficulty Weight
    const avgMinsPerProblem = data.reduce((acc, row) => acc + (row.actual_min / Math.max(1, row.problem_count)), 0) / data.length;
    const globalWeight = Math.max(0.8, Math.min(3.0, avgMinsPerProblem / 2.5));

    DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-globe" style="color:var(--primary)"></i> <strong>Supabase 집단지성 ${data.length}건 데이터 반영:</strong> [${bookTitle}] 글로벌 난이도 가중치 (${globalWeight.toFixed(1)}x)`;
    setSliderAndBadge(globalWeight);
    recalculatePrediction();
  } catch (err) {
    console.log('Supabase fetch passive bypass', err);
  }
}

// Data Export & Import
function exportData() {
  const backupObj = {
    version: '2.0',
    timestamp: new Date().toISOString(),
    profile: state.profile,
    presets: state.presets,
    subjectAlphas: state.subjectAlphas,
    history: state.history,
    supabaseConfig: state.supabaseConfig
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
      if (importedData.supabaseConfig) state.supabaseConfig = importedData.supabaseConfig;

      localStorage.setItem('study_user_profile', JSON.stringify(state.profile));
      localStorage.setItem('study_presets', JSON.stringify(state.presets));
      localStorage.setItem('study_subject_alphas', JSON.stringify(state.subjectAlphas));
      localStorage.setItem('study_history', JSON.stringify(state.history));
      localStorage.setItem('study_supabase_config', JSON.stringify(state.supabaseConfig));

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

// Built-in Smart AI Classifier
function runBuiltInSmartAIClassifier(bookTitle) {
  const lowerTitle = bookTitle.toLowerCase();

  const existingPreset = state.presets.find(p => p.title.toLowerCase() === lowerTitle);
  if (existingPreset) {
    DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--secondary)"></i> 저장된 교재 프리셋 [${existingPreset.title}] 적용`;
    setSliderAndBadge(existingPreset.difficulty_weight);
    recalculatePrediction();
    return;
  }

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

function getSubjectFromTitle(title) {
  const t = title.toLowerCase();
  if (t.includes('수학') || t.includes('쎈') || t.includes('마플') || t.includes('블랙라벨') || t.includes('개념원리')) return '수학';
  if (t.includes('영어') || t.includes('수특') || t.includes('어휘') || t.includes('보카')) return '영어';
  if (t.includes('국어') || t.includes('매3비') || t.includes('매3문') || t.includes('문학')) return '국어';
  if (t.includes('탐구') || t.includes('사탐') || t.includes('과탐') || t.includes('지구') || t.includes('생명')) return '탐구';
  return '일반';
}

function adjustCount(delta) {
  const current = parseInt(DOM.problemCountInput.value) || 0;
  const next = Math.max(1, Math.min(300, current + delta));
  DOM.problemCountInput.value = next;
  recalculatePrediction();
}

function calculatePrediction() {
  const problemCount = parseInt(DOM.problemCountInput.value) || 1;
  const difficultyWeight = parseFloat(DOM.difficultySlider.value) || 1.5;
  const errorRatePercent = parseFloat(DOM.errorRateSlider.value) || 20;
  const wrongReviewTimeMin = parseInt(DOM.wrongReviewTimeInput.value) || 5;
  const isPomodoro = DOM.enablePomodoro.checked;

  const bookTitle = DOM.bookTitleInput.value.trim() || '일반';
  const subject = getSubjectFromTitle(bookTitle);
  
  const skillMult = state.profile ? state.profile.skillMult : 1.0;
  const alpha = state.subjectAlphas[subject] || 1.0;

  const solveTimeRaw = problemCount * 2.5 * difficultyWeight * skillMult;
  const estimatedWrongCount = problemCount * (errorRatePercent / 100);
  const reviewTimeRaw = estimatedWrongCount * wrongReviewTimeMin;

  const pureStudyMin = Math.round((solveTimeRaw + reviewTimeRaw) * alpha);
  
  let restMin = 0;
  if (isPomodoro && pureStudyMin >= 50) {
    restMin = Math.floor(pureStudyMin / 50) * 10;
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

  DOM.predictedTotalTime.textContent = timeFormatted;
  DOM.predictedSolveTime.textContent = `${pred.solveMin}분`;
  DOM.predictedReviewTime.textContent = `${pred.reviewMin}분`;
  DOM.predictedRestTime.textContent = `${pred.restMin}분`;
  DOM.alphaValDisplay.textContent = pred.alpha.toFixed(2);
  
  if (state.profile) {
    DOM.skillMultVal.textContent = `${state.profile.skillMult}x`;
  }

  calculateTargetClock(pred.totalPredictedMin);
}

function calculateTargetClock(totalPredictedMin) {
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
  DOM.autoAnalysisTag.innerHTML = `<i class="fa-solid fa-circle-check" style="color:var(--secondary)"></i> 프리셋 [${preset.title}] 선택됨`;
  DOM.presetDropdown.classList.add('hidden');
  recalculatePrediction();
}

function startTimerSession() {
  const bookTitle = DOM.bookTitleInput.value.trim() || '미지정 교재';
  const pred = calculatePrediction();

  state.timer.sessionData = {
    bookTitle,
    subject: pred.subject,
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
    subject: pred.subject,
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

// Feedback Submit & Send to Supabase Cloud
async function submitSessionFeedback() {
  const actualMin = parseInt(DOM.actualTimeInput.value) || 1;
  const wrongCount = parseInt(DOM.actualWrongInput.value) || 0;
  const session = state.timer.sessionData;

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

  state.history.unshift(newLog);
  localStorage.setItem('study_history', JSON.stringify(state.history));

  // Send Anonymous Session Record to Supabase
  if (state.supabaseClient) {
    try {
      await state.supabaseClient.from('study_logs').insert([{
        book_title: session.bookTitle,
        subject,
        problem_count: session.problemCount,
        predicted_min: predictedMin,
        actual_min: actualMin,
        wrong_count: wrongCount
      }]);
      console.log('Successfully synced session to Supabase Crowdsourced Cloud!');
    } catch (e) {
      console.log('Supabase sync passive bypass', e);
    }
  }

  closeFeedbackModal();
  renderHistory();
  recalculatePrediction();

  alert(`학습 기록이 저장되었습니다!\n[${subject}] 과목 보정 알파(α): ${oldAlpha.toFixed(2)} -> ${newAlpha.toFixed(2)}`);
}

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
        <p><small style="color:var(--primary)">과목 보정 가중치 (α): ${(state.subjectAlphas[p.subject] || 1.0).toFixed(2)}</small></p>
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

function renderHistory() {
  const logs = state.history;
  DOM.statTotalCount.textContent = `${logs.length}회`;

  if (logs.length === 0) {
    DOM.historyTableBody.innerHTML = `<tr><td colspan="9" style="text-align:center; color:var(--text-muted)">저장된 공부 기록이 없습니다.</td></tr>`;
    DOM.statAccuracy.textContent = '100%';
    DOM.statTotalHours.textContent = '0시간';
    renderSubjectBreakdown({});
    return;
  }

  const totalMin = logs.reduce((acc, cur) => acc + cur.actualMin, 0);
  DOM.statTotalHours.textContent = `${(totalMin / 60).toFixed(1)}시간`;

  const avgRatio = logs.reduce((acc, cur) => acc + parseFloat(cur.errorRatio), 0) / logs.length;
  const accuracy = Math.max(0, 100 - Math.abs(avgRatio - 100));
  DOM.statAccuracy.textContent = `${accuracy.toFixed(0)}%`;

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
