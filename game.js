// Game levels configuration
const levels = [
    {
        id: 1,
        title: "ด่านที่ 1: ยุทธหัตถี (ศึกช้างศึก)",
        originalSrc: "assets/original_1.png",
        gameSrc: "assets/game_1.png",
        answerSrc: "assets/answer_1.png",
        differences: [
            { "x": 59.3, "y": 19.6, "r": 4.5 },
            { "x": 68.0, "y": 23.4, "r": 4.5 },
            { "x": 81.6, "y": 22.5, "r": 4.5 },
            { "x": 93.8, "y": 27.5, "r": 4.5 },
            { "x": 47.8, "y": 65.9, "r": 4.5 },
            { "x": 78.8, "y": 65.8, "r": 4.5 },
            { "x": 71.3, "y": 74.9, "r": 4.5 }
        ]
    },
    {
        id: 2,
        title: "ด่านที่ 2: วิถีชีวิตกลางแม่น้ำป่า",
        originalSrc: "assets/original_2.png",
        gameSrc: "assets/game_2.png",
        answerSrc: "assets/answer_2.png",
        differences: [
            { "x": 7.3, "y": 92.6, "r": 6.8 },
            { "x": 8.3, "y": 78.2, "r": 6.5 },
            { "x": 16.6, "y": 61.3, "r": 7.9 },
            { "x": 39.3, "y": 40.4, "r": 7.2 },
            { "x": 64.1, "y": 87.9, "r": 6.8 },
            { "x": 68.1, "y": 74.1, "r": 4.5 }
        ]
    }
];

const STORAGE_KEY = 'spotDiff_customLevels';

// ปรับปรุงกลไกการโหลดด่านสร้างเองจาก IndexedDB (แทนที่ IIFE localStorage เดิม)
function mergeCustomLevels() {
    return new Promise((resolve) => {
        const request = indexedDB.open('SpotDiffDB', 1);

        request.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains('levelsStore')) {
                db.createObjectStore('levelsStore');
            }
        };

        request.onsuccess = (e) => {
            const db = e.target.result;
            const transaction = db.transaction(['levelsStore'], 'readonly');
            const store = transaction.objectStore('levelsStore');
            const getRequest = store.get(STORAGE_KEY);

            getRequest.onsuccess = (event) => {
                const custom = event.target.result || [];
                custom.forEach((lv) => {
                    // ตรวจสอบว่ายังไม่มีด่าน id นี้ในระบบเพื่อป้องกันการ push ซ้ำ
                    if (!levels.some(existing => existing.id === lv.id)) {
                        levels.push({
                            id: lv.id,
                            title: lv.title,
                            originalSrc: lv.originalSrc,
                            gameSrc: lv.gameSrc,
                            answerSrc: lv.answerSrc || lv.gameSrc,
                            differences: lv.differences,
                            isCustom: true
                        });
                    }
                });
                resolve();
            };

            getRequest.onerror = () => {
                console.warn('Could not read custom levels from IndexedDB store');
                resolve();
            };
        };

        request.onerror = () => {
            console.warn('Could not open IndexedDB SpotDiffDB');
            resolve();
        };
    });
}

// Game state
let currentLevelIdx = 0;
let score = 0;
let levelScore = 0;
let timerInterval = null;
let timeRemaining = 60; // 1 minute per level
let totalTimeRemaining = 0; // accumulated remaining time
let foundDifferencesList = [];
let devMode = false;
let devCoords = [];
let isTransitioning = false;
let isShowingReveal = false;

// DOM Elements
const startScreen = document.getElementById('start-screen');
const playingScreen = document.getElementById('playing-screen');
const endScreen = document.getElementById('end-screen');

const startBtn = document.getElementById('start-btn');
const skipBtn = document.getElementById('skip-btn');
const restartBtn = document.getElementById('restart-btn');

const levelTitle = document.getElementById('level-title');
const foundCountEl = document.getElementById('found-count');
const totalCountEl = document.getElementById('total-count');
const timerDisplay = document.getElementById('timer-display');

const imgOriginal = document.getElementById('img-original');
const imgGame = document.getElementById('img-game');
const interactiveWrapper = document.getElementById('interactive-wrapper');
const circlesLayer = document.getElementById('circles-layer');
const feedbackLayer = document.getElementById('feedback-layer');

imgOriginal.onerror = () => {
    alert("ไม่สามารถโหลดภาพต้นฉบับได้ กรุณาลองรีโหลดหน้าเว็บอีกครั้ง");
};
imgGame.onerror = () => {
    alert("ไม่สามารถโหลดภาพสำหรับจับผิดได้ กรุณาลองรีโหลดหน้าเว็บอีกครั้ง");
};

// Dev panel elements
const devPanel = document.getElementById('dev-panel');
const coordsLog = document.getElementById('coords-log');
const clearDevBtn = document.getElementById('clear-dev-btn');

// Initialize Developer Mode from URL query parameter
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('dev') === 'true') {
    devMode = true;
    devPanel.classList.remove('hidden-panel');
}

// Screen Transition Helper
function showScreen(screenId) {
    [startScreen, playingScreen, endScreen].forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function playVictoryEffects() {
    startConfetti();
}

function stopVictoryEffects() {
    stopConfetti();
}

// ============================================================
// CONFETTI PARTICLE ENGINE (Canvas-based celebration effect)
// ============================================================
const confettiCanvas = document.getElementById('confetti-canvas');
const confettiCtx = confettiCanvas ? confettiCanvas.getContext('2d') : null;
let confettiActive = false;
let confettiParticles = [];
let confettiAnimFrame = null;
const confettiColors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444', '#f97316'];

function resizeConfettiCanvas() {
    if (!confettiCanvas) return;
    confettiCanvas.width = window.innerWidth;
    confettiCanvas.height = window.innerHeight;
}
window.addEventListener('resize', resizeConfettiCanvas);

class ConfettiParticle {
    constructor() { this.reset(true); }
    reset(fromTop = false) {
        this.x = Math.random() * (confettiCanvas ? confettiCanvas.width : window.innerWidth);
        this.y = fromTop ? (Math.random() * -confettiCanvas.height - 20) : -20;
        this.size = Math.random() * 8 + 6;
        this.color = confettiColors[Math.floor(Math.random() * confettiColors.length)];
        this.speedX = Math.random() * 2 - 1;
        this.speedY = Math.random() * 3 + 2;
        this.rotation = Math.random() * 360;
        this.rotationSpeed = Math.random() * 4 - 2;
    }
    update() {
        this.y += this.speedY;
        this.x += this.speedX;
        this.rotation += this.rotationSpeed;
        if (this.y > (confettiCanvas ? confettiCanvas.height : window.innerHeight) + 20) {
            this.reset(false);
        }
    }
    draw() {
        if (!confettiCtx) return;
        confettiCtx.save();
        confettiCtx.translate(this.x, this.y);
        confettiCtx.rotate(this.rotation * Math.PI / 180);
        confettiCtx.fillStyle = this.color;
        confettiCtx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
        confettiCtx.restore();
    }
}

function startConfetti() {
    if (!confettiCanvas || !confettiCtx) return;
    resizeConfettiCanvas();
    confettiActive = true;
    confettiParticles = [];
    for (let i = 0; i < 100; i++) {
        confettiParticles.push(new ConfettiParticle());
    }
    animateConfetti();
}

function stopConfetti() {
    confettiActive = false;
    if (confettiAnimFrame) {
        cancelAnimationFrame(confettiAnimFrame);
        confettiAnimFrame = null;
    }
    if (confettiCtx && confettiCanvas) {
        confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    }
}

function animateConfetti() {
    if (!confettiActive || !confettiCtx) return;
    confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
    confettiParticles.forEach(p => { p.update(); p.draw(); });
    confettiAnimFrame = requestAnimationFrame(animateConfetti);
}
// ============================================================
// ANSWER REVEAL STATE
// ============================================================
function revealAnswerState(isSkipped = false) {
    isShowingReveal = true;
    clearInterval(timerInterval);
    timerInterval = null;

    // Accumulate time bonus if player wasn't skipped/timed out
    if (!isSkipped) {
        totalTimeRemaining += timeRemaining;
    }

    // Play victory celebration
    playVictoryEffects();

    // Clear user overlays (red circles, miss markers) to show clean answer
    circlesLayer.innerHTML = '';

    // Swap right image to the answer key image
    const currentLevel = levels[currentLevelIdx];
    imgGame.src = currentLevel.answerSrc;
    imgGame.onerror = () => { console.warn(`Could not load answer image: ${currentLevel.answerSrc}`); };

    // Update heading to green "completed" text
    levelTitle.innerHTML = `🎉 ด่านที่ ${currentLevel.id} เสร็จสิ้น (เฉลยจุดต่าง)`;
    levelTitle.style.color = 'var(--correct-color, #10b981)';

    // Update skip button to "Continue" action
    const isLastLevel = (currentLevelIdx + 1 >= levels.length);
    skipBtn.textContent = isLastLevel ? 'ดูผลลัพธ์เกม ➤' : 'ไปด่านถัดไป (Next Level) ➤';
    skipBtn.classList.add('reveal-continue-btn');
}

function renderStartScreenPreviews() {
    const previewsContainer = document.getElementById('level-previews');
    if (!previewsContainer) return;
    
    previewsContainer.innerHTML = levels.map((lv, idx) => {
        const isCustom = lv.isCustom ? '<span class="lvl-custom-badge">ด่านที่สร้างเอง</span>' : '';
        return `
            <div class="lvl-preview-card" style="cursor: default;">
                <div class="lvl-number">ด่านที่ ${idx + 1}</div>
                <div class="lvl-name">${lv.title || `ด่านที่ ${idx + 1}`}</div>
                <span class="lvl-badge">${lv.differences.length} จุดต่าง</span>
                ${isCustom}
            </div>
        `;
    }).join('');
}

// Reset and show start screen
function initGame() {
    currentLevelIdx = 0;
    score = 0;
    totalTimeRemaining = 0;
    if (timerInterval) clearInterval(timerInterval);
    renderStartScreenPreviews();
    showScreen('start-screen');
}

// Start a specific level
function startLevel(levelIdx) {
    isTransitioning = false;
    isShowingReveal = false;
    currentLevelIdx = levelIdx;
    levelScore = 0;
    foundDifferencesList = [];
    timeRemaining = 60;

    // Reset skip button to normal state
    skipBtn.textContent = 'ข้ามด่านนี้ ➤';
    skipBtn.classList.remove('reveal-continue-btn');
    levelTitle.style.color = '';

    // Stop any celebration from previous level
    stopVictoryEffects();


    const level = levels[currentLevelIdx];
    levelTitle.textContent = level.title;
    foundCountEl.textContent = "0";
    totalCountEl.textContent = level.differences.length.toString();

    imgOriginal.src = level.originalSrc;
    imgGame.src = level.gameSrc;
    imgOriginal.alt = `ภาพถ่ายต้นฉบับสำหรับ${level.title}`;
    imgGame.alt = `ภาพจับผิดจุดต่างสำหรับ${level.title}`;

    circlesLayer.innerHTML = '';
    feedbackLayer.innerHTML = '';

    updateTimerDisplay();

    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(updateTimer, 1000);

    showScreen('playing-screen');
}

// Timer Tick function
function updateTimer() {
    timeRemaining--;
    updateTimerDisplay();

    if (timeRemaining <= 0) {
        clearInterval(timerInterval);
        timerInterval = null;
        revealAnswerState(true); // Treat timeout as skipped
    }
}

// Update countdown display
function updateTimerDisplay() {
    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;
    timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    const timerContainer = document.querySelector('.timer-container');
    if (timeRemaining <= 30) {
        timerContainer.classList.add('warning');
    } else {
        timerContainer.classList.remove('warning');
    }
}

// Click and keypress handler
function handleGameClick(e) {
    if (isTransitioning) return;
    if (isShowingReveal) return; // Don't handle clicks on the answer image
    const rect = imgGame.getBoundingClientRect();
    if (!rect.width || !rect.height) {
        console.warn("Image dimensions are 0. Image might not be loaded yet.");
        return;
    }
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    const percentX = (clickX / rect.width) * 100;
    const percentY = (clickY / rect.height) * 100;

    if (devMode) {
        logDevCoordinate(percentX, percentY);
        drawDevCircle(percentX, percentY);
        return;
    }

    const currentLevel = levels[currentLevelIdx];
    let matchedIdx = -1;

    for (let i = 0; i < currentLevel.differences.length; i++) {
        if (foundDifferencesList.includes(i)) continue;

        const diff = currentLevel.differences[i];
        const distance = Math.sqrt(Math.pow(percentX - diff.x, 2) + Math.pow(percentY - diff.y, 2));

        if (distance <= diff.r) {
            matchedIdx = i;
            break;
        }
    }

    if (matchedIdx !== -1) {
        foundDifferencesList.push(matchedIdx);
        levelScore++;
        score++;
        foundCountEl.textContent = levelScore.toString();

        const diff = currentLevel.differences[matchedIdx];
        drawPersistentCircle(diff.x, diff.y, diff.r);

        if (levelScore >= currentLevel.differences.length) {
            isTransitioning = true;
            setTimeout(() => {
                isTransitioning = false;
                revealAnswerState(false);
            }, 800);
        }
    } else {
        drawMissIndicator(percentX, percentY);
        triggerShakeEffect();
    }
}

// Draw red difference circle using percentages
function drawPersistentCircle(xPercent, yPercent, rPercent) {
    const circle = document.createElement('div');
    circle.className = 'diff-circle';
    circle.style.left = `${xPercent}%`;
    circle.style.top = `${yPercent}%`;
    circle.style.width = `${rPercent * 2}%`;
    circle.style.height = 'auto';
    circlesLayer.appendChild(circle);
}

// Draw temporary red 'X' miss indicator
function drawMissIndicator(xPercent, yPercent) {
    const indicator = document.createElement('div');
    indicator.className = 'miss-indicator';
    indicator.style.left = `${xPercent}%`;
    indicator.style.top = `${yPercent}%`;
    feedbackLayer.appendChild(indicator);

    setTimeout(() => {
        indicator.remove();
    }, 800);
}

// Shake container on incorrect click
function triggerShakeEffect() {
    interactiveWrapper.classList.add('shake-effect');
    setTimeout(() => {
        interactiveWrapper.classList.remove('shake-effect');
    }, 400);
}

// Briefly flash yellow hint circles on all unfound differences
function showHintCircles() {
    const currentLevel = levels[currentLevelIdx];
    const hints = [];
    currentLevel.differences.forEach((diff, i) => {
        if (foundDifferencesList.includes(i)) return; // skip already found
        const hint = document.createElement('div');
        hint.className = 'hint-circle';
        hint.style.left = `${diff.x}%`;
        hint.style.top = `${diff.y}%`;
        hint.style.width = `${diff.r * 2}%`;
        hint.style.height = 'auto';
        circlesLayer.appendChild(hint);
        hints.push(hint);
    });
    // Remove all hint circles after 1.2 seconds
    setTimeout(() => {
        hints.forEach(h => h.remove());
    }, 1200);
}

// End Game logic
function endGame(completed) {
    if (timerInterval) clearInterval(timerInterval);

    const finalScoreEl = document.getElementById('final-score');
    const finalTimeEl = document.getElementById('final-time');
    const endTitleEl = document.getElementById('end-title');

    const totalDifferences = levels.reduce((acc, lvl) => acc + lvl.differences.length, 0);
    finalScoreEl.textContent = `${score} / ${totalDifferences}`;

    const min = Math.floor(totalTimeRemaining / 60);
    const sec = totalTimeRemaining % 60;
    finalTimeEl.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;

    if (completed) {
        endTitleEl.textContent = "🏆 ชนะเกม! ยินดีด้วย";
        endTitleEl.style.color = "var(--success-color)";
    } else {
        endTitleEl.textContent = "⏰ หมดเวลา! เสใจด้วย";
        endTitleEl.style.color = "var(--danger-color)";
    }

    showScreen('end-screen');
}

function nextLevelOrEnd(isSkipped = false) {
    isTransitioning = false;
    isShowingReveal = false;
    clearInterval(timerInterval);
    stopVictoryEffects();

    // Reset heading
    const currentLevel = levels[currentLevelIdx];
    skipBtn.textContent = 'ข้ามด่านนี้ ➤';
    skipBtn.classList.remove('reveal-continue-btn');
    levelTitle.style.color = '';

    if (currentLevelIdx + 1 < levels.length) {
        startLevel(currentLevelIdx + 1);
    } else {
        endGame(true);
    }
}

// Dev Mode helpers
function logDevCoordinate(x, y) {
    const coord = {
        x: parseFloat(x.toFixed(1)),
        y: parseFloat(y.toFixed(1)),
        r: 4.5
    };
    devCoords.push(coord);
    coordsLog.value = JSON.stringify(devCoords, null, 2);
}

function drawDevCircle(xPercent, yPercent) {
    const circle = document.createElement('div');
    circle.className = 'diff-circle dev-circle';
    circle.style.border = '3px solid #ec4899';
    circle.style.background = 'rgba(236, 72, 153, 0.15)';
    circle.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.5), inset 0 0 10px rgba(236, 72, 153, 0.5)';
    circle.style.left = `${xPercent}%`;
    circle.style.top = `${yPercent}%`;
    circle.style.width = '9%';
    circle.style.height = 'auto';
    circlesLayer.appendChild(circle);
}

// Event Listeners
startBtn.addEventListener('click', () => startLevel(0));
skipBtn.addEventListener('click', () => {
    if (isTransitioning) return;

    if (isShowingReveal) {
        // Player is continuing from the answer reveal screen
        nextLevelOrEnd(true);
    } else {
        // Player clicked skip during normal gameplay
        revealAnswerState(true);
    }
});
restartBtn.addEventListener('click', initGame);
interactiveWrapper.addEventListener('click', handleGameClick);

// Keyboard Accessibility for Enter/Space on wrapper
interactiveWrapper.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const rect = imgGame.getBoundingClientRect();
        const clientX = rect.left + rect.width / 2;
        const clientY = rect.top + rect.height / 2;

        handleGameClick({
            clientX: clientX,
            clientY: clientY,
            preventDefault: () => {}
        });
    }
});

// Toggle Dev Mode with keyboard key 'd'
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 'd') {
        devMode = !devMode;
        if (devMode) {
            devPanel.classList.remove('hidden-panel');
        } else {
            devPanel.classList.add('hidden-panel');
        }
    }
});

// Clear coordinates log
clearDevBtn.addEventListener('click', () => {
    devCoords = [];
    coordsLog.value = '';
    document.querySelectorAll('.dev-circle').forEach(el => el.remove());
});

// Initialize game on page load by merging async IndexedDB data first
async function bootGame() {
    await mergeCustomLevels();
    initGame();
}

bootGame();
