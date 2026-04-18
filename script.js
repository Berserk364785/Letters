(function() {
    "use strict";

    // ---------- CANVAS: ЛЕТАЮЩИЕ СЕРДЕЧКИ ----------
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
            
            if (h.y > height + 50) {
                h.y = -30;
                h.x = random(0, width);
            }
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

    // ---------- РАБОТА С ПИСЬМАМИ (ТОЛЬКО ≤ СЕГОДНЯ) ----------
    const LETTERS_DIR = './letters/';
    let lettersList = [];
    let currentIndex = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString().slice(0,10);

    // Загрузить одно письмо по дате
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

    // Загрузить все письма с датой ≤ сегодня (проверяем последние 90 дней)
    async function loadAllAvailableLetters() {
        const letters = [];
        for (let i = 0; i < 90; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = d.toISOString().slice(0,10);
            const letter = await loadLetterForDate(dateStr);
            if (letter) letters.push(letter);
        }
        // Сортируем от старых к новым
        letters.sort((a, b) => a.date.localeCompare(b.date));
        console.log('📚 Доступные письма (≤ сегодня):', letters);
        return letters;
    }

    // Инициализация
    async function initializeLetters() {
        lettersList = await loadAllAvailableLetters();

        if (lettersList.length === 0) {
            currentIndex = -1;
        } else {
            // Ищем письмо за сегодня
            const todayIndex = lettersList.findIndex(l => l.date === todayStr);
            if (todayIndex !== -1) {
                currentIndex = todayIndex;
            } else {
                // Иначе показываем самое последнее (ближайшее к сегодня)
                currentIndex = lettersList.length - 1;
            }
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

    function navigate(direction) {
        if (lettersList.length === 0) return;
        const newIndex = currentIndex + direction;
        if (newIndex < 0 || newIndex >= lettersList.length) return;
        currentIndex = newIndex;
        updateLetterDisplay();
        updateCounter();
    }

    document.getElementById('prevLetter').addEventListener('click', () => navigate(-1));
    document.getElementById('nextLetter').addEventListener('click', () => navigate(1));
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            navigate(-1);
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            navigate(1);
        }
    });

    // Старт
    initializeLetters();
})();
