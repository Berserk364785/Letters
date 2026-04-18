(function() {
    "use strict";

    // ---------- ЛЕТАЮЩИЕ СЕРДЕЧКИ (ЭМОДЗИ) ----------
    const HEARTS_CONTAINER = document.createElement('div');
    HEARTS_CONTAINER.style.position = 'fixed';
    HEARTS_CONTAINER.style.top = '0';
    HEARTS_CONTAINER.style.left = '0';
    HEARTS_CONTAINER.style.width = '100%';
    HEARTS_CONTAINER.style.height = '100%';
    HEARTS_CONTAINER.style.pointerEvents = 'none';
    HEARTS_CONTAINER.style.zIndex = '1';
    document.body.appendChild(HEARTS_CONTAINER);

    const HEART_COUNT = 40;
    let hearts = [];
    let width = window.innerWidth;
    let height = window.innerHeight;

    function random(min, max) {
        return Math.random() * (max - min) + min;
    }

    function createHeartElement() {
        const el = document.createElement('div');
        el.textContent = '❤️';
        el.style.position = 'absolute';
        el.style.fontSize = random(16, 36) + 'px';
        el.style.opacity = random(0.3, 0.8);
        el.style.textShadow = '0 0 10px #ff69b4, 0 0 20px #ff1493';
        el.style.willChange = 'transform, opacity';
        return el;
    }

    class FlyingHeart {
        constructor() {
            this.el = createHeartElement();
            this.size = parseFloat(this.el.style.fontSize);
            this.x = random(0, width);
            this.y = random(-height * 0.2, height * 1.2);
            this.speedY = random(0.4, 1.5);
            this.speedX = random(-0.3, 0.3);
            this.opacity = parseFloat(this.el.style.opacity);
            this.phase = random(0, 100);
            this.updatePosition();
            HEARTS_CONTAINER.appendChild(this.el);
        }

        updatePosition() {
            this.el.style.transform = `translate(${this.x}px, ${this.y}px)`;
            this.el.style.opacity = this.opacity;
        }

        update() {
            this.y += this.speedY;
            this.x += this.speedX + Math.sin(Date.now() * 0.001 + this.phase) * 0.1;
            this.opacity = 0.4 + 0.5 * Math.sin(Date.now() * 0.003 + this.phase);
            
            if (this.y > height + 50) {
                this.y = -30;
                this.x = random(0, width);
            }
            if (this.x < -30) this.x = width + 20;
            if (this.x > width + 30) this.x = -20;
            
            this.updatePosition();
        }

        remove() {
            this.el.remove();
        }
    }

    function initHearts() {
        hearts.forEach(h => h.remove());
        hearts = [];
        for (let i = 0; i < HEART_COUNT; i++) {
            hearts.push(new FlyingHeart());
        }
    }

    function animateHearts() {
        for (let h of hearts) h.update();
        requestAnimationFrame(animateHearts);
    }

    window.addEventListener('resize', () => {
        width = window.innerWidth;
        height = window.innerHeight;
        initHearts();
    });

    width = window.innerWidth;
    height = window.innerHeight;
    initHearts();
    animateHearts();

    // ---------- НЕОНОВЫЙ ТАЙМЕР ----------
    function updateTimer() {
        const now = new Date();
        document.getElementById('liveTimer').textContent = 
            `${String(now.getHours()).padStart(2,'0')}:${String(now.getMinutes()).padStart(2,'0')}:${String(now.getSeconds()).padStart(2,'0')}`;
        const opts = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        document.getElementById('liveDate').textContent = now.toLocaleDateString('ru-RU', opts);
    }
    updateTimer();
    setInterval(updateTimer, 1000);

    // ---------- ЗАГРУЗКА ПИСЕМ ИЗ ПАПКИ letters/ (только ≤ сегодня) ----------
    const LETTERS_DIR = './letters/';
    let lettersList = [];
    let currentIndex = 0;

    function getLocalDateStr(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const todayStr = getLocalDateStr();
    console.log('📅 Сегодня (локально):', todayStr);

    async function loadLetterForDate(dateStr) {
        try {
            const response = await fetch(`${LETTERS_DIR}${dateStr}.txt`);
            if (!response.ok) return null;
            const content = await response.text();
            console.log(`✅ Загружено письмо за ${dateStr}`);
            return { date: dateStr, content: content.trim() };
        } catch (e) {
            return null;
        }
    }

    async function loadAllAvailableLetters() {
        const letters = [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        for (let i = 0; i <= 90; i++) {
            const d = new Date(today);
            d.setDate(today.getDate() - i);
            const dateStr = getLocalDateStr(d);
            const letter = await loadLetterForDate(dateStr);
            if (letter) letters.push(letter);
        }

        const unique = Array.from(new Map(letters.map(l => [l.date, l])).values());
        unique.sort((a, b) => a.date.localeCompare(b.date));
        const available = unique.filter(l => l.date <= todayStr);
        console.log('📚 Доступные письма (≤ сегодня):', available);
        return available;
    }

    async function initializeLetters() {
        lettersList = await loadAllAvailableLetters();

        if (lettersList.length === 0) {
            currentIndex = -1;
        } else {
            const todayIndex = lettersList.findIndex(l => l.date === todayStr);
            currentIndex = todayIndex !== -1 ? todayIndex : lettersList.length - 1;
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
        const d = new Date(letter.date + 'T12:00:00');
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
        if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); }
        else if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
    });

    initializeLetters();
})();
