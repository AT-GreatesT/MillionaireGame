// outro.js - وحدة نهاية اللعبة

/**
 * تهيئة وحدة الخاتمة
 */
async function initOutroModule() {
    console.log('🎉 تهيئة وحدة الخاتمة...');
    return true;
}

/**
 * إنهاء اللعبة
 */
// =======================
// دالة endGame المحسّنة
// =======================
function endGame(resultType, finalScore) {
    console.log('🎮 endGame:', resultType, finalScore);

    // تجهيز الرسالة والصوت
    let messageText = '';
    let soundToPlay = '';

    switch (resultType) {
        case 'win':
            messageText = '🎉 ألف مبروك! فزت بالمليون!';
            soundToPlay = '/static/sounds/win_million.mp3';
            break;
        case 'lose':
            messageText = finalScore > 0 ? `😢 للأسف إجابة خاطئة! رصيدك المضمون هو: ${finalScore} $` : '😢 للأسف إجابة خاطئة! انتهت المسابقة!';
            soundToPlay = '/static/sounds/lose_sound.mp3';
            break;
        case 'walkaway':
            messageText = `👏 قرار حكيم! انسحبت برصيد: ${finalScore} $`;
            soundToPlay = '/static/sounds/walk_away.mp3';
            break;
    }

    // إظهار شاشة النهاية وتعبئة النصوص
    showScreen('outroScreen');
    const outroTitle = safeEl('outroTitle');
    const finalPrizeAmount = safeEl('finalPrizeAmount');
    const resultBox = safeEl('resultMessageBox');
    const resultDetails = safeEl('resultDetails');

    if (outroTitle) outroTitle.textContent = messageText;
    if (finalPrizeAmount) finalPrizeAmount.textContent = `${finalScore} $`;
    if (resultBox) resultBox.style.display = 'block';
    if (resultDetails) {
        resultDetails.innerHTML = `
            <p>وصلت إلى المستوى: ${window.gameState.currentLevel}</p>
            <p>الرصيد النهائي: ${finalScore} $</p>
            <p>نقاط الأمان: ${getSafePrizeAmount()} $</p>
        `;
    }

    // متغيرات للتحكم بالصوت/مؤقت الرجوع
    let outroAudio = null;
    let autoReturnTimer = null;

    // تشغيل الصوت (إن وُجد ومفعل)
    if (window.gameState.voiceEnabled && soundToPlay) {
        try {
            outroAudio = new Audio(soundToPlay);
            // محاولة التشغيل (إن رفض المتصفح، سنتجاهل الخطأ)
            outroAudio.play().catch(err => {
                console.warn('⚠️ لم يتم تشغيل صوت الختام تلقائياً:', err);
            });
        } catch (e) {
            console.warn('⚠️ فشل إنشاء audio:', e);
            outroAudio = null;
        }
    }
    
    const outroScreen = safeEl('outroScreen');
    if (outroScreen) {
        outroScreen.style.display = 'flex';
        outroScreen.style.pointerEvents = 'auto';
    }

        // دوال مساعدة محلية
    const cleanupOutroUI = () => {
    try {
        const outro = safeEl('outroScreen');
        if (outro) {
        outro.style.display = 'none';
        outro.classList.remove('visible', 'active');
        outro.style.pointerEvents = 'none';
        outro.style.zIndex = '0';
        }

        const box = safeEl('resultMessageBox');
        if (box) box.style.display = 'none';

        document.querySelectorAll('.modal-overlay, .overlay, .fade-layer').forEach(el => el.remove());
        document.body.style.pointerEvents = 'auto';

        const resultDetails = safeEl('resultDetails');
        const outroTitle = safeEl('outroTitle');
        const finalPrizeAmount = safeEl('finalPrizeAmount');
        if (resultDetails) resultDetails.innerHTML = '';
        if (outroTitle) outroTitle.textContent = '';
        if (finalPrizeAmount) finalPrizeAmount.textContent = '';

        // لا تُغير DOM آخر أبداً هنا، فقط إعادة الحالة المنطقية الخفيفة
        if (typeof enableAllButtons === 'function') enableAllButtons();

        if (typeof bindStartButton === 'function') bindStartButton();




        console.log('✅ cleanupOutroUI done — overlays removed, buttons re-bound');
    } catch (e) {
        console.warn('cleanupOutroUI error', e);
    }

    // ✅ تأكد أن اللعبة ليست مشغولة بعد الآن
    window.gameState.isBusy = false;

    // ✅ أعد ربط زر البدء (دخول المسابقة)
    if (typeof bindStartButton === 'function') bindStartButton();


    };


    




    const enableAllButtons = () => {
        // إعادة تمكين كل الأزرار العامة (آمن وعملي)
        try {
            document.querySelectorAll('button').forEach(btn => {
                try {
                    btn.disabled = false;
                    btn.style.pointerEvents = 'auto';
                    btn.classList.remove('disabled');
                } catch (_) {}
            });
        } catch (e) { console.warn(e); }
    };

    const goToGameNow = () => {
        // إيقاف الصوت فوراً إذا كان يعمل
        if (outroAudio) {
            try { outroAudio.pause(); outroAudio.currentTime = 0; outroAudio.onended = null; } catch (_) {}
            outroAudio = null;
        }
        if (autoReturnTimer) { clearTimeout(autoReturnTimer); autoReturnTimer = null; }

        cleanupOutroUI();
        resetGame();
        
        // عرض شاشة اللعبة ثم محاولة بدء الجولة عملياً
        showScreen('gameScreen');

        // حاول استدعاء دوال بدء اللعبة الشائعة إن كانت موجودة
        if (typeof startGame === 'function') {
            startGame();
        } else if (typeof initGame === 'function') {
            initGame();
        } else if (typeof loadQuestion === 'function') {
            loadQuestion();
        } else if (typeof nextQuestion === 'function') {
            nextQuestion();
        } else {
            // كحل احتياطي: أعد تمكين عناصر واجهة السؤال (إن وُجدت)
            enableAllButtons();
            console.log('ℹ️ لم أجد دالة startGame/initGame/loadQuestion/nextQuestion — تم إعادة تمكين الأزرار فقط.');
        }
    };

    const goToMainNow = () => {
        if (outroAudio) {
            try { outroAudio.pause(); outroAudio.currentTime = 0; outroAudio.onended = null; } catch (_) {}
            outroAudio = null;
        }
        if (autoReturnTimer) { clearTimeout(autoReturnTimer); autoReturnTimer = null; }

        cleanupOutroUI();
        resetGame();

        // عرض الشاشة الرئيسية
        showScreen('introScreen');
        // إظهار القائمة الرئيسية إن توفر الدالة
        if (typeof showMainMenu === 'function') showMainMenu();

        enableAllButtons();
        // ✅ إعادة تفعيل زر "دخول المسابقة"
        const startButton = document.getElementById('startGameButton');
        if (startButton) {
            startButton.disabled = false; // فك التعطيل إن وُجد
            startButton.onclick = () => {
                console.log('🎯 تم الضغط على زر دخول المسابقة بعد العودة!');
                if (typeof startGame === 'function') startGame();
                else if (typeof initGame === 'function') initGame();
                else if (typeof nextQuestion === 'function') nextQuestion();
                else console.warn('⚠️ لم يتم العثور على دالة بدء اللعبة.');
            };
        }

    };



    // ==========================
    // 🎮 أزرار التحكم في شاشة النهاية
    // ==========================
    const playAgainBtn = safeEl('playAgainButton');
    const mainMenuBtn = safeEl('mainMenuButton');

    if (playAgainBtn) {
        playAgainBtn.style.display = 'inline-flex';
        playAgainBtn.disabled = false;
        playAgainBtn.onclick = async (e) => {
            e.preventDefault();
            console.log('🔁 إعادة اللعب الآن...');

            // أوقف الصوت إن وُجد
            if (outroAudio) {
                try { outroAudio.pause(); outroAudio.currentTime = 0; } catch (_) {}
                outroAudio = null;
            }
            if (autoReturnTimer) { clearTimeout(autoReturnTimer); autoReturnTimer = null; }

            // ✅ تنظيف شاشة النهاية بالكامل
            cleanupOutroUI();

            // ✅ انتظر نصف ثانية قبل البدء (للسماح للـ DOM أن يستقر)
            console.log('⏳ الانتظار قبل إعادة التشغيل...');
            await new Promise(resolve => setTimeout(resolve, 500));

            // ✅ إعادة ضبط الحالة
            if (typeof resetGame === 'function') resetGame();
            window.gameState.isBusy = false;

            // ✅ عرض شاشة اللعبة ثم تشغيل اللعبة فعلياً
            showScreen('gameScreen');
            console.log('🚀 إعادة تشغيل اللعبة الآن...');
            
            if (typeof startGame === 'function') {
                startGame();
            } else if (typeof initGame === 'function') {
                initGame();
            } else if (typeof loadQuestion === 'function') {
                loadQuestion();
            } else {
                console.warn('⚠️ لا توجد دالة startGame/initGame/loadQuestion');
            }
        };
    }


    if (mainMenuBtn) {
        mainMenuBtn.style.display = 'inline-flex';
        mainMenuBtn.disabled = false;
        mainMenuBtn.onclick = (e) => {
            e.preventDefault();
            console.log('🏠 العودة إلى القائمة الرئيسية...');

            // أوقف الصوت والمؤقت
            if (outroAudio) { try { outroAudio.pause(); outroAudio.currentTime = 0; } catch (_) {} }
            if (autoReturnTimer) { clearTimeout(autoReturnTimer); autoReturnTimer = null; }

            // ✅ الآن فقط نظف الشاشة وأعد الحالة الافتراضية
            cleanupOutroUI();
            resetGame();

            // أظهر شاشة المقدمة
            showScreen('introScreen');
            if (typeof showMainMenu === 'function') showMainMenu();
            enableAllButtons();
        };
    }

    // ==========================
    // 🕒 عودة تلقائية بعد انتهاء الصوت (اختياري)
    // ==========================
    if (outroAudio) {
        outroAudio.onended = () => {
            console.log('🎵 انتهى صوت النهاية');
            autoReturnTimer = setTimeout(() => {
                // إذا لم يضغط المستخدم أي زر خلال 3 ثوانٍ — ارجع تلقائيًا للقائمة
                if (document.getElementById('outroScreen').style.display !== 'none') {
                    console.log('⏳ عودة تلقائية إلى القائمة');
                    cleanupOutroUI();
                    resetGame();
                    showScreen('introScreen');
                    if (typeof showMainMenu === 'function') showMainMenu();
                    enableAllButtons();
                }
            }, 3000);
        };
    }


}




/**
 * الخروج من اللعبة
 */
async function exitGame() {
    if (window.gameState.isBusy) return;
    window.gameState.isBusy = true;

    console.log('🚪 محاولة الخروج من اللعبة...');
    
    // إيقاف جميع الأصوات
    stopAllSounds();
    
    // الانتقال لشاشة النهاية
    showScreen('outroScreen');
    
    const resultBox = safeEl('resultMessageBox');
    if (resultBox) resultBox.style.display = 'none';

    // تشغيل فيديو الخاتمة
    await playOutroVideo();

    // إغلاق اللعبة
    closeGame();
    
    window.gameState.isBusy = false;
}

/**
 * تشغيل فيديو الخاتمة
 */
async function playOutroVideo() {
    const outroVideo = safeEl('outroVideo');
    if (!outroVideo) return;

    try {
        console.log('🎥 تشغيل فيديو الخاتمة...');
        outroVideo.style.display = 'block';
        outroVideo.volume = 1.0;
        
        await new Promise((resolve) => {
            const videoTimer = setTimeout(() => {
                console.log('⏰ انتهى وقت الفيديو، جاري إغلاق اللعبة...');
                resolve();
            }, 10000);
            
            outroVideo.play().then(() => {
                console.log('✅ فيديو الخاتمة يعمل');
                outroVideo.addEventListener('ended', () => {
                    clearTimeout(videoTimer);
                    console.log('✅ انتهى فيديو الخاتمة');
                    resolve();
                });
            }).catch(error => {
                console.log('❌ فشل تشغيل فيديو الخاتمة:', error);
                clearTimeout(videoTimer);
                resolve();
            });
        });
        
    } catch (error) {
        console.log('⚠️ خطأ في فيديو الخاتمة:', error);
    } finally {
        outroVideo.style.display = 'none';
        outroVideo.pause();
        outroVideo.currentTime = 0;
    }
}

/**
 * إغلاق اللعبة
 */
function closeGame() {
    console.log('🔄 جاري إغلاق اللعبة...');
    
    setTimeout(() => {
        try {
            if (window.opener && !window.opener.closed) {
                window.close();
            } else {
                alert('يمكنك إغلاق النافذة يدوياً');
                showScreen('introScreen');
                resetGame();
            }
        } catch (error) {
            console.log('⚠️ لا يمكن إغلاق النافذة، العودة للقائمة الرئيسية');
            showScreen('introScreen');
            resetGame();
        }
    }, 2000);
}


