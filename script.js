// ========== GLOBAL CONFIG ==========
const TOTAL_LEVELS = 8;
const QUESTIONS_PER_LEVEL = 125;   // 8 × 125 = 1000 questions total
const QUESTION_TIME = 60; // seconds

const STORAGE_KEY = "mathPracticeApp_v1";

// ========== STATE ==========
let appData = null;

let currentLevel = null;
let currentQuestionIndex = 0;
let currentAnswer = null;
let levelCorrect = 0;
let levelWrong = 0;
let wrongQuestions = [];
let timerId = null;
let timeLeft = QUESTION_TIME;
let hasAnswered = false;

// Review state
let reviewIndex = 0;

// Practice state
let practiceAnswer = null;

// Tables state
let tableAnswer = null;

// ========== HELPERS: STORAGE ==========
function createDefaultData() {
    const levels = {};
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        levels[i] = {
            unlocked: i === 1,
            completed: false,
            bestAccuracy: 0
        };
    }
    const today = getToday();
    return {
        levels,
        daily: {
            lastDate: today,
            streak: 0,
            todaySolved: 0,
            dailyGoal: 20
        }
    };
}

function loadData() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) {
            appData = createDefaultData();
            saveData();
        } else {
            appData = JSON.parse(raw);
        }
    } catch (e) {
        appData = createDefaultData();
    }
}

function saveData() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(appData));
}

// ========== DATE / STREAK LOGIC ==========
function getToday() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function updateDailySolved(incrementBy = 1) {
    const today = getToday();
    const daily = appData.daily;

    if (daily.lastDate !== today) {
        // new day
        const prev = new Date(daily.lastDate);
        const now = new Date(today);
        const diffDays = Math.round((now - prev) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
            daily.streak += 1;
        } else {
            daily.streak = 1; // restart streak
        }
        daily.todaySolved = 0;
        daily.lastDate = today;
    }

    daily.todaySolved += incrementBy;
    saveData();
    updateTopBar();
    updateStatsScreen();
}

// ========== UI UTILS ==========
function $(id) {
    return document.getElementById(id);
}

function showScreen(id) {
    document.querySelectorAll(".screen").forEach(sc => sc.classList.remove("active"));
    $(id).classList.add("active");
}

function switchLevelSubScreen(which) {
    ["level-select-screen", "level-play-screen", "level-report-screen", "level-review-screen"]
        .forEach(id => $(id).classList.add("hidden"));
    $(which).classList.remove("hidden");
}

// ========== LEVEL QUESTION GENERATION ==========
function generateQuestionForLevel(level, forceOp = "any") {
    function randNum(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    let a, b, op, symbol, ans;
    const cls = level;

    // Choose operation
    if (forceOp === "any") {
        const ops = ["add", "sub", "mul", "div"];
        op = ops[Math.floor(Math.random() * ops.length)];
    } else {
        op = forceOp;
    }

    if (cls === 1) {
        // Class 1: very basic + / -
        op = Math.random() < 0.6 ? "add" : "sub";
        a = randNum(1, 10);
        b = randNum(1, 10);
        if (op === "sub" && b > a) [a, b] = [b, a];
    } else if (cls === 2) {
        // Class 2: + / - up to 20
        op = Math.random() < 0.6 ? "add" : "sub";
        a = randNum(5, 20);
        b = randNum(1, 15);
        if (op === "sub" && b > a) [a, b] = [b, a];
    } else if (cls === 3) {
        // Class 3: + / - / small ×
        const r = Math.random();
        if (r < 0.5) {
            op = "add";
            a = randNum(10, 50);
            b = randNum(10, 50);
        } else if (r < 0.8) {
            op = "sub";
            a = randNum(20, 60);
            b = randNum(10, 30);
            if (b > a) [a, b] = [b, a];
        } else {
            op = "mul";
            a = randNum(2, 9);
            b = randNum(2, 9);
        }
    } else if (cls === 4) {
        // Class 4: bigger + / - / ×
        const r = Math.random();
        if (r < 0.4) {
            op = "add";
            a = randNum(20, 100);
            b = randNum(20, 100);
        } else if (r < 0.7) {
            op = "sub";
            a = randNum(40, 120);
            b = randNum(10, 70);
            if (b > a) [a, b] = [b, a];
        } else {
            op = "mul";
            a = randNum(3, 12);
            b = randNum(3, 12);
        }
    } else if (cls === 5) {
        // Class 5: + / - / × / ÷
        const r = Math.random();
        if (r < 0.35) {
            op = "add";
            a = randNum(50, 500);
            b = randNum(50, 400);
        } else if (r < 0.65) {
            op = "sub";
            a = randNum(100, 600);
            b = randNum(50, 300);
            if (b > a) [a, b] = [b, a];
        } else if (r < 0.85) {
            op = "mul";
            a = randNum(5, 20);
            b = randNum(5, 20);
        } else {
            op = "div";
            const divisor = randNum(2, 12);
            const quotient = randNum(2, 20);
            a = divisor * quotient;
            b = divisor;
        }
    } else if (cls === 6) {
        // Class 6: bigger ranges
        const r = Math.random();
        if (r < 0.3) {
            op = "add";
            a = randNum(100, 800);
            b = randNum(100, 800);
        } else if (r < 0.6) {
            op = "sub";
            a = randNum(300, 1000);
            b = randNum(100, 700);
            if (b > a) [a, b] = [b, a];
        } else if (r < 0.85) {
            op = "mul";
            a = randNum(10, 30);
            b = randNum(10, 30);
        } else {
            op = "div";
            const divisor = randNum(2, 15);
            const quotient = randNum(5, 40);
            a = divisor * quotient;
            b = divisor;
        }
    } else if (cls === 7) {
        // Class 7: large numbers
        const r = Math.random();
        if (r < 0.3) {
            op = "add";
            a = randNum(200, 1500);
            b = randNum(200, 1500);
        } else if (r < 0.6) {
            op = "sub";
            a = randNum(500, 2000);
            b = randNum(200, 1500);
            if (b > a) [a, b] = [b, a];
        } else if (r < 0.85) {
            op = "mul";
            a = randNum(15, 40);
            b = randNum(10, 40);
        } else {
            op = "div";
            const divisor = randNum(2, 20);
            const quotient = randNum(5, 50);
            a = divisor * quotient;
            b = divisor;
        }
    } else {
        // Class 8: hardest
        const r = Math.random();
        if (r < 0.3) {
            op = "add";
            a = randNum(500, 3000);
            b = randNum(500, 3000);
        } else if (r < 0.6) {
            op = "sub";
            a = randNum(1000, 4000);
            b = randNum(500, 3000);
            if (b > a) [a, b] = [b, a];
        } else if (r < 0.85) {
            op = "mul";
            a = randNum(20, 60);
            b = randNum(10, 60);
        } else {
            op = "div";
            const divisor = randNum(2, 25);
            const quotient = randNum(10, 80);
            a = divisor * quotient;
            b = divisor;
        }
    }

    if (op === "add") {
        symbol = "+";
        ans = a + b;
    } else if (op === "sub") {
        symbol = "−";
        ans = a - b;
    } else if (op === "mul") {
        symbol = "×";
        ans = a * b;
    } else {
        symbol = "÷";
        ans = a / b;
    }

    return {
        text: `${a} ${symbol} ${b} = ?`,
        answer: ans
    };
}

// ========== TIMER (LEVEL MODE) ==========
function startTimer() {
    clearInterval(timerId);
    timeLeft = QUESTION_TIME;
    $("timerDisplay").textContent = formatTime(timeLeft);
    $("timerDisplay").classList.remove("low");

    timerId = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 10) {
            $("timerDisplay").classList.add("low");
        }
        $("timerDisplay").textContent = formatTime(timeLeft);
        if (timeLeft <= 0) {
            clearInterval(timerId);
            handleTimeUp();
        }
    }, 1000);
}

function stopTimer() {
    clearInterval(timerId);
}

function formatTime(sec) {
    const m = String(Math.floor(sec / 60)).padStart(2, "0");
    const s = String(sec % 60).padStart(2, "0");
    return `${m}:${s}`;
}

// ========== LEVEL FLOW ==========
function startLevel(level) {
    currentLevel = level;
    currentQuestionIndex = 0;
    levelCorrect = 0;
    levelWrong = 0;
    wrongQuestions = [];
    hasAnswered = false;

    $("levelTotalQuestions").textContent = QUESTIONS_PER_LEVEL;
    $("levelInfo").textContent = `Level ${currentLevel}`;
    $("levelCorrectCount").textContent = "0";
    $("levelWrongCount").textContent = "0";
    $("levelAccuracy").textContent = "0%";
    $("levelStatusText").textContent = "Solve the question within 1 minute.";
    $("levelStatusText").className = "status info";

    $("levelAnswerInput").value = "";
    $("levelAnswerInput").focus();

    switchLevelSubScreen("level-play-screen");
    loadNextLevelQuestion();
}

function loadNextLevelQuestion() {
    if (currentQuestionIndex >= QUESTIONS_PER_LEVEL) {
        finishLevel();
        return;
    }

    hasAnswered = false;
    const qObj = generateQuestionForLevel(currentLevel);
    currentAnswer = qObj.answer;
    $("levelQuestionText").textContent = qObj.text;

    $("levelQuestionIndex").textContent = currentQuestionIndex + 1;
    $("levelAnswerInput").value = "";
    $("levelAnswerInput").focus();

    const overallIdx = currentQuestionIndex;
    const progressPercent = (overallIdx / QUESTIONS_PER_LEVEL) * 100;
    $("levelProgressBar").style.width = progressPercent + "%";

    startTimer();
}

function handleTimeUp() {
    if (hasAnswered) return;
    hasAnswered = true;
    levelWrong++;
    updateDailySolved(1);

    wrongQuestions.push({
        question: $("levelQuestionText").textContent,
        correct: currentAnswer
    });

    $("levelWrongCount").textContent = levelWrong.toString();
    updateLevelAccuracy();
    $("levelStatusText").textContent = `⏰ Time up! Correct answer: ${currentAnswer}`;
    $("levelStatusText").className = "status error";

    setTimeout(() => {
        currentQuestionIndex++;
        loadNextLevelQuestion();
    }, 1000);
}

function checkLevelAnswer() {
    if (currentAnswer === null || hasAnswered) return;
    const val = $("levelAnswerInput").value.trim();
    if (val === "") {
        $("levelStatusText").textContent = "Please enter your answer.";
        $("levelStatusText").className = "status error";
        return;
    }

    hasAnswered = true;
    stopTimer();
    const userAns = Number(val);

    updateDailySolved(1);

    if (userAns === currentAnswer) {
        levelCorrect++;
        $("levelStatusText").textContent = "✅ Correct! Great job.";
        $("levelStatusText").className = "status ok";
    } else {
        levelWrong++;
        $("levelStatusText").textContent = `❌ Wrong. Correct answer: ${currentAnswer}`;
        $("levelStatusText").className = "status error";
        wrongQuestions.push({
            question: $("levelQuestionText").textContent,
            correct: currentAnswer
        });
    }

    $("levelCorrectCount").textContent = levelCorrect.toString();
    $("levelWrongCount").textContent = levelWrong.toString();
    updateLevelAccuracy();

    setTimeout(() => {
        currentQuestionIndex++;
        loadNextLevelQuestion();
    }, 1000);
}

function updateLevelAccuracy() {
    const total = levelCorrect + levelWrong;
    const acc = total === 0 ? 0 : Math.round((levelCorrect / total) * 100);
    $("levelAccuracy").textContent = acc + "%";
}

function finishLevel() {
    stopTimer();
    const total = levelCorrect + levelWrong;
    const accuracy = total === 0 ? 0 : Math.round((levelCorrect / total) * 100);

    const levelData = appData.levels[currentLevel];
    if (accuracy > levelData.bestAccuracy) {
        levelData.bestAccuracy = accuracy;
    }
    levelData.completed = true;

    // unlock next level
    if (currentLevel < TOTAL_LEVELS) {
        appData.levels[currentLevel + 1].unlocked = true;
    }

    saveData();
    renderLevelGrid();
    updateStatsScreen();

    $("reportTitle").textContent = `Level ${currentLevel} Report`;
    $("reportTotal").textContent = total.toString();
    $("reportCorrect").textContent = levelCorrect.toString();
    $("reportWrong").textContent = levelWrong.toString();
    $("reportAccuracy").textContent = accuracy + "%";
    $("reportBestAccuracy").textContent = levelData.bestAccuracy + "%";
    $("reportSummary").textContent =
        `You answered ${levelCorrect} out of ${total} questions correctly in Level ${currentLevel}.`;

    if (wrongQuestions.length > 0) {
        $("reportReviewBtn").classList.remove("hidden");
        $("reportWrongBlock").style.display = "block";
    } else {
        $("reportReviewBtn").classList.add("hidden");
        $("reportWrongBlock").style.display = "none";
    }

    switchLevelSubScreen("level-report-screen");
}

function quitLevel() {
    stopTimer();
    currentLevel = null;
    switchLevelSubScreen("level-select-screen");
}

// ========== REVIEW WRONG QUESTIONS ==========
function startReview() {
    if (wrongQuestions.length === 0) return;

    reviewIndex = 0;
    $("reviewTotal").textContent = wrongQuestions.length.toString();
    loadReviewQuestion();
    switchLevelSubScreen("level-review-screen");
}

function loadReviewQuestion() {
    if (reviewIndex < 0 || reviewIndex >= wrongQuestions.length) return;
    const item = wrongQuestions[reviewIndex];
    $("reviewIndex").textContent = reviewIndex + 1;
    $("reviewQuestionText").textContent = item.question;
    $("reviewCorrectAnswer").textContent = item.correct;
    $("reviewAnswerInput").value = "";
    $("reviewStatusText").textContent = "Try solving it again yourself.";
    $("reviewStatusText").className = "status info";
}

function checkReviewAnswer() {
    const val = $("reviewAnswerInput").value.trim();
    if (val === "") {
        $("reviewStatusText").textContent = "Please enter your answer.";
        $("reviewStatusText").className = "status error";
        return;
    }
    const userAns = Number(val);
    const correct = wrongQuestions[reviewIndex].correct;
    if (userAns === correct) {
        $("reviewStatusText").textContent = "✅ Correct! Nice improvement.";
        $("reviewStatusText").className = "status ok";
    } else {
        $("reviewStatusText").textContent = `❌ Not correct. Correct answer is ${correct}.`;
        $("reviewStatusText").className = "status error";
    }
}

function nextReviewQuestion() {
    if (reviewIndex < wrongQuestions.length - 1) {
        reviewIndex++;
        loadReviewQuestion();
    } else {
        $("reviewStatusText").textContent = "You have reviewed all wrong questions for this level.";
        $("reviewStatusText").className = "status ok";
    }
}

// ========== LEVEL GRID RENDER ==========
function renderLevelGrid() {
    const grid = $("level-grid");
    grid.innerHTML = "";
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        const data = appData.levels[i];
        const div = document.createElement("div");
        div.className = "level-card";
        if (!data.unlocked) {
            div.classList.add("locked");
        } else {
            div.classList.add("unlocked");
        }
        if (data.completed) {
            div.classList.add("completed");
        }
        div.dataset.level = i;

        const acc = data.bestAccuracy || 0;

        div.innerHTML = `
            <div class="level-number">Level ${i}</div>
            <div class="level-status">
                ${!data.unlocked ? "🔒 Locked" :
                    data.completed ? "✅ Completed" : "🟡 Unlocked"}
            </div>
            <div class="level-accuracy">Best: ${acc}%</div>
        `;

        if (data.unlocked) {
            div.addEventListener("click", () => startLevel(i));
        }

        grid.appendChild(div);
    }
}

// ========== TOP BAR (STREAK + DAILY GOAL) ==========
function updateTopBar() {
    const d = appData.daily;
    $("streakText").textContent = `Streak: ${d.streak} day${d.streak === 1 ? "" : "s"}`;
    $("dailyGoalText").textContent = `Today: ${d.todaySolved} / ${d.dailyGoal} Q`;
}

// ========== PRACTICE MODE ==========
function newPracticeQuestion() {
    const cls = Number($("practiceClass").value);
    const op = $("practiceOp").value;
    const opVal = op === "any" ? "any" : op;
    const qObj = generateQuestionForLevel(cls, opVal);
    practiceAnswer = qObj.answer;
    $("practiceQuestionText").textContent = qObj.text;
    $("practiceAnswerInput").value = "";
    $("practiceAnswerInput").focus();
    $("practiceStatusText").textContent = "Solve and click Check.";
    $("practiceStatusText").className = "status info";
}

function checkPracticeAnswer() {
    if (practiceAnswer === null) {
        $("practiceStatusText").textContent = "Click New Question first.";
        $("practiceStatusText").className = "status error";
        return;
    }
    const val = $("practiceAnswerInput").value.trim();
    if (val === "") {
        $("practiceStatusText").textContent = "Please enter your answer.";
        $("practiceStatusText").className = "status error";
        return;
    }

    const userAns = Number(val);
    updateDailySolved(1);

    if (userAns === practiceAnswer) {
        $("practiceStatusText").textContent = "✅ Correct!";
        $("practiceStatusText").className = "status ok";
        $("practiceCorrect").textContent = (Number($("practiceCorrect").textContent) + 1).toString();
    } else {
        $("practiceStatusText").textContent = `❌ Wrong. Correct answer: ${practiceAnswer}`;
        $("practiceStatusText").className = "status error";
        $("practiceWrong").textContent = (Number($("practiceWrong").textContent) + 1).toString();
    }
}

function resetPractice() {
    practiceAnswer = null;
    $("practiceQuestionText").textContent = "Press \"New Question\"";
    $("practiceStatusText").textContent = "Press \"New Question\" to start.";
    $("practiceStatusText").className = "status info";
    $("practiceCorrect").textContent = "0";
    $("practiceWrong").textContent = "0";
    $("practiceAnswerInput").value = "";
}

// ========== TABLES MODE ==========
function initTablesDropdown() {
    const sel = $("tableBase");
    for (let i = 2; i <= 20; i++) {
        const opt = document.createElement("option");
        opt.value = i;
        opt.textContent = i;
        sel.appendChild(opt);
    }
}

function newTableQuestion() {
    const base = Number($("tableBase").value || 2);
    const n = Math.floor(Math.random() * 10) + 1; // 1 to 10
    tableAnswer = base * n;
    $("tableQuestionText").textContent = `${base} × ${n} = ?`;
    $("tableAnswerInput").value = "";
    $("tableAnswerInput").focus();
    $("tableStatusText").textContent = "Solve and click Check.";
    $("tableStatusText").className = "status info";
}

function checkTableAnswer() {
    if (tableAnswer === null) {
        $("tableStatusText").textContent = "Press New Question first.";
        $("tableStatusText").className = "status error";
        return;
    }
    const val = $("tableAnswerInput").value.trim();
    if (val === "") {
        $("tableStatusText").textContent = "Please enter your answer.";
        $("tableStatusText").className = "status error";
        return;
    }
    const userAns = Number(val);
    updateDailySolved(1);

    if (userAns === tableAnswer) {
        $("tableStatusText").textContent = "✅ Correct!";
        $("tableStatusText").className = "status ok";
        $("tableCorrect").textContent = (Number($("tableCorrect").textContent) + 1).toString();
    } else {
        $("tableStatusText").textContent = `❌ Wrong. Correct answer: ${tableAnswer}`;
        $("tableStatusText").className = "status error";
        $("tableWrong").textContent = (Number($("tableWrong").textContent) + 1).toString();
    }
}

function resetTables() {
    tableAnswer = null;
    $("tableQuestionText").textContent = "Press \"New Question\"";
    $("tableStatusText").textContent = "Practice any table from 2 to 20.";
    $("tableStatusText").className = "status info";
    $("tableCorrect").textContent = "0";
    $("tableWrong").textContent = "0";
    $("tableAnswerInput").value = "";
}

// ========== STATS SCREEN ==========
function updateStatsScreen() {
    const levelsDiv = $("statsLevels");
    levelsDiv.innerHTML = "";
    for (let i = 1; i <= TOTAL_LEVELS; i++) {
        const data = appData.levels[i];
        const div = document.createElement("div");
        div.className = "level-stat";
        const status = !data.unlocked ? "Locked"
            : data.completed ? "Completed"
            : "Unlocked";
        div.innerHTML = `
            <span>Level ${i} (${status})</span>
            <span>Best Accuracy: ${data.bestAccuracy}%</span>
        `;
        levelsDiv.appendChild(div);
    }

    const d = appData.daily;
    $("statsTodaySolved").textContent = d.todaySolved.toString();
    $("statsGoal").textContent = d.dailyGoal.toString();
    $("statsStreak").textContent = d.streak.toString();
    $("statsLastDay").textContent = d.lastDate || "-";
}

// Reset all progress
function resetAllProgress() {
    if (!confirm("Are you sure you want to reset all saved progress?")) return;
    appData = createDefaultData();
    saveData();
    renderLevelGrid();
    updateTopBar();
    updateStatsScreen();
}

// ========== NAVIGATION ==========
function initTabs() {
    const tabs = document.querySelectorAll(".tab-btn");
    tabs.forEach(btn => {
        btn.addEventListener("click", () => {
            tabs.forEach(b => b.classList.remove("active"));
            btn.classList.add("active");
            const target = btn.dataset.screen;
            showScreen(target);
        });
    });
}

// ========== INIT ==========
function init() {
    loadData();
    initTabs();
    initTablesDropdown();
    renderLevelGrid();
    updateTopBar();
    updateStatsScreen();

    // Level screen buttons
    $("levelCheckBtn").addEventListener("click", checkLevelAnswer);
    $("levelQuitBtn").addEventListener("click", quitLevel);

    $("levelAnswerInput").addEventListener("keydown", e => {
        if (e.key === "Enter") checkLevelAnswer();
    });

    // Level report
    $("reportBackBtn").addEventListener("click", () => {
        switchLevelSubScreen("level-select-screen");
    });
    $("reportRetryBtn").addEventListener("click", () => {
        if (currentLevel == null) currentLevel = 1;
        startLevel(currentLevel);
    });
    $("reportReviewBtn").addEventListener("click", startReview);

    // Review
    $("reviewCheckBtn").addEventListener("click", checkReviewAnswer);
    $("reviewNextBtn").addEventListener("click", nextReviewQuestion);
    $("reviewBackBtn").addEventListener("click", () => {
        switchLevelSubScreen("level-report-screen");
    });

    $("reviewAnswerInput").addEventListener("keydown", e => {
        if (e.key === "Enter") checkReviewAnswer();
    });

    // Practice
    $("practiceNewBtn").addEventListener("click", newPracticeQuestion);
    $("practiceCheckBtn").addEventListener("click", checkPracticeAnswer);
    $("practiceResetBtn").addEventListener("click", resetPractice);
    $("practiceAnswerInput").addEventListener("keydown", e => {
        if (e.key === "Enter") checkPracticeAnswer();
    });

    // Tables
    $("tableNewBtn").addEventListener("click", newTableQuestion);
    $("tableCheckBtn").addEventListener("click", checkTableAnswer);
    $("tableResetBtn").addEventListener("click", resetTables);
    $("tableAnswerInput").addEventListener("keydown", e => {
        if (e.key === "Enter") checkTableAnswer();
    });

    // Stats
    $("statsResetBtn").addEventListener("click", resetAllProgress);
}

document.addEventListener("DOMContentLoaded", init);
