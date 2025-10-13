// utils.js - الأدوات المساعدة والمشتركة مع دعم نظام الصعوبة

/**
 * تهيئة وحدة الأدوات
 */
async function initUtilsModule() {
    console.log('🛠️ تهيئة وحدة الأدوات مع دعم نظام الصعوبة...');
    return true;
}

/**
 * عرض شاشة معينة وإخفاء الآخرين
 */
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => {
    if (s.id === id) {
      s.style.display = 'flex';
      s.style.pointerEvents = 'auto';
      s.style.zIndex = '10';
      s.classList.add('active');
    } else {
      s.style.display = 'none';
      s.style.pointerEvents = 'none';
      s.style.zIndex = '0';
      s.classList.remove('active');
    }
  });

  // تأكيد أن الجسم يقبل النقرات
  document.body.style.pointerEvents = 'auto';
  window.currentScreen = id;
  console.log(`showScreen -> ${id}`);
}


/**
 * الحصول على عنصر بشكل آمن
 */
function safeEl(id) { 
    return document.getElementById(id) || null; 
}

/**
 * معالجة الأخطاء
 */
function handleError(message) {
    console.error('❌ خطأ:', message);
    alert(message);
}

/**
 * تشغيل صوت مع وقت انتظار
 */
function playSoundWithTimeout(soundPath, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(soundPath);
        audio.volume = 1.0;
        
        let soundPlayed = false;
        
        const playTimer = setTimeout(() => {
            if (!soundPlayed) {
                console.log('⏰ انتهى وقت الصوت، جاري التخطي...');
                audio.pause();
                resolve();
            }
        }, timeout);
        
        audio.addEventListener('canplaythrough', () => {
            audio.play().then(() => {
                soundPlayed = true;
                console.log('✅ تشغيل الصوت:', soundPath);
                
                audio.addEventListener('ended', () => {
                    clearTimeout(playTimer);
                    resolve();
                });
                
            }).catch(error => {
                clearTimeout(playTimer);
                reject(error);
            });
        });
        
        audio.addEventListener('error', (error) => {
            clearTimeout(playTimer);
            reject(error);
        });
        
        audio.src = soundPath;
    });
}

/**
 * تشغيل صوت
 */
function playSound(soundPath) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(soundPath);
        audio.volume = 1.0;
        
        audio.addEventListener('canplaythrough', () => {
            audio.play().then(resolve).catch(reject);
        });
        
        audio.addEventListener('error', reject);
        audio.src = soundPath;
        
        // timeout احتياطي
        setTimeout(resolve, 10000);
    });
}

/**
 * إيقاف جميع الأصوات
 */
function stopAllSounds() {
    // إيقاف جميع عناصر audio
    const audioElements = document.querySelectorAll('audio');
    audioElements.forEach(audio => {
        audio.pause();
        audio.currentTime = 0;
    });
    
    // إيقاف أي أصوات تم إنشاؤها ديناميكياً
    const dynamicAudios = document.querySelectorAll('audio[dynamic]');
    dynamicAudios.forEach(audio => {
        audio.pause();
        audio.remove();
    });
}


/**
 * تشغيل الصوت وإرجاع Promise تنتهي عند الانتهاء
 */
function playSoundWithPromise(src) {
    return new Promise((resolve, reject) => {
        try {
            const audio = new Audio(src);
            audio.addEventListener('ended', resolve, { once: true });
            audio.addEventListener('error', reject, { once: true });
            audio.play().catch(reject);
        } catch (err) {
            reject(err);
        }
    });
}

/**
 * الحصول على نص الصعوبة
 */
function getDifficultyText(difficulty) {
    const difficultyMap = {
        'easy': 'سهل',
        'medium': 'متوسط',
        'hard': 'صعب',
        'very_hard': 'صعب جداً',
        'ultimate': 'نهائي'
    };
    return difficultyMap[difficulty] || 'غير محدد';
}

/**
 * الحصول على لون الصعوبة
 */
function getDifficultyColor(difficulty) {
    const colors = {
        'easy': '#4CAF50',
        'medium': '#FF9800',
        'hard': '#F44336',
        'very_hard': '#9C27B0',
        'ultimate': '#FF4081'
    };
    return colors[difficulty] || '#757575';
}

/**
 * الحصول على مستوى الصعوبة للمستوى
 */
function getDifficultyForLevel(level) {
    const difficultyMap = {
        1: 'easy', 2: 'easy', 3: 'easy', 4: 'medium',
        5: 'medium', 6: 'medium', 7: 'medium', 8: 'hard',
        9: 'hard', 10: 'hard', 11: 'hard',
        12: 'very_hard', 13: 'very_hard', 14: 'ultimate',
        15: 'ultimate'
    };
    return difficultyMap[level] || 'easy';
}

/**
 * تبديل الموسيقى
 */
function toggleMusic() {
    window.gameState.musicEnabled = !window.gameState.musicEnabled;
    const icon = document.querySelector('#musicToggle i');
    if (icon) {
        if (window.gameState.musicEnabled) {
            icon.classList.remove('fa-volume-mute');
            icon.classList.add('fa-music');
            const gameMusic = safeEl('gameMusic');
            if (gameMusic) gameMusic.play().catch(() => {});
        } else {
            icon.classList.remove('fa-music');
            icon.classList.add('fa-volume-mute');
            const gameMusic = safeEl('gameMusic');
            if (gameMusic) gameMusic.pause();
        }
    }
}

/**
 * تبديل الصوت
 */
function toggleVoice() {
    window.gameState.voiceEnabled = !window.gameState.voiceEnabled;
    const icon = document.querySelector('#voiceToggle i');
    if (icon) {
        if (window.gameState.voiceEnabled) {
            icon.classList.remove('fa-microphone-slash');
            icon.classList.add('fa-microphone');
        } else {
            icon.classList.remove('fa-microphone');
            icon.classList.add('fa-microphone-slash');
        }
    }
}

/**
 * تحديث قائمة الجوائز مع الصعوبة
 */
function updatePrizeList(level) {
    const prizeList = safeEl('prizeList');
    if (!prizeList) return;
    
    prizeList.querySelectorAll('.prize-item').forEach(item => {
        const itemLevel = parseInt(item.dataset.level);
        item.classList.remove('current', 'reached');
        
        if (itemLevel === level) {
            item.classList.add('current');
            
            // إضافة مؤشر الصعوبة
            const difficulty = getDifficultyForLevel(level);
            const difficultyText = getDifficultyText(difficulty);
            const difficultyColor = getDifficultyColor(difficulty);
            
            let difficultyBadge = item.querySelector('.difficulty-badge');
            if (!difficultyBadge) {
                difficultyBadge = document.createElement('span');
                difficultyBadge.className = 'difficulty-badge';
                item.appendChild(difficultyBadge);
            }
            
            difficultyBadge.textContent = difficultyText;
            difficultyBadge.style.backgroundColor = difficultyColor;
        } else if (itemLevel < level) {
            item.classList.add('reached');
        }
    });
}

/**
 * تحديث واجهة وسائل المساعدة
 */
function updateLifelinesUI() {
    // تحديث أزرار وسائل المساعدة
    document.querySelectorAll('.lifeline').forEach(btn => {
        const type = btn.dataset.type;
        if (type && window.gameState.currentLifelines[type] === false) {
            btn.classList.add('used');
        } else {
            btn.classList.remove('used');
        }
    });

    // تحديث زر الانسحاب
    const walkAwayButton = safeEl('walkAway');
    if (walkAwayButton) {
        if (window.gameState.canWalkAway && window.gameState.currentLifelines.walk_away) {
            walkAwayButton.classList.remove('disabled');
            console.log('✅ زر الانسحاب مفعل');
        } else {
            walkAwayButton.classList.add('disabled');
            console.log('❌ زر الانسحاب معطل');
        }
    }
}




/**
 * الحصول على قيمة الجائزة الحالية
 */
function getCurrentPrizeValue() {
    const currentPrize = window.gameState.PRIZE_POINTS.find(
        p => p.level === window.gameState.currentLevel
    );
    return currentPrize ? currentPrize.amount : '0';
}

/**
 * الحصول على الرصيد المتراكم حتى الآن (للانسحاب)
 */
/**
 * 💰 الحصول على الرصيد المتراكم حتى الآن (للانسحاب)
 * يعتمد على آخر سؤال تم تجاوزه بنجاح
 */
function getAccumulatedPrize() {
    const currentLevel = window.gameState.currentLevel;
    const prizePoints = window.gameState.PRIZE_POINTS || [];

    // إذا لم يجب على أي سؤال بعد
    if (currentLevel <= 1) return 0;

    // نأخذ آخر جائزة تم الفوز بها فعليًا (السؤال السابق)
    const lastPassedLevel = currentLevel - 1;
    const prizeData = prizePoints.find(p => p.level === lastPassedLevel);

    if (prizeData) {
        console.log(`💰 آخر جائزة مكتسبة: ${prizeData.amount} $ عند المستوى ${lastPassedLevel}`);
        return prizeData.amount;
    }

    console.warn('⚠️ لم يتم العثور على جائزة للمستوى السابق، إرجاع 0');
    return 0;
}



/**
 * تحديث عرض الجائزة الحالية
 */
function updateCurrentPrizeDisplay() {
    const el = safeEl('currentPrizeAmount');
    if (!el) return;

    if (window.gameState.currentLevel === 1) {
        el.textContent = '0 $';
        console.log('🎯 بداية اللعبة - الرصيد: 0');
    } else {
        const prize = getCurrentPrizeValue();
        el.textContent = `${prize} $`;
        console.log(`🎯 الجائزة الحالية للمستوى ${window.gameState.currentLevel}: ${prize}`);
    }
}


/**
 * الحصول على نقاط الأمان الحالية
 */
function getSafePrizeAmount() {
    const lvl = window.gameState.currentLevel;
    if (lvl <= 5) return 0;
    if (lvl <= 10) return 1000;
    return 32000;
}




/**
 * إخفاء النافذة المنبثقة لوسائل المساعدة
 */
function hideLifelineModal() {
    const modal = safeEl('lifelineModal');
    if (modal) modal.style.display = 'none';
    window.gameState.isBusy = false;
}


/**
 * عرض إحصائيات المسابقة
 */
function showGameStats() {
    fetch('/api/question_stats')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                let statsContent = `
                    <div class="stats-grid">
                        <div class="stat-item">
                            <span>إجمالي الأسئلة</span>
                            <span class="stat-value">${data.statistics.total}</span>
                        </div>
                        <div class="stat-item">
                            <span>الأسئلة السهلة</span>
                            <span class="stat-value">${data.statistics.easy}</span>
                        </div>
                        <div class="stat-item">
                            <span>الأسئلة المتوسطة</span>
                            <span class="stat-value">${data.statistics.medium}</span>
                        </div>
                        <div class="stat-item">
                            <span>الأسئلة الصعبة</span>
                            <span class="stat-value">${data.statistics.hard}</span>
                        </div>
                        <div class="stat-item">
                            <span>الأسئلة الصعبة جداً</span>
                            <span class="stat-value">${data.statistics.very_hard}</span>
                        </div>
                        <div class="stat-item">
                            <span>الأسئلة النهائية</span>
                            <span class="stat-value">${data.statistics.ultimate}</span>
                        </div>
                    </div>
                `;
                
                showModal('إحصائيات المسابقة', statsContent, 'statsModal');
            }
        })
        .catch(error => {
            console.error('❌ خطأ في جلب الإحصائيات:', error);
            handleError('فشل في تحميل الإحصائيات');
        });
}

/**
 * عرض نافذة عامة
 */
function showModal(title, content, modalId = 'lifelineModal') {
    const modal = safeEl(modalId);
    const modalTitle = safeEl('modalTitle');
    const modalMessage = safeEl('modalMessage');
    
    if (modal && modalTitle && modalMessage) {
        modalTitle.textContent = title;
        modalMessage.innerHTML = content;
        modal.style.display = 'flex';
    }
}

/**
 * إغلاق النوافذ المنبثقة
 */
function closeModal(modalId = 'lifelineModal') {
    const modal = safeEl(modalId);
    if (modal) modal.style.display = 'none';
    window.gameState.isBusy = false;
}










