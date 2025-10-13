// script.js - الملف الرئيسي الذي ينظم كل الملفات
document.addEventListener('DOMContentLoaded', initApp);

// الثوابت العامة
const PRIZE_POINTS = [
    { level: 15, amount: "1,000,000", is_safe: false },
    { level: 14, amount: "500,000", is_safe: false },
    { level: 13, amount: "250,000", is_safe: false },
    { level: 12, amount: "125,000", is_safe: false },
    { level: 11, amount: "64,000", is_safe: false },
    { level: 10, amount: "32,000", is_safe: true },
    { level: 9, amount: "16,000", is_safe: false },
    { level: 8, amount: "8,000", is_safe: false },
    { level: 7, amount: "4,000", is_safe: false },
    { level: 6, amount: "2,000", is_safe: false },
    { level: 5, amount: "1,000", is_safe: true },
    { level: 4, amount: "500", is_safe: false },
    { level: 3, amount: "300", is_safe: false },
    { level: 2, amount: "200", is_safe: false },
    { level: 1, amount: "100", is_safe: false }
];

// المتغيرات العامة
let isFirstRun = true;
let musicEnabled = true;
let voiceEnabled = true;
let currentLevel = 1;
let currentQuestion = null;
let currentLifelines = { 
    fifty_fifty: true, 
    ask_audience: true, 
    phone_friend: true,
    walk_away: true 
};
let canWalkAway = false;
let isBusy = false;

/**
 * تهيئة التطبيق - نقطة البداية الرئيسية
 */
async function initApp() {
    try {
        console.log('🎮 بدء تهيئة التطبيق...');
        
        // تهيئة جميع الوحدات
        await initUtilsModule();
        await initIntroModule();
        await initGameModule();
        await initQuestionsModule();
        await initLifelinesModule();
        await initOutroModule();
        
        // إعداد واجهة المستخدم
        setupUI();
        
        // عرض الشاشة المناسبة
        if (isFirstRun) {
            showScreen('welcomeScreen');
        } else {
            showScreen('introScreen');
        }
        
        console.log('✅ تم تهيئة التطبيق بنجاح');
        
    } catch (error) {
        console.error('❌ فشل في تهيئة التطبيق:', error);
        handleError('فشل في تحميل التطبيق. يرجى تحديث الصفحة.');
    }
}

/**
 * إعداد واجهة المستخدم
 */
function setupUI() {
    setupPrizeList();
    setupEventListeners();
    updateLifelinesUI();
    updatePrizeList(currentLevel);
}

/**
 * إعداد قائمة الجوائز
 */
function setupPrizeList() {
    const prizeList = safeEl('prizeList');
    if (!prizeList) return;

    prizeList.innerHTML = '';
    PRIZE_POINTS.forEach(p => {
        const item = document.createElement('div');
        item.className = `prize-item ${p.is_safe ? 'safe' : ''}`;
        item.dataset.level = p.level;
        item.innerHTML = `
            <span class="prize-level">${p.level}</span>
            <span class="prize-amount">${p.amount} $</span>
            ${p.is_safe ? '<i class="fas fa-shield-alt safe-icon"></i>' : ''}
        `;
        prizeList.appendChild(item);
    });
}

/**
 * إعداد مستمعي الأحداث
 */
function setupEventListeners() {
    // الأزرار الرئيسية
    const startAppBtn = safeEl('startAppButton');
    const startBtn = safeEl('startButton');
    const rulesBtn = safeEl('rulesButton');
    const backToMenu = safeEl('backToMenu');
    const exitBtn = safeEl('exitGame');
    const musicToggle = safeEl('musicToggle');
    const voiceToggle = safeEl('voiceToggle');


    // إضافة مستمعين جدد
    const statsToggle = safeEl('statsToggle');
    const showStatsButton = safeEl('showStatsButton');

    if (statsToggle) statsToggle.addEventListener('click', showGameStats);
    if (showStatsButton) showStatsButton.addEventListener('click', showGameStats);
    if (startAppBtn) startAppBtn.addEventListener('click', handleFirstClick);
    if (startBtn) startBtn.addEventListener('click', startGame);
    if (rulesBtn) rulesBtn.addEventListener('click', () => showScreen('rulesScreen'));
    if (backToMenu) backToMenu.addEventListener('click', () => showScreen('introScreen'));
    if (exitBtn) exitBtn.addEventListener('click', exitGame);
    if (musicToggle) musicToggle.addEventListener('click', toggleMusic);
    if (voiceToggle) voiceToggle.addEventListener('click', toggleVoice);

    // زر إغلاق النافذة المنبثقة
    const closeModalButton = safeEl('closeModalButton');
    if (closeModalButton) {
        closeModalButton.addEventListener('click', hideLifelineModal);
    }
}

/**
 * إعادة تعيين اللعبة
 */
function resetGame() {
    isBusy = false;
    currentLevel = 1;
    currentQuestion = null;
    currentLifelines = { 
        fifty_fifty: true, 
        ask_audience: true, 
        phone_friend: true,
        walk_away: true 
    };
    canWalkAway = false;
    updateLifelinesUI();
    updatePrizeList(1);
}

function safeResetGame() {
  try {
    // أعد فقط المتغيرات المنطقية
    if (window.gameState) {
      window.gameState.currentLevel = 1;
      window.gameState.currentQuestionIndex = 0;
      window.gameState.isGameActive = false;
      window.gameState.usedQuestions = [];
    }
    // لا تلمس الـ DOM أو الـ event listeners هنا
    console.log('safeResetGame done');
  } catch(e) { console.warn(e); }
}



// تصدير المتغيرات والدوال للاستخدام في الملفات الأخرى
window.gameState = {
    PRIZE_POINTS,
    isFirstRun, musicEnabled, voiceEnabled,
    currentLevel, currentQuestion, currentLifelines,
    canWalkAway, isBusy,
    showScreen, safeEl, resetGame,
    updatePrizeList, updateLifelinesUI,
    handleError, stopAllSounds
};

// جعل الدوال الأساسية متاحة globally
window.showScreen = showScreen;
window.safeEl = safeEl;
window.handleError = handleError;
window.updatePrizeList = updatePrizeList;
window.updateLifelinesUI = updateLifelinesUI;

function bindStartButton() {
  ['startButton', 'startGameButton', 'startBtn'].forEach(id => {
    const btn = document.getElementById(id);
    if (!btn) return;
    // إزالة كل المستمعين القدامى بطريقة آمنة
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      console.log('▶️ start pressed (bound)');

      // إزالة أي overlays ممكنة
      document.querySelectorAll('.modal-overlay, .overlay, .fade-layer').forEach(el => el.remove());
      document.body.style.pointerEvents = 'auto';

      // إعادة ضبط الحالة المنطقية (آمنة) ثم بدء اللعبة
      if (typeof resetGame === 'function') {
        try { resetGame(); } catch(_) { console.warn('resetGame() failed'); }
      }

      showScreen('gameScreen');

      // استدعاء دالة بدء اللعبة الحقيقية الموجودة عندك
      if (typeof startGame === 'function') startGame();
      else if (typeof initGame === 'function') initGame();
      else if (typeof loadQuestion === 'function') loadQuestion();
      else if (typeof nextQuestion === 'function') nextQuestion();
      else {
        // كحل احتياطي: اطلب من السيرفر بدء جولة
        try {
          await fetch('/api/start_game', { method: 'POST' });
          // بعد رد السيرفر احصل على سؤال
          await fetch('/api/get_question');
        } catch (err) { console.warn('fallback start failed', err); }
      }
    });
  });
}

// شغّل الربط عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => bindStartButton());


