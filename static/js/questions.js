// questions.js - وحدة إدارة الأسئلة

/**
 * تهيئة وحدة الأسئلة
 */
async function initQuestionsModule() {
    console.log('❓ تهيئة وحدة الأسئلة...');
    return true;
}

/**
 * عرض خيارات الإجابة
 */
function displayOptions(options = []) {
    const optionsContainer = safeEl('optionsContainer');
    if (!optionsContainer) return;
    
    optionsContainer.innerHTML = '';
    const displayLetters = ['أ', 'ب', 'ج', 'د'];

    options.forEach((optText, idx) => {
        const div = document.createElement('div');
        div.className = 'option answer-option';
        div.innerHTML = `<span class="option-letter">${displayLetters[idx]}</span> ${optText}`;
        div.dataset.answer = ['A', 'B', 'C', 'D'][idx];
        div.dataset.optionText = optText;

        div.addEventListener('click', () => {
            if (!window.gameState.isBusy) {
                selectAnswer(div, div.dataset.answer);
            } else {
                console.log('⏳ النظام مشغول، لا يمكن اختيار إجابة');
            }
        });

        optionsContainer.appendChild(div);
    });
}

/**
 * اختيار إجابة
 */
function selectAnswer(optionDiv, answerKey) {
    if (window.gameState.isBusy) return;
    
    console.log('🎯 اختيار الإجابة:', answerKey);
    window.gameState.isBusy = true;

    // إزالة التحديد من جميع الخيارات وإضافة التحديد للخيار الحالي
    document.querySelectorAll('.option').forEach(o => {
        o.classList.remove('selected');
    });
    optionDiv.classList.add('selected');

    console.log('⏳ انتظار 2 ثانية ثم إرسال الإجابة...');
    setTimeout(() => {
        submitAnswer(optionDiv, answerKey);
    }, 2000);
}

/**
 * إرسال الإجابة للتحقق
 */
async function submitAnswer(optionDiv, answer) {
    console.log('📨 جاري إرسال الإجابة:', answer);
    
    try {
        const payload = { answer: answer.toUpperCase() };
        console.log('📦 بيانات الإجابة المرسلة:', payload);
        
        const resp = await fetch('/api/check_answer', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        console.log('📩 حالة الاستجابة:', resp.status);
        
        if (!resp.ok) {
            throw new Error(`خطأ في الخادم: ${resp.status}`);
        }
        
        const data = await resp.json();
        console.log('📊 بيانات الاستجابة:', data);

        await handleAnswerResponse(data, optionDiv);

    } catch (error) {
        console.error('❌ خطأ في إرسال الإجابة:', error);
        handleError('فشل في إرسال الإجابة: ' + error.message);
        window.gameState.isBusy = false; // تحرير النظام في حالة الخطأ
    }
}

/**
 * معالجة استجابة الإجابة
 */
async function handleAnswerResponse(data, optionDiv) {
    console.log('🔄 معالجة استجابة الإجابة:', data);
    
    // إيقاف جميع الأزرار والخيارات فوراً
    window.gameState.isBusy = true; // للتأكد من عدم إرسال إجابات أخرى

    if (data.is_correct) {
        console.log('✅ الإجابة صحيحة');
        optionDiv.classList.add('correct');
        
        // 1. تشغيل الصوت والانتظار حتى ينتهي
        await playCorrectSound(); 
        
        if (data.won_million) {
            console.log('🎉 فوز بالمليون!');
            // 2. إنهاء اللعبة بالنجاح بعد تأخير بسيط لإظهار النتيجة
            setTimeout(() => {
                endGame('win', data.prize || 1000000);
            }, 1000); // تأخير بسيط
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

        // 3. الانتقال للسؤال التالي بعد تأخير (لإعطاء اللاعب وقت للاستيعاب)
        setTimeout(() => {
            console.log('🔄 جلب السؤال التالي...');
            fetchAndDisplayQuestion();
            window.gameState.isBusy = false; // تحرير النظام بعد استدعاء جلب السؤال
        }, 3000);
        
    } else {
        console.log('❌ الإجابة خاطئة');
        optionDiv.classList.add('wrong');
        
        // 1. تشغيل الصوت والانتظار حتى ينتهي
        await playWrongSound();
        
        // عرض الإجابة الصحيحة
        const correctAnswer = data.correct_answer;
        console.log('📝 الإجابة الصحيحة:', correctAnswer);
        
        if (correctAnswer) {
            // استخدام querySelector للحصول على الخيار الصحيح (يجب أن يكون دقيقاً)
            const correctOption = document.querySelector(`.option[data-answer="${correctAnswer}"]`);
            if (correctOption) {
                correctOption.classList.add('correct');
                console.log('✅ تم تمييز الإجابة الصحيحة');
            }
        }
        
        // 2. إنهاء اللعبة بعد تأخير
        setTimeout(() => {
            console.log('🎮 إنهاء اللعبة - خسارة');
            endGame('lose', data.final_prize || 0);
            window.gameState.isBusy = false; // تحرير النظام بعد إنهاء اللعبة
        }, 3000);
    }
}



/**
 * تشغيل صوت السؤال
 */
async function playQuestionSound() {
    if (!window.gameState.voiceEnabled) return;
    
    try {
        console.log(`🔊 تشغيل صوت السؤال ${window.gameState.currentLevel}`);
        await playSound(`/static/sounds/q_${window.gameState.currentLevel}.mp3`);
    } catch (error) {
        console.log(`⚠️ تخطي صوت السؤال ${window.gameState.currentLevel}`);
    }
}

/**
 * تشغيل صوت الإجابة الصحيحة
 */
/**
 * تشغيل صوت الإجابة الصحيحة والانتظار حتى انتهائه
 */
async function playCorrectSound() {
    if (!window.gameState.voiceEnabled) return;
    
    try {
        console.log('🔊 تشغيل صوت الإجابة الصحيحة');
        
        // 1. تحميل كائن الصوت (HTMLAudioElement)
        const correctSound = await playSoundWithTimeout('/static/sounds/correct.mp3', 3000);
        
        if (!correctSound) {
            console.warn('⚠️ لم يتم تحميل صوت الإجابة الصحيحة');
            return;
        }

        // 2. تشغيل الصوت
        await correctSound.play();

        // 3. الانتظار حتى انتهاء تشغيل الصوت
        await new Promise(resolve => {
            correctSound.onended = () => {
                console.log('🏁 انتهى صوت الإجابة الصحيحة');
                resolve();
            };
            // إضافة مهلة احتياطية في حالة عدم عمل onended
            setTimeout(resolve, 3500);
        });

    } catch (error) {
        // في حالة وجود خطأ في التحميل أو التشغيل
        console.log('⚠️ تخطي صوت الإجابة الصحيحة:', error.message);
    }
}

/**
 * تشغيل صوت الإجابة الخاطئة والانتظار حتى انتهائه
 */
async function playWrongSound() {
    if (!window.gameState.voiceEnabled) return;
    
    try {
        console.log('🔊 تشغيل صوت الإجابة الخاطئة');
        
        // 1. تحميل كائن الصوت (HTMLAudioElement)
        const wrongSound = await playSoundWithTimeout('/static/sounds/wrong.mp3', 3000);
        
        if (!wrongSound) {
            console.warn('⚠️ لم يتم تحميل صوت الإجابة الخاطئة');
            return;
        }

        // 2. تشغيل الصوت
        await wrongSound.play();
        
        // 3. الانتظار حتى انتهاء تشغيل الصوت
        await new Promise(resolve => {
            wrongSound.onended = () => {
                console.log('🏁 انتهى صوت الإجابة الخاطئة');
                resolve();
            };
            // إضافة مهلة احتياطية في حالة عدم عمل onended
            setTimeout(resolve, 3500); 
        });

    } catch (error) {
        // في حالة وجود خطأ في التحميل أو التشغيل
        console.log('⚠️ تخطي صوت الإجابة الخاطئة:', error.message);
    }
}




