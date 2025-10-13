// lifelines.js - وحدة وسائل المساعدة

/**
 * تهيئة وحدة وسائل المساعدة
 */
async function initLifelinesModule() {
    console.log('🆘 تهيئة وحدة وسائل المساعدة...');
    setupLifelineListeners();
    return true;
}

/**
 * إعداد مستمعي أزرار وسائل المساعدة
 */
function setupLifelineListeners() {
    console.log('🔍 إعداد مستمعي وسائل المساعدة...');
    const lifelineButtons = document.querySelectorAll('.lifeline');
    console.log(`✅ عدد أزرار المساعدة: ${lifelineButtons.length}`);
    
    lifelineButtons.forEach((btn, index) => {
        const type = btn.dataset.type;
        console.log(`🔘 زر ${index + 1}: ${type}`);
        
        btn.removeEventListener('click', useLifeline);
        btn.addEventListener('click', useLifeline);
        
        console.log(`✅ تم إعداد المستمع لزر: ${type}`);
    });
}

/**
 * استخدام وسيلة المساعدة
 */
async function useLifeline(event) {
    console.log('🔄 === بدء وسيلة المساعدة ===');
    
    event.preventDefault();
    event.stopPropagation();
    
    const lifelineBtn = event.currentTarget;
    const type = lifelineBtn.dataset.type;
    
    console.log('🎯 زر مضغوط:', type);
    console.log('📊 الحالة الحالية - isBusy:', window.gameState.isBusy);
    
    if (!type) {
        console.error('❌ نوع وسيلة المساعدة غير معرف');
        return;
    }
    
    // التحقق من الإتاحة
    if (!canUseLifeline(type)) return;
    
    // تطبيق التأثيرات البصرية
    lifelineBtn.style.opacity = '0.7';
    
    try {
        // تشغيل صوت المساعدة
        if (window.gameState.voiceEnabled && type !== 'walk_away') {
            await playLifelineSound();
        }

        // معالجة كل نوع من الوسائل
        await handleLifelineType(type);
        
    } catch (error) {
        console.error('❌ خطأ في استخدام المساعدة:', error);
        handleError('فشل في استخدام المساعدة: ' + error.message);
    } finally {
        lifelineBtn.style.opacity = '1';
        console.log('✅ انتهت وسيلة المساعدة');
    }
}

/**
 * التحقق من إمكانية استخدام الوسيلة
 */
function canUseLifeline(type) {
    // الانسحاب يعمل حتى لو النظام مشغول
    if (type !== 'walk_away' && window.gameState.isBusy) {
        console.log('⏳ النظام مشغول حالياً (باستثناء الانسحاب)');
        return false;
    }
    
    if (!window.gameState.currentLifelines[type]) {
        console.log('⚠️ هذه الوسيلة مستخدمة مسبقاً');
        alert('هذه الوسيلة مستخدمة مسبقاً!');
        return false;
    }
    
    return true;
}

/**
 * معالجة نوع الوسيلة
 */
async function handleLifelineType(type) {
    switch (type) {
        case 'walk_away':
            await playerWalkAway();
            break;
        case 'fifty_fifty':
            await useFiftyFifty();
            break;
        case 'ask_audience':
            await useAskAudience();
            break;
        case 'phone_friend':
            await usePhoneFriend();
            break;
        default:
            console.warn('⚠️ نوع وسيلة مساعدة غير معروف:', type);
    }
}

/**
 * استخدام وسيلة 50:50 - الإصدار العملي
 */
async function useFiftyFifty() {
    window.gameState.isBusy = true;
    
    try {
        console.log('🔄 استخدام وسيلة 50:50...');
        const response = await fetch('/api/use_lifeline', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'fifty_fifty' })
        });
        
        console.log('📩 استجابة 50:50:', response.status);
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        console.log('📊 بيانات 50:50:', data);

        if (data.status === 'success') {
            // إخفاء الخيارات الخاطئة
            hideWrongOptions(data.options_to_remove);
            window.gameState.currentLifelines.fifty_fifty = false;
            updateLifelinesUI();
            showLifelineModal('50:50', 'تم حذف إجابتين خاطئتين');
            console.log('✅ 50:50 تم بنجاح');
        } else {
            throw new Error(data.message || 'فشل في استخدام 50:50');
        }
        
    } catch (error) {
        console.error('❌ خطأ في استخدام 50:50:', error);
        handleError('فشل في استخدام 50:50: ' + error.message);
    } finally {
        window.gameState.isBusy = false;
    }
}

/**
 * إخفاء الخيارات الخاطئة لوسيلة 50:50 - الطريقة المباشرة
 */
function hideWrongOptions(optionsToRemove) {
    console.log('🎯 إخفاء الخيارات:', optionsToRemove);
    
    const options = document.querySelectorAll('.option');
    let hiddenCount = 0;
    
    options.forEach(option => {
        // الحصول على نص الخيار بدون الحرف
        const optionText = option.textContent.trim();
        // إزالة الحرف الأول (أ، ب، ج، د) والمسافات
        const cleanText = optionText.replace(/^[أبجد]\s*/, '').trim();
        
        console.log(`🔍 فحص الخيار: "${cleanText}"`);
        
        // التحقق مما إذا كان هذا الخيار يجب إخفاؤه
        const shouldHide = optionsToRemove.some(removeText => {
            return cleanText === removeText.trim();
        });
        
        if (shouldHide) {
            option.style.opacity = '0.3';
            option.style.pointerEvents = 'none';
            option.style.filter = 'grayscale(100%)';
            option.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            option.style.borderColor = '#666';
            hiddenCount++;
            console.log(`❌ إخفاء: ${cleanText}`);
        }
    });
    
    console.log(`✅ تم إخفاء ${hiddenCount} خيار من أصل ${optionsToRemove.length}`);
    
    // إذا لم يتم إخفاء أي خيار، استخدام طريقة الطوارئ
    if (hiddenCount === 0) {
        console.log('🔄 استخدام طريقة الطوارئ لإخفاء الخيارات...');
        emergencyHideOptions(optionsToRemove);
    }
}

/**
 * طريقة طوارئ لإخفاء الخيارات
 */
function emergencyHideOptions(optionsToRemove) {
    const options = document.querySelectorAll('.option');
    const correctAnswer = window.gameState.currentQuestion?.correct_answer;
    
    // إخفاء أول خيارين غير صحيحين
    let hiddenCount = 0;
    
    options.forEach(option => {
        if (hiddenCount >= 2) return;
        
        const optionText = option.textContent.trim();
        const cleanText = optionText.replace(/^[أبجد]\s*/, '').trim();
        
        // إذا لم يكن هذا هو الإجابة الصحيحة ولم يتم إخفاؤه بعد
        if (cleanText !== correctAnswer && hiddenCount < 2) {
            option.style.opacity = '0.3';
            option.style.pointerEvents = 'none';
            option.style.filter = 'grayscale(100%)';
            option.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
            option.style.borderColor = '#666';
            hiddenCount++;
            console.log(`🆘 إخفاء طارئ: ${cleanText}`);
        }
    });
    
    console.log(`🆘 تم إخفاء ${hiddenCount} خيار بطريقة الطوارئ`);
}




/**
 * استخدام وسيلة سؤال الجمهور
 */
async function useAskAudience() {
    window.gameState.isBusy = true;
    
    try {
        const response = await fetch('/api/use_lifeline', { // ✅ الرابط الصحيح
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'ask_audience' })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            window.gameState.currentLifelines.ask_audience = false;
            updateLifelinesUI();
            showAudienceResults(data.result);
        } else {
            throw new Error(data.message || 'فشل في استخدام سؤال الجمهور');
        }
        
    } catch (error) {
        console.error('❌ خطأ في استخدام سؤال الجمهور:', error);
        throw error;
    } finally {
        window.gameState.isBusy = false;
    }
}

/**
 * استخدام وسيلة الاتصال بصديق
 */
async function usePhoneFriend() {
    window.gameState.isBusy = true;
    
    try {
        const response = await fetch('/api/use_lifeline', { // ✅ الرابط الصحيح
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ type: 'phone_friend' })
        });
        
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        
        if (data.status === 'success') {
            window.gameState.currentLifelines.phone_friend = false;
            updateLifelinesUI();
            showPhoneFriendResult(data);
        } else {
            throw new Error(data.message || 'فشل في استخدام الاتصال بصديق');
        }
        
    } catch (error) {
        console.error('❌ خطأ في استخدام الاتصال بصديق:', error);
        throw error;
    } finally {
        window.gameState.isBusy = false;
    }
}

/**
 * استخدام وسيلة الانسحاب - الإصدار المصحح للرصيد
 */
async function playerWalkAway() {
    console.log('🚶 بدء عملية الانسحاب...');

    if (!window.gameState.canWalkAway) {
        alert('الانسحاب غير متاح حتى تجاوز السؤال الخامس!');
        return;
    }

    if (!window.gameState.currentLifelines.walk_away) {
        alert('لقد استخدمت وسيلة الانسحاب مسبقاً!');
        return;
    }

    // ✅ الرصيد الصحيح هو الرصيد المضمون فقط
    const currentPrize = getAccumulatedPrize();
    const confirmWalk = confirm(`هل أنت متأكد من الانسحاب؟ ستحصل على مبلغ ${currentPrize} $`);

    if (!confirmWalk) return;

    try {
        console.log('📨 إرسال طلب الانسحاب إلى الخادم...');
        const response = await fetch('/api/walk_away', { 
            method: 'POST',
            headers: {'Content-Type': 'application/json'}
        });

        if (!response.ok) throw new Error(`خطأ في الخادم: ${response.status}`);

        const data = await response.json();
        console.log('📊 بيانات الانسحاب:', data);

        if (data.status === 'Walked Away') {
            console.log('✅ الانسحاب نجح');
            window.gameState.currentLifelines.walk_away = false;
            updateLifelinesUI();

            // ✅ تشغيل صوت الانسحاب ثم شاشة النتيجة
            if (window.gameState.voiceEnabled) {
                try {
                    await playSoundWithTimeout('/static/sounds/walk_away.mp3', 5000);
                } catch (error) {
                    console.log('⚠️ تخطي صوت الانسحاب');
                }
            }

            // ✅ عرض شاشة النهاية
            endGame('walkaway', currentPrize);
        } else {
            throw new Error(data.message || 'فشل في الانسحاب');
        }
    } catch (error) {
        console.error('❌ خطأ في الانسحاب:', error);
        handleError('فشل في عملية الانسحاب: ' + error.message);
    }
}






/**
 * عرض نتائج تصويت الجمهور
 */
function showAudienceResults(audienceVotes) {
    let modalContent = '<div class="audience-results">';
    modalContent += '<h3>نتائج تصويت الجمهور</h3>';
    
    Object.entries(audienceVotes).forEach(([option, percentage]) => {
        modalContent += `
            <div class="result-bar-container">
                <div class="option-label">${option}</div>
                <div class="bar-container">
                    <div class="bar" style="width: ${percentage}%"></div>
                </div>
                <div class="percentage">${percentage}%</div>
            </div>
        `;
    });
    
    modalContent += '</div>';
    showLifelineModal('تصويت الجمهور', modalContent);
}

/**
 * عرض نتيجة الاتصال بالصديق
 */
function showPhoneFriendResult(data) {
    const modalContent = `
        <div class="phone-friend-result">
            <h3>اتصال بالصديق</h3>
            <p>${data.message}</p>
            <div class="friend-confidence">مستوى الثقة: ${data.confidence}</div>
        </div>
    `;
    showLifelineModal('اتصال بالصديق', modalContent);
}

/**
 * عرض نافذة وسيلة المساعدة
 */
function showLifelineModal(title, content) {
    const modal = safeEl('lifelineModal');
    const modalTitle = safeEl('modalTitle');
    const modalMessage = safeEl('modalMessage');
    
    if (modal && modalTitle && modalMessage) {
        modalTitle.textContent = title;
        modalMessage.innerHTML = content;
        modal.style.display = 'flex';
    }
}

/**
 * تشغيل صوت وسيلة المساعدة
 */
async function playLifelineSound() {
    try {
        console.log('🔊 تشغيل صوت المساعدة...');
        await playSoundWithTimeout('/static/sounds/lifeline.mp3', 3000);
    } catch (error) {
        console.log('⚠️ تخطي صوت المساعدة');
    }
}


