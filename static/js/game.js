// game.js - وحدة إدارة المسابقة مع نظام الصعوبة

/**
 * تهيئة وحدة المسابقة
 */
async function initGameModule() {
    console.log('🎯 تهيئة وحدة المسابقة مع نظام الصعوبة...');
    return true;
}

/**
 * بدء اللعبة
 */
async function startGame() {
    if (window.gameState.isBusy) return;
    window.gameState.isBusy = true;

    try {
        console.log('🚀 بدء اللعبة مع نظام الصعوبة المتدرج...');
        const response = await fetch('/api/start_game', { method: 'POST' });
        const data = await response.json();

        if (!response.ok) throw new Error(data.error || 'فشل في بدء اللعبة');

        stopAllSounds();
        showScreen('gameScreen');
        resetGameState();

        // تشغيل الصوت ثم الأسئلة
        await playGameSounds();

        console.log("🎯 جلب السؤال الأول...");
        // ✅ تم استبدال استدعاء الدالة الخاطئة بالدالة الصحيحة
        await fetchAndDisplayQuestion(); 

    } catch (error) {
        console.error('❌ خطأ في بدء اللعبة:', error);
        handleError('فشل في بدء اللعبة. حاول مرة أخرى.');
        showScreen('introScreen');
    } finally {
        window.gameState.isBusy = false;
    }
}






async function playQuestionSound(questionNumber) {
    try {
        const sound = await playSound(`/static/sounds/q_${questionNumber}.mp3`);
        await sound.play();
        console.log(`✅ تشغيل صوت السؤال ${questionNumber}`);
    } catch (err) {
        console.error("❌ خطأ في تشغيل صوت السؤال:", err);
    }
}



/**
 * جلب وعرض السؤال الحالي مع معلومات الصعوبة
 */
async function fetchAndDisplayQuestion() {
    window.gameState.isBusy = true;
    const optionsContainer = safeEl('optionsContainer');
    const questionText = safeEl('questionText');
    const difficultyIndicator = safeEl('difficultyIndicator');
    
    if (optionsContainer) optionsContainer.innerHTML = '';
    if (questionText) questionText.textContent = 'جاري تحميل السؤال...';
    if (difficultyIndicator) difficultyIndicator.textContent = '';

    try {
        const resp = await fetch('/api/get_question');
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        const data = await resp.json();

        if (!data || !data.question_text) throw new Error('بيانات السؤال غير صالحة');

        // تحديث السؤال الحالي
        window.gameState.currentQuestion = data;
        window.gameState.currentLevel = data.level;
        
        // تحديث قائمة الجوائز وعرض الرصيد
        updatePrizeList(window.gameState.currentLevel);
        updateCurrentPrizeDisplay(); // ✅ تحديث عرض الرصيد الحالي

        // عرض السؤال والخيارات
        if (questionText) questionText.textContent = data.question_text;
        displayOptions(data.options || []);

        // عرض مؤشر الصعوبة
        if (difficultyIndicator) {
            const difficultyText = getDifficultyText(data.difficulty);
            difficultyIndicator.textContent = `مستوى الصعوبة: ${difficultyText}`;
            difficultyIndicator.className = `difficulty-indicator ${data.difficulty}`;
        }

        // تحديث معلومات التتبع
        updateGameStats(data);

        // تشغيل صوت السؤال
        await playQuestionSound();

    } catch (error) {
        console.error('❌ خطأ في جلب السؤال:', error);
        handleError('فشل في تحميل السؤال. حاول مرة أخرى.');
        if (questionText) questionText.textContent = 'فشل في تحميل السؤال. حاول مرة أخرى.';
    } finally {
        window.gameState.isBusy = false;
    }
}


/**
 * تحديث إحصائيات اللعبة
 */
function updateGameStats(data) {
    const statsElement = safeEl('gameStats');
    if (statsElement && data.used_questions_count !== undefined) {
        statsElement.innerHTML = `
            <div class="stat-item">
                <span class="stat-label">المستوى:</span>
                <span class="stat-value">${data.level}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">الصعوبة:</span>
                <span class="stat-value ${data.difficulty}">${getDifficultyText(data.difficulty)}</span>
            </div>
            <div class="stat-item">
                <span class="stat-label">الأسئلة المستخدمة:</span>
                <span class="stat-value">${data.used_questions_count}</span>
            </div>
        `;
    }
}

/**
 * معالجة استجابة الإجابة - تحديث الرصيد
 */
async function handleAnswerResponse(data, optionDiv) {
    console.log('🔄 معالجة استجابة الإجابة:', data);
    
    if (data.is_correct) {
        console.log('✅ الإجابة صحيحة');
        optionDiv.classList.add('correct');
        await playCorrectSound();
        
        if (data.won_million) {
            console.log('🎉 فوز بالمليون!');
            endGame('win', data.prize || 1000000);
            return;
        }

        // الانتقال للمستوى التالي
        window.gameState.currentLevel = data.next_level || window.gameState.currentLevel + 1;
        console.log(`📈 الانتقال للمستوى: ${window.gameState.currentLevel}`);
        
        // تفعيل الانسحاب بعد السؤال الخامس
        window.gameState.canWalkAway = (window.gameState.currentLevel > 5);
        console.log(`🎯 الانسحاب متاح: ${window.gameState.canWalkAway}`);
        
        updateLifelinesUI();
        updatePrizeList(window.gameState.currentLevel);
        updateCurrentPrizeDisplay(); // ✅ تحديث الرصيد بعد الإجابة الصحيحة

        // الانتقال للسؤال التالي بعد تأخير
        setTimeout(() => {
            console.log('🔄 جلب السؤال التالي...');
            fetchAndDisplayQuestion();
        }, 3000);
        
    } else {
        console.log('❌ الإجابة خاطئة');
        optionDiv.classList.add('wrong');
        await playWrongSound();
        
        // عرض الإجابة الصحيحة
        const correctAnswer = data.correct_answer;
        console.log('📝 الإجابة الصحيحة:', correctAnswer);
        
        if (correctAnswer) {
            const correctOption = document.querySelector(`.option[data-answer="${correctAnswer}"]`);
            if (correctOption) {
                correctOption.classList.add('correct');
                console.log('✅ تم تمييز الإجابة الصحيحة');
            }
        }
        
        // إنهاء اللعبة بعد تأخير
        setTimeout(() => {
            console.log('🎮 إنهاء اللعبة - خسارة');
            // استخدام الجائزة الآمنة من الخادم
            endGame('lose', data.final_prize || 0);
        }, 3000);
    }
}


/**
 * إعادة تعيين حالة اللعبة
 */
function resetGameState() {
    window.gameState.currentLifelines = { 
        fifty_fifty: true, 
        ask_audience: true, 
        phone_friend: true,
        walk_away: true 
    };
    window.gameState.canWalkAway = false;
    window.gameState.currentLevel = 1;
    
    updateLifelinesUI();
    updatePrizeList(1);
    updateCurrentPrizeDisplay(); // ✅ تحديث الرصيد ليكون 0 في البداية
    
    // إعادة تعيين الإحصائيات
    const statsElement = safeEl('gameStats');
    if (statsElement) statsElement.innerHTML = '';
    
    console.log('🎯 الحالة الابتدائية - الرصيد: 0');
}


/**
 * تشغيل أصوات بدء اللعبة
 */
/**
 * تشغيل أصوات بدء اللعبة
 */
/**
 * تشغيل أصوات بدء اللعبة
 */
async function playGameSounds() {
    if (!window.gameState.voiceEnabled) return;

    try {
        console.log('🔊 تشغيل صوت بدء المسابقة...');

        const startSound = await playSoundWithTimeout('/static/sounds/start_voice.mp3', 5000);

        if (!startSound) {
            console.warn('⚠️ لم يتم تحميل صوت البداية');
            return;
        }

        await startSound.play();

        await new Promise(resolve => {
            startSound.onended = () => {
                console.log('🏁 انتهى صوت البداية');
                resolve();
            };
        });

    } catch (error) {
        console.warn('⚠️ تخطي صوت بدء المسابقة:', error);
    }
}



/**
 * تشغيل صوت مع مهلة محددة (Timeout)
 * @param {string} url - رابط ملف الصوت
 * @param {number} timeout - المهلة بالميلي ثانية
 * @returns {Promise<HTMLAudioElement>}
 */
function playSoundWithTimeout(url, timeout = 5000) {
    return new Promise((resolve, reject) => {
        const audio = new Audio(url);
        let timer;

        // عند التحميل الكامل
        audio.addEventListener('canplaythrough', () => {
            clearTimeout(timer);
            resolve(audio);
        });

        // عند حدوث خطأ في التحميل
        audio.addEventListener('error', () => {
            clearTimeout(timer);
            reject(new Error(`تعذر تحميل الصوت: ${url}`));
        });

        // مهلة التحميل
        timer = setTimeout(() => {
            reject(new Error(`انتهت مهلة تحميل الصوت بعد ${timeout} مللي ثانية: ${url}`));
        }, timeout);
    });
}




// جعل الدوال متاحة globally
window.startGame = startGame;
window.fetchAndDisplayQuestion = fetchAndDisplayQuestion;



