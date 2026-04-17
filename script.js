(function() {
    "use strict";

    // ---------- CANVAS: ЛЕТАЮЩИЕ СЕРДЕЧКИ (как раньше) ----------
    const canvas = document.getElementById('hearts-canvas');
    const ctx = canvas.getContext('2d');
    let width, height;
    let hearts = [];
    const HEART_COUNT = 50;

    function resizeCanvas() {
        width = window.innerWidth;
        height = window.innerHeight;
        canvas.width = width;
        canvas.height = height;
    }

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createHeart() {
        return {
            x: random(0, width),
            y: random(-height * 0.2, height * 1.2),
            size: random(12, 36),
            speedY: random(0.4, 1.8),
            speedX: random(-0.3, 0.3),
            opacity: random(0.3, 0.9),
            color: `rgba(255, ${random(80, 200)}, ${random(150, 220)}, `,
            phase: random(0, 100)
        };
    }

    function initHearts() {
        hearts = [];
        for (let i = 0; i < HEART_COUNT; i++) {
            hearts.push(createHeart());
        }
    }

    function drawHeart(ctx, x, y, size, opacity, colorBase) {
        ctx.save();
        ctx.translate(x, y);
        ctx.scale(size / 24, size / 24);
        ctx.fillStyle = colorBase + opacity + ')';
        ctx.shadowColor = '#ff69b4';
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.moveTo(0, 6);
        ctx.bezierCurveTo(-8, -6, -16, -12, 0, -12);
        ctx.bezierCurveTo(16, -12, 8, -6, 0, 6);
        ctx.fill();
        ctx.restore();
    }

    function updateHearts() {
        for (let h of hearts) {
            h.y += h.speedY;
            h.x += h.speedX + Math.sin(Date.now() * 0.001 + h.phase) * 0.1;
            h.opacity = 0.4 + 0.5 * Math.sin(Date.now() * 0.003 + h.phase);
            if (h.y > height + 50) { h.y = -30; h.x = random(0, width); }
            if (h.x < -30) h.x = width + 20;
            if (h.x > width + 30) h.x = -20;
        }
    }

    function drawHearts() {
        ctx.clearRect(0, 0, width, height);
        for (let h of hearts) {
            drawHeart(ctx, h.x, h.y, h.size, h.opacity, h.color);
        }
    }

    function animateHearts() {
        updateHearts();
        drawHearts();
        requestAnimationFrame(animateHearts);
    }

    window.addEventListener('resize', () => {
        resizeCanvas();
        initHearts();
    });

    resizeCanvas();
    initHearts();
    animateHearts();

    // ---------- ТАЙМЕР ----------
    function updateTimer() {
        const now = new Date();
        document.getElementById('liveTimer').textContent = 
            `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('liveDate').textContent = now.toLocaleDateString('ru-RU', opts);
    }
    updateTimer();
    setInterval(updateTimer, 1000);

    // ---------- РАБОТА С ПИСЬМАМИ ИЗ ПАПКИ ----------
    // ---------- РАБОТА С ПИСЬМАМИ ИЗ ПАПКИ ----------
const LETTERS_DIR = './letters/';
let lettersList = [];
let currentIndex = 0;
let todayStr = new Date().toISOString().slice(0,10);

async function loadLetterForDate(dateStr) {
    try {
        const response = await fetch(`${LETTERS_DIR}${dateStr}.txt`);
        if (!response.ok) return null;
        const content = await response.text();
        return { date: dateStr, content: content.trim() };
    } catch (e) {
        return null;
    }
}

async function findLatestAvailableLetter() {
    const today = new Date();
    for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(today.getDate() - i);
        const dateStr = checkDate.toISOString().slice(0,10);
        const letter = await loadLetterForDate(dateStr);
        if (letter) return letter;
    }
    return null;
}

async function buildLetterArray(centerDateStr) {
    const letters = [];
    const center = new Date(centerDateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Проверяем даты от (центр - 30 дней) до сегодня
    for (let offset = -30; offset <= 0; offset++) {
        const d = new Date(center);
        d.setDate(center.getDate() + offset);
        if (d > today) continue; // будущие даты пропускаем

        const dateStr = d.toISOString().slice(0,10);
        const letter = await loadLetterForDate(dateStr);
        if (letter) letters.push(letter);
    }

    const unique = Array.from(new Map(letters.map(l => [l.date, l])).values());
    unique.sort((a,b) => a.date.localeCompare(b.date));
    return unique;
}

async function initializeLetters() {
    let todayLetter = await loadLetterForDate(todayStr);
    let targetDate = todayStr;
    if (!todayLetter) {
        const fallback = await findLatestAvailableLetter();
        if (fallback) {
            todayLetter = fallback;
            targetDate = fallback.date;
        }
    }

    if (todayLetter) {
        lettersList = await buildLetterArray(targetDate);
        currentIndex = lettersList.findIndex(l => l.date === targetDate);
        if (currentIndex === -1) currentIndex = lettersList.length - 1; // на всякий случай
    } else {
        lettersList = [];
        currentIndex = -1;
    }

    updateLetterDisplay();
    updateCounter();
}

    function updateLetterDisplay() {
        const dateEl = document.getElementById('letterDate');
        const textEl = document.getElementById('letterText');
        const prevBtn = document.getElementById('prevLetter');
        const nextBtn = document.getElementById('nextLetter');

        if (lettersList.length === 0) {
            dateEl.textContent = '✨';
            textEl.textContent = 'Писем пока нет. Добавь .txt файлы в папку letters/ ✨';
            prevBtn.classList.add('disabled');
            nextBtn.classList.add('disabled');
            return;
        }

        const letter = lettersList[currentIndex];
        const d = new Date(letter.date);
        const formatted = d.toLocaleDateString('ru-RU', { year:'numeric', month:'long', day:'numeric' });
        dateEl.textContent = `📅 ${formatted}`;
        textEl.textContent = letter.content;

        prevBtn.classList.toggle('disabled', currentIndex <= 0);
        nextBtn.classList.toggle('disabled', currentIndex >= lettersList.length - 1);
    }

    function updateCounter() {
        const counter = document.getElementById('letterCounter');
        const total = lettersList.length;
        const cur = total ? currentIndex + 1 : 0;
        counter.textContent = `📩 ${cur} / ${total}`;
    }

    async function navigate(direction) {
        if (lettersList.length === 0) return;
        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= lettersList.length) return;
        
        // Если мы вышли за пределы текущего массива — можно подгрузить ещё (опционально)
        currentIndex = newIndex;
        updateLetterDisplay();
        updateCounter();
    }

    document.getElementById('prevLetter').addEventListener('click', () => navigate(-1));
    document.getElementById('nextLetter').addEventListener('click', () => navigate(1));
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
    });

    // Старт
    initializeLetters();
})();
