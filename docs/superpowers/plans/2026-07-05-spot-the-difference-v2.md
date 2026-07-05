# Spot the Difference Game (จับผิดภาพ) v2.0 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Clean up the game workspace, add an intermediate "Level Answer Reveal" state after each level with applause sound and confetti, upgrade the start screen aesthetics, and support scroll-free gameplay on desktop and iPad landscape orientations.

**Architecture:** A lightweight single-page application state machine managed in `game.js`. Visual styling and viewport-height containment handled dynamically in `style.css`. High-performance visual effects rendered via Canvas API particle engine on a dedicated overlay.

**Tech Stack:** HTML5, CSS3, Vanilla JavaScript, Web Audio API / HTML5 Audio API.

---

### Task 1: Workspace & Footer Clean Up (Clean UI)

**Files:**
- Modify: `index.html:45-66`
- Modify: `style.css`

- [ ] **Step 1: Modify HTML to remove overlays and tips**
  Remove labels "ภาพต้นฉบับ", "จับผิดจุดต่าง (คลิกที่นี่)" and the tip footer text. Also insert `#confetti-canvas` container.
  Replace target content in `index.html`:
  ```html
  <!-- Replace around line 45-66 -->
  <div class="workspace" id="game-workspace">
      <div class="image-wrapper" id="original-wrapper">
          <img src="" id="img-original" alt="ภาพต้นฉบับภาษาไทย">
      </div>
      <div class="image-wrapper interactive" id="interactive-wrapper" tabindex="0" role="button" aria-label="พื้นที่ภาพจับผิดเกม คลิกเพื่อเลือกจุดต่างที่สังเกตพบ">
          <img src="" id="img-game" alt="ภาพสำหรับเล่นจับผิดเกมภาษาไทย">
          <div class="feedback-layer" id="circles-layer"></div>
      </div>
  </div>
  
  <div class="game-footer">
      <button class="action-btn" id="skip-btn">ข้ามด่านนี้ ➔</button>
  </div>
  
  <canvas id="confetti-canvas" class="confetti-overlay" aria-hidden="true"></canvas>
  ```

- [ ] **Step 2: Modify CSS to format clean workspace and confetti canvas**
  Add styles in `style.css` for `#confetti-canvas` and clean up the old image-label style selectors if present:
  ```css
  /* Add at the bottom of style.css */
  .confetti-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      pointer-events: none;
      z-index: 999;
  }
  ```

- [ ] **Step 3: Run Node check for syntax correctness**
  Run: `node -c game.js`
  Expected: Success (no errors)

- [ ] **Step 4: Commit changes**
  ```bash
  git add index.html style.css
  git commit -m "feat(ui): clean image labels and tips, add confetti canvas structure"
  ```

---

### Task 2: Start Screen & iPad Landscape Optimization

**Files:**
- Modify: `index.html`
- Modify: `style.css`

- [ ] **Step 1: Add level preview cards to index.html**
  Add cards previewing Level 1 and Level 2 inside `#start-screen` in `index.html`:
  ```html
  <!-- Replace within `#start-screen` around rules-container -->
  <div class="rules-container">
      <h3>📜 กติกาการเล่น</h3>
      <ul>
          <li>⏱️ ค้นหาจุดต่างของภาพในเวลา 3 นาที (180 วินาที) ต่อด่าน</li>
          <li>🎯 คลิกจุดต่างที่สังเกตพบในภาพด้านขวา</li>
          <li>❌ คลิกผิดจะทำให้หน้าจอสั่นและเสียเวลา/คะแนนพิเศษ</li>
      </ul>
  </div>
  
  <div class="level-previews">
      <div class="lvl-preview-card">
          <div class="lvl-number">ด่านที่ 1</div>
          <div class="lvl-name">ศึกช้างศึก (ยุทธหัตถี)</div>
          <span class="lvl-badge">7 จุดต่าง</span>
      </div>
      <div class="lvl-preview-card">
          <div class="lvl-number">ด่านที่ 2</div>
          <div class="lvl-name">วิถีชีวิตกลางแม่น้ำป่า</div>
          <span class="lvl-badge">6 จุดต่าง</span>
      </div>
  </div>
  ```

- [ ] **Step 2: Implement styling for Start Screen Upgrade & Landscape Sizing**
  Add styles to `style.css` to add glowing effects to the main card, style previews, and implement height-based scaling:
  ```css
  /* Main Glass Card Outer Glow */
  .glass-card::before {
      content: '';
      position: absolute;
      top: -2px; left: -2px; right: -2px; bottom: -2px;
      background: linear-gradient(135deg, var(--accent-blue), var(--accent-cyan));
      border-radius: 20px;
      z-index: -1;
      filter: blur(15px);
      opacity: 0.15;
  }

  /* Level Preview Cards Styling */
  .level-previews {
      display: flex;
      gap: 15px;
      margin: 20px 0;
      justify-content: center;
      width: 100%;
  }
  .lvl-preview-card {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.06);
      border-radius: 12px;
      padding: 12px 15px;
      text-align: left;
      flex: 1;
      max-width: 180px;
      transition: transform 0.2s, border-color 0.2s;
  }
  .lvl-preview-card:hover {
      transform: translateY(-2px);
      border-color: var(--accent-cyan);
  }
  .lvl-preview-card .lvl-number {
      font-size: 0.75rem;
      text-transform: uppercase;
      color: var(--accent-cyan);
      font-weight: 700;
  }
  .lvl-preview-card .lvl-name {
      font-size: 0.85rem;
      font-weight: 600;
      margin: 3px 0 6px 0;
  }
  .lvl-preview-card .lvl-badge {
      display: inline-block;
      font-size: 0.7rem;
      background: rgba(16, 185, 129, 0.1);
      color: var(--correct-color);
      padding: 2px 8px;
      border-radius: 20px;
      font-weight: 600;
  }

  /* iPad Landscape & General Landscape Sizing Containment */
  @media (min-aspect-ratio: 1/1) and (max-height: 800px) {
      .game-container {
          padding: 10px;
          gap: 10px;
      }
      .workspace {
          max-height: 52vh;
          gap: 10px;
      }
      .image-wrapper {
          max-height: 52vh;
          display: flex;
          align-items: center;
          justify-content: center;
      }
      .image-wrapper img {
          max-height: 52vh;
          width: auto;
          max-width: 100%;
          object-fit: contain;
      }
      .level-previews {
          margin: 10px 0;
      }
      .rules-container {
          display: none; /* Hide rules on short vertical height landscapes to prevent scroll */
      }
  }
  ```

- [ ] **Step 3: Commit changes**
  ```bash
  git add index.html style.css
  git commit -m "feat(ui): implement start screen previews and responsive landscape media queries"
  ```

---

### Task 3: JavaScript Reveal State & Audio Integration

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Set up audio variables and state triggers**
  Introduce audio file reference (`applause.mp3`) and track the game states correctly.
  Modify `game.js` top state definitions:
  ```javascript
  // Around line 33
  let currentLevelIdx = 0;
  let levelScore = 0;
  let totalScore = 0;
  let timeRemaining = 180;
  let totalTimeRemaining = 0;
  let timerInterval = null;
  let foundIndices = [];
  let isTransitioning = false;
  let isShowingReveal = false; // Flag to track level reveal answer state

  // Sound effects
  const victorySound = new Audio('assets/applause.mp3');
  victorySound.volume = 0.6;
  ```

- [ ] **Step 2: Update sound play/pause helpers in game.js**
  Write functions to start and stop victory sounds cleanly:
  ```javascript
  // Add in game.js helper section
  function playVictoryEffects() {
      victorySound.currentTime = 0;
      victorySound.play().catch(err => {
          console.warn("Audio autoplay blocked by browser policy:", err);
      });
      startConfetti();
  }

  function stopVictoryEffects() {
      victorySound.pause();
      victorySound.currentTime = 0;
      stopConfetti();
  }
  ```

- [ ] **Step 3: Commit changes**
  ```bash
  git add game.js
  git commit -m "feat(audio): integrate applause sound variable and state flags"
  ```

---

### Task 4: Confetti Particle Engine Implementation

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Write custom Confetti system inside game.js**
  Implement the canvas particle rendering loop:
  ```javascript
  // Add at the bottom of game.js
  const canvas = document.getElementById('confetti-canvas');
  const ctx = canvas.getContext('2d');
  let confettiActive = false;
  let confettiParticles = [];
  const confettiColors = ['#f59e0b', '#10b981', '#3b82f6', '#ec4899', '#8b5cf6', '#ef4444'];
  let confettiAnimFrame = null;

  function resizeConfettiCanvas() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
  }
  window.addEventListener('resize', resizeConfettiCanvas);

  class ConfettiParticle {
      constructor() {
          this.x = Math.random() * canvas.width;
          this.y = Math.random() * -canvas.height - 20;
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
          if (this.y > canvas.height) {
              this.y = -20;
              this.x = Math.random() * canvas.width;
          }
      }
      draw() {
          ctx.save();
          ctx.translate(this.x, this.y);
          ctx.rotate(this.rotation * Math.PI / 180);
          ctx.fillStyle = this.color;
          ctx.fillRect(-this.size / 2, -this.size / 2, this.size, this.size);
          ctx.restore();
      }
  }

  function startConfetti() {
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
      ctx.clearRect(0, 0, canvas.width, canvas.height);
  }

  function animateConfetti() {
      if (!confettiActive) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      confettiParticles.forEach(p => {
          p.update();
          p.draw();
      });
      confettiAnimFrame = requestAnimationFrame(animateConfetti);
  }
  ```

- [ ] **Step 2: Verify syntax**
  Run: `node -c game.js`
  Expected: Success

- [ ] **Step 3: Commit changes**
  ```bash
  git add game.js
  git commit -m "feat(fx): implement canvas confetti particle simulation engine"
  ```

---

### Task 5: Level Complete & Reveal Answer Integration

**Files:**
- Modify: `game.js`

- [ ] **Step 1: Implement revealAnswerState() and customize game flow**
  Modify game transition flow inside `game.js`. Complete level redirects to `revealAnswerState()` showing `answer_X.png`.
  Implement `revealAnswerState(isSkipped)`:
  ```javascript
  // Add inside game.js
  function revealAnswerState(isSkipped = false) {
      isShowingReveal = true;
      clearInterval(timerInterval);
      
      // Stop interaction and play sounds
      isTransitioning = false; 
      playVictoryEffects();
      
      // Remove any user indicators to prevent clutter
      circlesLayer.innerHTML = '';
      
      // Set right image to answer image
      const currentLevel = levels[currentLevelIdx];
      imgGame.src = currentLevel.answerSrc || `assets/answer_${currentLevel.id}.png`;
      
      // Update heading text
      const heading = document.querySelector('#playing-screen h2');
      heading.innerHTML = `🎉 ด่านที่ ${currentLevel.id} เสร็จสิ้น (เฉลยจุดต่าง)`;
      heading.style.color = 'var(--correct-color)';
      
      // Modify footer button to show "Next Level" or "Results"
      const isLastLevel = (currentLevelIdx + 1 >= levels.length);
      const actionText = isLastLevel ? 'ดูผลลัพธ์เกม ➔' : 'ไปด่านถัดไป (Next Level) ➔';
      
      skipBtn.innerText = actionText;
      skipBtn.classList.add('reveal-continue-btn'); // CSS class for distinct layout
      
      // Adjust score calculations
      if (!isSkipped) {
          totalTimeRemaining += timeRemaining;
      }
  }
  ```
  Ensure level config includes `answerSrc`:
  ```javascript
  // Update levels array at the top of game.js
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
  ```

- [ ] **Step 2: Bind skipBtn to handle both skipping and continuing from reveal state**
  Replace `skipBtn` click handler:
  ```javascript
  skipBtn.addEventListener('click', () => {
      if (isTransitioning) return;
      
      if (isShowingReveal) {
          // Player clicks continue
          stopVictoryEffects();
          isShowingReveal = false;
          
          // Revert skipBtn styles/text
          skipBtn.innerText = 'ข้ามด่านนี้ ➔';
          skipBtn.classList.remove('reveal-continue-btn');
          
          const heading = document.querySelector('#playing-screen h2');
          heading.style.color = ''; // Reset color
          
          if (currentLevelIdx + 1 < levels.length) {
              startLevel(currentLevelIdx + 1);
          } else {
              endGame(true);
          }
      } else {
          // Player clicks standard Skip Level
          revealAnswerState(true);
      }
  });
  ```

- [ ] **Step 3: Modify win condition in handleGameClick**
  Replace win check block inside `handleGameClick`:
  ```javascript
  if (levelScore >= currentLevel.differences.length) {
      isTransitioning = true;
      clearInterval(timerInterval);
      setTimeout(() => {
          isTransitioning = false;
          revealAnswerState(false);
      }, 800);
  }
  ```

- [ ] **Step 4: Modify timer countdown end condition**
  When timer reaches 0, load the reveal answer page instead of immediately ending the level or game:
  ```javascript
  // Inside timerInterval countdown check in game.js:
  if (timeRemaining <= 0) {
      clearInterval(timerInterval);
      revealAnswerState(true); // Treat timeout similar to skipped
  }
  ```

- [ ] **Step 5: Reset state cleanly inside startLevel() and restartGame()**
  Ensure victory effects are stopped on starting:
  ```javascript
  // Inside startLevel(levelIdx):
  stopVictoryEffects();
  isShowingReveal = false;
  skipBtn.innerText = 'ข้ามด่านนี้ ➔';
  skipBtn.classList.remove('reveal-continue-btn');
  const heading = document.querySelector('#playing-screen h2');
  heading.style.color = '';
  ```

- [ ] **Step 6: Commit changes**
  ```bash
  git add game.js
  git commit -m "feat(game): connect revealAnswerState flow, continue button bindings, and reset overrides"
  ```

---

### Task 6: Readme, Verification, and Local Synchronization

**Files:**
- Modify: `README.md`
- Copy: `game.js`, `style.css`, `index.html` to visual companion folder

- [ ] **Step 1: Update README.md with v2 release notes**
  Edit `README.md` to add information about Level Answer Reveal, Victory SFX, Confetti, and the clean workspace changes.

- [ ] **Step 2: Copy updated code to the visual companion folder**
  Run copy command:
  ```bash
  cp index.html style.css game.js .superpowers/brainstorm/41105-1783242811/content/
  ```

- [ ] **Step 3: Verify the application using local static tools**
  Run: `node -c game.js`
  Expected: Success

- [ ] **Step 4: Commit all modifications**
  ```bash
  git add README.md
  git commit -m "docs: document reveal answer state, sfx, and confetti in README"
  ```
