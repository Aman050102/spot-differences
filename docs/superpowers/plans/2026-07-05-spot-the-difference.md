# Spot the Difference Game Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a premium, responsive "Spot the Difference" web game from scratch using vanilla HTML5, CSS3, and JavaScript, with built-in developer calibration tools, fully integrated with Git.

**Architecture:** A lightweight Single Page Application (SPA) that controls game states (Start, Playing, End) dynamically. Coordinates are calculated as percentage values of the image container to maintain 100% responsiveness on all devices.

**Tech Stack:** HTML5, CSS3 (Vanilla), JavaScript (ES6+), Git.

---

### Task 1: Repository Setup and Assets Organization

**Files:**
- Create: `/Users/mac/spot-differences/.gitignore`
- Create: `/Users/mac/spot-differences/assets/` directory with renamed files

- [ ] **Step 1: Create .gitignore file**
  Create `/Users/mac/spot-differences/.gitignore` with the following content:
  ```text
  .DS_Store
  .superpowers/
  node_modules/
  ```

- [ ] **Step 2: Rename and structure image assets**
  Move and rename the user-provided images from the root of `/Users/mac/spot-differences/` into a new `assets` directory:
  - Copy `ต้นฉบับ 1.PNG` -> `/Users/mac/spot-differences/assets/original_1.png`
  - Copy `ภาพที่ลบเนื้อหาไปแล้ว 1.PNG` -> `/Users/mac/spot-differences/assets/game_1.png`
  - Copy `คำตอบ 1.PNG` -> `/Users/mac/spot-differences/assets/answer_1.png`
  - Copy `ต้นฉบับ 2.PNG` -> `/Users/mac/spot-differences/assets/original_2.png`
  - Copy `ภาพที่ลบเนื้อหาไปแล้ว 2.PNG` -> `/Users/mac/spot-differences/assets/game_2.png`
  - Copy `คำตอบ 2.PNG` -> `/Users/mac/spot-differences/assets/answer_2.png`

- [ ] **Step 3: Initialize Git repository**
  Run commands in `/Users/mac/spot-differences`:
  ```bash
  git init
  git add .gitignore assets/
  git commit -m "chore: initialize git repository and organize image assets"
  ```

---

### Task 2: HTML Shell Structure (`index.html`)

**Files:**
- Create: `/Users/mac/spot-differences/index.html`

- [ ] **Step 1: Create index.html structure**
  Create the Single Page Application HTML structure supporting Start, Playing, and End states:
  ```html
  <!DOCTYPE html>
  <html lang="th">
  <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>จับผิดภาพประวัติศาสตร์ - Spot the Difference</title>
      <link rel="stylesheet" href="style.css">
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Sarabun:wght@300;400;600;700&display=swap" rel="stylesheet">
  </head>
  <body>
      <div id="game-container">
          <!-- Start Screen -->
          <div id="start-screen" class="screen active">
              <div class="glass-card text-center">
                  <h1 class="logo-text">SPOT THE DIFFERENCE</h1>
                  <p class="subtitle-text">เกมจับผิดภาพสุดท้าทาย ค้นหาจุดต่างก่อนเวลาจะหมด!</p>
                  
                  <div class="rules-container">
                      <div class="rule-item">⏱️ มีเวลาด่านละ 3 นาที (180 วินาที)</div>
                      <div class="rule-item">🎯 ค้นหาจุดที่หายไปจากภาพขวา</div>
                      <div class="rule-item">❌ คลิกผิดไม่หักเวลา ค่อยๆ ค้นหาได้</div>
                  </div>

                  <button id="start-btn" class="btn btn-primary">เริ่มเล่นเกม</button>
              </div>
          </div>

          <!-- Game Playing Screen -->
          <div id="playing-screen" class="screen">
              <div class="game-header">
                  <div class="level-info">
                      <h2 id="level-title">ด่านที่ 1: ยุทธหัตถี</h2>
                      <div class="score-badge">พบจุดต่าง: <span id="found-count">0</span> / <span id="total-count">8</span></div>
                  </div>
                  <div class="timer-container">
                      <span class="timer-icon">⏱️</span>
                      <span id="timer-display">03:00</span>
                  </div>
              </div>

              <div class="workspace">
                  <!-- Left Image: Reference Original -->
                  <div class="image-wrapper">
                      <div class="image-label">ภาพต้นฉบับ</div>
                      <img id="img-original" src="assets/original_1.png" alt="Original Image">
                  </div>

                  <!-- Right Image: Interactive Spotting -->
                  <div class="image-wrapper interactive" id="interactive-wrapper">
                      <div class="image-label spotlight">จับผิดจุดต่าง (คลิกที่นี่)</div>
                      <img id="img-game" src="assets/game_1.png" alt="Game Image">
                      <!-- Correct circles will be dynamically injected here -->
                      <div id="circles-layer" class="overlay-layer"></div>
                      <!-- Incorrect click indicator will be injected here -->
                      <div id="feedback-layer" class="overlay-layer"></div>
                  </div>
              </div>

              <div class="game-footer">
                  <span class="tip-text">💡 คำแนะนำ: มองหาจุดที่ลบเนื้อหาหายไปในรูปขวาแล้วคลิกได้เลย!</span>
                  <button id="skip-btn" class="btn btn-secondary">ข้ามด่าน</button>
              </div>
          </div>

          <!-- End Screen -->
          <div id="end-screen" class="screen">
              <div class="glass-card text-center">
                  <div class="trophy-icon">🏆</div>
                  <h1 id="end-title" class="status-text">ยินดีด้วย! คุณจบเกมแล้ว</h1>
                  <p class="subtitle-text">สรุปผลคะแนนและสถิติของคุณ</p>

                  <div class="stats-grid">
                      <div class="stat-card">
                          <span class="stat-label">พบจุดต่างทั้งหมด</span>
                          <span id="final-score" class="stat-value">14 / 14</span>
                      </div>
                      <div class="stat-card">
                          <span class="stat-label">เวลาที่เหลือสะสม</span>
                          <span id="final-time" class="stat-value">02:30</span>
                      </div>
                  </div>

                  <button id="restart-btn" class="btn btn-primary">เล่นใหม่อีกครั้ง</button>
              </div>
          </div>

          <!-- Dev Coordinates Overlay Dashboard -->
          <div id="dev-panel" class="hidden-panel">
              <h3>Developer coordinates tool (กด 'D' เพื่อซ่อน/แสดง)</h3>
              <p>คลิกบนภาพขวาเพื่อรับพิกัดเป้าหมาย:</p>
              <textarea id="coords-log" readonly placeholder="คลิกเพื่อสร้างพิกัด..."></textarea>
              <button id="clear-dev-btn" class="btn btn-mini">ล้างข้อมูล</button>
          </div>
      </div>

      <script src="game.js"></script>
  </body>
  </html>
  ```

- [ ] **Step 2: Commit HTML Shell**
  Run commands in `/Users/mac/spot-differences`:
  ```bash
  git add index.html
  git commit -m "feat: create index.html SPA structure"
  ```

---

### Task 3: Premium Styling Implementation (`style.css`)

**Files:**
- Create: `/Users/mac/spot-differences/style.css`

- [ ] **Step 1: Write style.css styling**
  Implement CSS with vibrant HSL colors, modern fonts, glassmorphism overlay cards, side-by-side responsive layout, and correct/incorrect feedback animations:
  ```css
  :root {
      --bg-gradient: linear-gradient(135deg, #0f172a, #1e1b4b, #311042);
      --primary-color: #3b82f6;
      --primary-hover: #2563eb;
      --secondary-color: rgba(255, 255, 255, 0.08);
      --secondary-hover: rgba(255, 255, 255, 0.15);
      --correct-color: #ef4444; /* Circle highlight color */
      --correct-glow: rgba(239, 68, 68, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --card-bg: rgba(30, 41, 59, 0.7);
      --card-border: rgba(255, 255, 255, 0.08);
  }

  * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
  }

  body {
      font-family: 'Outfit', 'Sarabun', sans-serif;
      background: var(--bg-gradient);
      color: var(--text-main);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      overflow-x: hidden;
  }

  #game-container {
      width: 100%;
      max-width: 1200px;
      padding: 20px;
      position: relative;
  }

  .screen {
      display: none;
      opacity: 0;
      transition: opacity 0.4s ease;
  }

  .screen.active {
      display: flex;
      flex-direction: column;
      align-items: center;
      opacity: 1;
  }

  /* Glassmorphism Cards */
  .glass-card {
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 50px 40px;
      width: 100%;
      max-width: 600px;
      box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
      display: flex;
      flex-direction: column;
      align-items: center;
  }

  .text-center {
      text-align: center;
  }

  .logo-text {
      font-size: 2.8rem;
      font-weight: 800;
      letter-spacing: 0.05em;
      background: linear-gradient(135deg, #3b82f6, #8b5cf6, #ec4899);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 15px;
      animation: pulse 3s infinite ease-in-out;
  }

  .subtitle-text {
      color: var(--text-muted);
      font-size: 1.1rem;
      margin-bottom: 35px;
  }

  .rules-container {
      background: rgba(255, 255, 255, 0.03);
      border-radius: 16px;
      padding: 20px;
      width: 100%;
      margin-bottom: 40px;
      text-align: left;
      border: 1px solid rgba(255, 255, 255, 0.05);
  }

  .rule-item {
      margin-bottom: 12px;
      font-size: 1rem;
      display: flex;
      align-items: center;
  }

  .rule-item:last-child {
      margin-bottom: 0;
  }

  /* Buttons */
  .btn {
      font-family: inherit;
      border: none;
      padding: 14px 36px;
      font-size: 1.1rem;
      font-weight: 600;
      border-radius: 9999px;
      cursor: pointer;
      transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .btn-primary {
      background: linear-gradient(135deg, #3b82f6, #7c3aed);
      color: white;
      box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);
  }

  .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
  }

  .btn-secondary {
      background: var(--secondary-color);
      color: var(--text-main);
      border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .btn-secondary:hover {
      background: var(--secondary-hover);
      transform: translateY(-1px);
  }

  /* Game Workspace (Side-by-side images) */
  .game-header {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
  }

  .level-info h2 {
      font-size: 1.6rem;
      font-weight: 700;
      margin-bottom: 5px;
  }

  .score-badge {
      font-size: 0.95rem;
      background: rgba(255,255,255,0.06);
      padding: 4px 12px;
      border-radius: 20px;
      display: inline-block;
      border: 1px solid rgba(255,255,255,0.08);
  }

  .timer-container {
      font-size: 1.4rem;
      font-weight: 700;
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
      padding: 6px 16px;
      border-radius: 12px;
      border: 1px solid rgba(239, 68, 68, 0.2);
      display: flex;
      align-items: center;
      gap: 6px;
  }

  .workspace {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      width: 100%;
      margin-bottom: 20px;
  }

  .image-wrapper {
      position: relative;
      background: #0f172a;
      border-radius: 16px;
      overflow: hidden;
      border: 2px solid #334155;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 25px rgba(0,0,0,0.3);
  }

  .image-wrapper img {
      width: 100%;
      height: auto;
      display: block;
      pointer-events: none; /* Prevents dragging */
  }

  .image-wrapper.interactive {
      border-color: #3b82f6;
      cursor: crosshair;
  }

  .image-label {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(0, 0, 0, 0.6);
      color: #cbd5e1;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 0.8rem;
      font-weight: 600;
      z-index: 10;
  }

  .image-label.spotlight {
      background: #3b82f6;
      color: white;
  }

  .overlay-layer {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 5;
  }

  /* Target Spot Circle Styling */
  .diff-circle {
      position: absolute;
      border: 3px solid var(--correct-color);
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.15);
      box-shadow: 0 0 12px var(--correct-glow);
      transform: translate(-50%, -50%);
      animation: ripple 0.6s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards;
  }

  /* Temporary Miss Indicator */
  .miss-indicator {
      position: absolute;
      width: 24px;
      height: 24px;
      border: 3px solid #ef4444;
      border-radius: 50%;
      background: rgba(239, 68, 68, 0.3);
      transform: translate(-50%, -50%);
      animation: fadeOut 0.4s ease-out forwards;
  }

  .shake-effect {
      animation: shake 0.3s ease-in-out;
  }

  /* Footer Controls */
  .game-footer {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
  }

  .tip-text {
      color: var(--text-muted);
      font-size: 0.9rem;
  }

  /* End Screen Components */
  .trophy-icon {
      font-size: 4rem;
      margin-bottom: 20px;
      animation: float 3s ease-in-out infinite;
  }

  .stats-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      width: 100%;
      margin-bottom: 40px;
  }

  .stat-card {
      background: rgba(255,255,255,0.03);
      border: 1px solid rgba(255,255,255,0.05);
      border-radius: 16px;
      padding: 20px;
      display: flex;
      flex-direction: column;
  }

  .stat-label {
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      margin-bottom: 5px;
  }

  .stat-value {
      font-size: 1.8rem;
      font-weight: 800;
  }

  /* Dev Panel Coordinates Dashboard */
  .hidden-panel {
      position: fixed;
      bottom: 20px;
      right: 20px;
      background: rgba(15, 23, 42, 0.95);
      border: 2px solid #ec4899;
      border-radius: 12px;
      padding: 15px;
      width: 320px;
      z-index: 999;
      box-shadow: 0 10px 25px rgba(0,0,0,0.5);
      display: none;
  }

  .hidden-panel.visible {
      display: block;
  }

  .hidden-panel h3 {
      font-size: 0.9rem;
      color: #ec4899;
      margin-bottom: 8px;
  }

  .hidden-panel p {
      font-size: 0.8rem;
      color: #94a3b8;
      margin-bottom: 8px;
  }

  .hidden-panel textarea {
      width: 100%;
      height: 100px;
      background: #020617;
      color: #10b981;
      border: 1px solid #334155;
      font-family: monospace;
      font-size: 0.75rem;
      padding: 5px;
      resize: none;
      margin-bottom: 8px;
  }

  .btn-mini {
      padding: 4px 10px;
      font-size: 0.75rem;
      border-radius: 4px;
      background: #ef4444;
      color: white;
  }

  /* Animations */
  @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.9; transform: scale(0.98); }
  }

  @keyframes ripple {
      0% { width: 0px; height: 0px; opacity: 0; }
      10% { opacity: 1; }
      100% { width: 6%; height: auto; aspect-ratio: 1/1; opacity: 1; }
  }

  @keyframes fadeOut {
      0% { opacity: 1; transform: translate(-50%, -50%) scale(0.8); }
      100% { opacity: 0; transform: translate(-50%, -50%) scale(1.5); }
  }

  @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
  }

  @keyframes shake {
      0%, 100% { transform: translateX(0); }
      20%, 60% { transform: translateX(-6px); }
      40%, 80% { transform: translateX(6px); }
  }

  /* Responsive Design */
  @media (max-width: 768px) {
      .workspace {
          grid-template-columns: 1fr;
      }
      .game-header {
          flex-direction: column;
          align-items: flex-start;
          gap: 10px;
      }
      .timer-container {
          align-self: flex-end;
      }
      body {
          padding: 10px;
      }
  }
  ```

- [ ] **Step 2: Commit CSS Style**
  Run commands in `/Users/mac/spot-differences`:
  ```bash
  git add style.css
  git commit -m "feat: implement CSS layout, animations, and responsive system"
  ```

---

### Task 4: Base Javascript Implementation (`game.js`)

**Files:**
- Create: `/Users/mac/spot-differences/game.js`

- [ ] **Step 1: Write initial game.js structure**
  Implement state machine, countdown timers, click listeners, percentage distance checks, level configurations with placeholders for coordinates:
  ```javascript
  // Game levels configuration
  const levels = [
      {
          id: 1,
          title: "ด่านที่ 1: ยุทธหัตถี (ศึกช้าง)",
          originalSrc: "assets/original_1.png",
          gameSrc: "assets/game_1.png",
          // Calibrated coordinates will be placed here
          differences: []
      },
      {
          id: 2,
          title: "ด่านที่ 2: วิถีชีวิตกลางแม่น้ำป่า",
          originalSrc: "assets/original_2.png",
          gameSrc: "assets/game_2.png",
          differences: []
      }
  ];

  // Game state
  let currentLevelIdx = 0;
  let score = 0;
  let levelScore = 0;
  let timerInterval = null;
  let timeRemaining = 180; // 3 minutes in seconds
  let totalTimeRemaining = 0;
  let devMode = false;
  let foundDifferencesList = []; // Track found index of differences

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

  // Dev mode elements
  const devPanel = document.getElementById('dev-panel');
  const coordsLog = document.getElementById('coords-log');
  const clearDevBtn = document.getElementById('clear-dev-btn');

  // State switcher
  function showScreen(screen) {
      [startScreen, playingScreen, endScreen].forEach(s => s.classList.remove('active'));
      screen.classList.add('active');
  }

  // Init
  function initGame() {
      currentLevelIdx = 0;
      score = 0;
      totalTimeRemaining = 0;
      showScreen(startScreen);
  }

  // Start Level
  function startLevel(levelIdx) {
      currentLevelIdx = levelIdx;
      levelScore = 0;
      foundDifferencesList = [];
      timeRemaining = 180; // 3 minutes
      
      const level = levels[currentLevelIdx];
      levelTitle.textContent = level.title;
      foundCountEl.textContent = "0";
      totalCountEl.textContent = level.differences.length.toString();
      
      imgOriginal.src = level.originalSrc;
      imgGame.src = level.gameSrc;
      
      circlesLayer.innerHTML = '';
      feedbackLayer.innerHTML = '';
      
      updateTimerDisplay();
      
      if (timerInterval) clearInterval(timerInterval);
      timerInterval = setInterval(updateTimer, 1000);
      
      showScreen(playingScreen);
  }

  // Timer Tick
  function updateTimer() {
      timeRemaining--;
      updateTimerDisplay();
      
      if (timeRemaining <= 0) {
          clearInterval(timerInterval);
          endGame(false); // Lost due to timeout
      }
  }

  function updateTimerDisplay() {
      const minutes = Math.floor(timeRemaining / 60);
      const seconds = timeRemaining % 60;
      timerDisplay.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  // Game click handler
  function handleGameClick(e) {
      const rect = imgGame.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      
      // Calculate coordinates in percentages relative to active image dimensions
      const percentX = (clickX / rect.width) * 100;
      const percentY = (clickY / rect.height) * 100;
      
      if (devMode) {
          logDevCoordinate(percentX, percentY);
          drawDevCircle(percentX, percentY);
          return;
      }
      
      // Check if user clicked a difference
      const currentLevel = levels[currentLevelIdx];
      let matchIdx = -1;
      
      for (let i = 0; i < currentLevel.differences.length; i++) {
          if (foundDifferencesList.includes(i)) continue;
          
          const diff = currentLevel.differences[i];
          const distance = Math.sqrt(Math.pow(percentX - diff.x, 2) + Math.pow(percentY - diff.y, 2));
          
          if (distance <= diff.r) {
              matchIdx = i;
              break;
          }
      }
      
      if (matchIdx !== -1) {
          // Found difference
          foundDifferencesList.push(matchIdx);
          levelScore++;
          score++;
          foundCountEl.textContent = levelScore.toString();
          
          // Draw persistent circle
          const diff = currentLevel.differences[matchIdx];
          drawPersistentCircle(diff.x, diff.y, diff.r);
          
          // Check win level
          if (levelScore >= currentLevel.differences.length) {
              clearInterval(timerInterval);
              totalTimeRemaining += timeRemaining;
              setTimeout(() => {
                  if (currentLevelIdx + 1 < levels.length) {
                      startLevel(currentLevelIdx + 1);
                  } else {
                      endGame(true); // Completed all levels
                  }
              }, 800);
          }
      } else {
          // Miss clicked
          drawMissIndicator(percentX, percentY);
          triggerShakeEffect();
      }
  }

  function drawPersistentCircle(xPercent, yPercent, rPercent) {
      const circle = document.createElement('div');
      circle.className = 'diff-circle';
      circle.style.left = `${xPercent}%`;
      circle.style.top = `${yPercent}%`;
      circle.style.width = `${rPercent * 2}%`;
      circle.style.height = `${rPercent * 2}%`;
      circlesLayer.appendChild(circle);
  }

  function drawMissIndicator(xPercent, yPercent) {
      const indicator = document.createElement('div');
      indicator.className = 'miss-indicator';
      indicator.style.left = `${xPercent}%`;
      indicator.style.top = `${yPercent}%`;
      feedbackLayer.appendChild(indicator);
      setTimeout(() => indicator.remove(), 400);
  }

  function triggerShakeEffect() {
      interactiveWrapper.classList.add('shake-effect');
      setTimeout(() => interactiveWrapper.classList.remove('shake-effect'), 300);
  }

  // End Game Screen
  function endGame(completed) {
      if (timerInterval) clearInterval(timerInterval);
      
      const finalScoreEl = document.getElementById('final-score');
      const finalTimeEl = document.getElementById('final-time');
      const endTitle = document.getElementById('end-title');
      
      const totalDifferences = levels.reduce((acc, lvl) => acc + lvl.differences.length, 0);
      finalScoreEl.textContent = `${score} / ${totalDifferences}`;
      
      const min = Math.floor(totalTimeRemaining / 60);
      const sec = totalTimeRemaining % 60;
      finalTimeEl.textContent = `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
      
      if (completed) {
          endTitle.textContent = "🏆 ชนะเกม! ยินดีด้วย";
          endTitle.style.color = "#10b981";
      } else {
          endTitle.textContent = "⏰ หมดเวลา! เสียใจด้วย";
          endTitle.style.color = "#ef4444";
      }
      
      showScreen(endScreen);
  }

  // Event Listeners
  startBtn.addEventListener('click', () => startLevel(0));
  skipBtn.addEventListener('click', () => {
      clearInterval(timerInterval);
      if (currentLevelIdx + 1 < levels.length) {
          startLevel(currentLevelIdx + 1);
      } else {
          endGame(true);
      }
  });
  restartBtn.addEventListener('click', initGame);
  imgGame.parentElement.addEventListener('click', handleGameClick);

  // Key combo listener for Dev Mode
  window.addEventListener('keydown', (e) => {
      if (e.key.toLowerCase() === 'd') {
          devMode = !devMode;
          devPanel.classList.toggle('visible', devMode);
          console.log(`Developer mode: ${devMode ? 'ON' : 'OFF'}`);
      }
  });

  // Dev Logging Helpers
  let devCoords = [];
  function logDevCoordinate(x, y) {
      const coord = { x: parseFloat(x.toFixed(1)), y: parseFloat(y.toFixed(1)), r: 4.5 };
      devCoords.push(coord);
      coordsLog.value = JSON.stringify(devCoords, null, 2);
  }

  function drawDevCircle(xPercent, yPercent) {
      const circle = document.createElement('div');
      circle.className = 'diff-circle';
      circle.style.borderColor = '#ec4899';
      circle.style.background = 'rgba(236, 72, 153, 0.15)';
      circle.style.boxShadow = '0 0 12px rgba(236, 72, 153, 0.5)';
      circle.style.left = `${xPercent}%`;
      circle.style.top = `${yPercent}%`;
      circle.style.width = '9%';
      circle.style.height = '9%';
      circlesLayer.appendChild(circle);
  }

  clearDevBtn.addEventListener('click', () => {
      devCoords = [];
      coordsLog.value = '';
      circlesLayer.innerHTML = '';
  });

  // Run on start
  initGame();
  ```

- [ ] **Step 2: Commit Javascript**
  Run commands in `/Users/mac/spot-differences`:
  ```bash
  git add game.js
  git commit -m "feat: implement game.js core state logic and calibration tools"
  ```

---

### Task 5: Coordinates Calibration (Dev Mode Phase)

**Files:**
- Modify: `/Users/mac/spot-differences/game.js` (Insert calibrated coordinates)

- [ ] **Step 1: Calibration Tool Prep**
  To align with coordinate matching, we will run the game locally, open Dev Mode, and click the center of the differences identified in the answer files:
  - Level 1: 8 differences from `/Users/mac/spot-differences/assets/answer_1.png`
  - Level 2: 6 differences from `/Users/mac/spot-differences/assets/answer_2.png`

- [ ] **Step 2: Run calibration script or inspect locations**
  We will click the exact points on the image via a browser or write down the estimated positions relative to `answer_X.png`.
  *Note: Let's inspect the coordinates of circles in `answer_1.png` and `answer_2.png` to map them directly using a quick automated calculation, or we can use the calibration tool by launching the server and opening the browser.*

- [ ] **Step 3: Update game.js with real coordinates**
  We will update the `levels` array in `game.js` with the correct JSON objects.

- [ ] **Step 4: Commit Calibrated Coordinates**
  ```bash
  git add game.js
  git commit -m "feat: calibrate difference coordinates for Level 1 and Level 2"
  ```

---

### Task 6: Readme, Verification, and Completion

**Files:**
- Create: `/Users/mac/spot-differences/README.md`

- [ ] **Step 1: Create README.md**
  Write complete execution details:
  ```markdown
  # จับผิดภาพ - Spot the Difference Game

  เกมสำหรับเล่นจับผิดภาพ (Spot the Difference) จำนวน 2 ด่าน ได้แก่:
  - ด่านที่ 1 (ภาพศึกยุทธหัตถี): มี 8 จุดต่าง
  - ด่านที่ 2 (ภาพเรือแม่น้ำในป่า): มี 6 จุดต่าง

  ## วิธีการเล่นเกม
  1. ดับเบิลคลิกเปิดไฟล์ `index.html` บนเบราว์เซอร์เพื่อเข้าสู่หน้าจอเกม
  2. กดปุ่ม **เริ่มเล่นเกม**
  3. สังเกตหาจุดต่างระหว่างภาพต้นฉบับ (ซ้าย) กับภาพจับผิด (ขวา) ที่ลบเนื้อหาบางส่วนออก
  4. คลิกตำแหน่งบนภาพขวาเพื่อวงกลมจุดต่าง หากถูกต้อง วงกลมสีแดงจะปรากฏขึ้นค้างไว้
  5. เล่นให้จบทุกด่านเพื่อสรุปผลคะแนนและเวลาโบนัสที่เหลือสะสม!

  ## โหมดผู้พัฒนา (Developer Mode / การคาลิเบรตพิกัด)
  หากต้องการแก้ไขจุดต่าง หรือเปิดระบบดูพิกัด ให้ทำตามขั้นตอนนี้:
  1. เข้าเกมและเปิดหน้าเล่นตามปกติ
  2. กดปุ่ม `D` บนคีย์บอร์ด (หรือคลิกขวา -> เข้าสู่ระบบดึงค่าพิกัด)
  3. แผงควบคุมจะแสดงขึ้นมาด้านล่างขวา เมื่อคลิกจุดต่างบนภาพขวา พิกัดเปอร์เซ็นต์ `%` จะปรากฏขึ้นในกล่องข้อความ
  4. สามารถคัดลอกพิกัด JSON ไปแปะในอาร์เรย์ `differences` ในไฟล์ `game.js` ได้เลย
  ```

- [ ] **Step 2: Final Commit**
  Run commands in `/Users/mac/spot-differences`:
  ```bash
  git add README.md
  git commit -m "docs: add README instructions for players and developers"
  ```
