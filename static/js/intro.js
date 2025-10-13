/**
 * تهيئة وحدة المقدمة
 */
async function initIntroModule() {
    console.log('🎬 تهيئة وحدة المقدمة...');
    return true;
}

/**
 * التعامل مع النقرة الأولى - تشغيل التسلسل التمهيدي
 */
async function handleFirstClick() {
    if (!window.gameState.isFirstRun) return;

    console.log('🎬 بدء التسلسل التمهيدي...');
    const welcomeScreen = safeEl('welcomeScreen');
    const introScreen = safeEl('introScreen');
    const mainMenu = safeEl('mainMenu');

    if (welcomeScreen) welcomeScreen.style.display = 'none';
    if (introScreen) showScreen('introScreen');
    if (mainMenu) mainMenu.style.display = 'none';

    try {
        // 1. تشغيل صوت المقدمة أولاً
        if (window.gameState.voiceEnabled) {
            await playIntroSound();
        }

        // 2. محاولة تشغيل الفيديو
        const played = await playIntroVideo();

        // لو الفيديو اشتغل فعلاً ننتظر حتى ينتهي قبل المتابعة
        if (played) {
            console.log('🎥 انتهى تشغيل الفيديو بنجاح');
        } else {
            console.log('⚠️ تم تخطي الفيديو أو لم يُعرض');
        }

    } catch (error) {
        console.warn('⚠️ خطأ في التسلسل التمهيدي:', error);
    } finally {
        // 3. عرض القائمة الرئيسية دائمًا بعد الفيديو أو الفشل
        showMainMenu();
    }
}

/**
 * تشغيل صوت المقدمة
 */
async function playIntroSound() {
    try {
        console.log('🔊 تشغيل صوت المقدمة...');
        await playSoundWithTimeout('/static/sounds/intro_voice.mp3', 4000);
    } catch (error) {
        console.log('⚠️ تخطي صوت المقدمة');
    }
}

/**
 * تشغيل فيديو المقدمة - الإصدار المحسن النهائي
 */
async function playIntroVideo() {
    return new Promise((resolve) => {
        const introVideo = safeEl('introVideo');
        if (!introVideo) {
            console.log('❌ عنصر الفيديو غير موجود - تخطي');
            resolve(false);
            return;
        }

        console.log('🎥 محاولة تشغيل الفيديو...');

        // ✅ إعداد مظهر الفيديو
        introVideo.style.display = 'block';
        introVideo.style.visibility = 'visible';
        introVideo.style.opacity = '1';
        introVideo.style.zIndex = '999';

        // ✅ إعداد الخصائص قبل التشغيل
        introVideo.currentTime = 0;
        introVideo.muted = true;
        introVideo.playsInline = true;
        introVideo.autoplay = false;
        introVideo.volume = 1.0;

        // ✅ خلفية سوداء أثناء العرض
        const introScreen = safeEl('introScreen');
        if (introScreen) introScreen.style.backgroundColor = 'black';

        let playbackStarted = false;

        // مؤقت حماية في حال لم يتم التشغيل خلال 8 ثوانٍ
        const fallbackTimer = setTimeout(() => {
            if (!playbackStarted) {
                console.log('⏰ فشل تشغيل الفيديو خلال الوقت المحدد، تخطي...');
                cleanupVideo();
                resolve(false);
            }
        }, 8000);

        // ✅ دالة بدء التشغيل الفعلي
        const startVideo = () => {
            introVideo.play().then(() => {
                playbackStarted = true;
                console.log('✅ بدأ تشغيل الفيديو فعليًا');

                // بعد التشغيل بنجاح، أعد الصوت (بعد السماح)
                setTimeout(() => {
                    introVideo.muted = false;
                }, 300); // تأخير بسيط لتجنب رفض المتصفح

                introVideo.onended = () => {
                    console.log('🏁 انتهى الفيديو');
                    clearTimeout(fallbackTimer);
                    cleanupVideo();
                    resolve(true);
                };
            }).catch((err) => {
                console.warn('⚠️ لم يتم التشغيل التلقائي، بانتظار نقرة المستخدم:', err);
                // عند أول نقرة يتم التشغيل
                document.body.addEventListener('click', () => {
                    introVideo.muted = false;
                    introVideo.play();
                }, { once: true });
            });
        };

        // ✅ عند تحميل البيانات يبدأ التشغيل
        introVideo.addEventListener('canplay', startVideo, { once: true });
        introVideo.addEventListener('loadedmetadata', startVideo, { once: true });

        // ✅ في حال وجود خطأ
        introVideo.addEventListener('error', (error) => {
            console.warn('❌ خطأ في تحميل الفيديو:', error);
            clearTimeout(fallbackTimer);
            cleanupVideo();
            resolve(false);
        }, { once: true });

        // ✅ حمّل الفيديو الآن
        introVideo.load();
    });
}


/**
 * تنظيف الفيديو بعد التشغيل أو الفشل
 */
function cleanupVideo() {
    const introVideo = safeEl('introVideo');
    if (introVideo) {
        introVideo.pause();
        introVideo.currentTime = 0;
        introVideo.style.display = 'none';
        introVideo.style.opacity = '0';
        introVideo.style.visibility = 'hidden';

        // إزالة الأحداث القديمة
        const newVideo = introVideo.cloneNode(true);
        introVideo.parentNode.replaceChild(newVideo, introVideo);
    }
}

/**
 * إظهار القائمة الرئيسية
 */
function showMainMenu() {
    console.log('🏠 عرض القائمة الرئيسية...');
    const mainMenu = safeEl('mainMenu');
    if (mainMenu) mainMenu.style.display = 'flex';
    window.gameState.isFirstRun = false;
}


