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
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        document.getElementById('liveTimer').textContent = `${hours}:${minutes}:${seconds}`;
        
        const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
        const dateStr = now.toLocaleDateString('ru-RU', options);
        document.getElementById('liveDate').textContent = dateStr;
    }
    updateTimer();
    setInterval(updateTimer, 1000);

    // ---------- РАБОТА С ПИСЬМАМИ ----------
    const STORAGE_KEY = 'neon_letters_app';
    
    const DEMO_LETTERS = [
        { id: '1', date: '2025-03-20', content: 'Добро пожаловать в неоновый дневник! 💖 Сегодня первый день.' },
        { id: '2', date: '2025-03-21', content: 'Весна пахнет сиренью. Я написал(а) это письмо под шум дождя.' },
        { id: '3', date: '2025-03-22', content: 'Неоновые сердечки летают даже в пасмурный день. Листай стрелками.' },
        { id: '4', date: '2025-03-23', content: 'Каждый день — новая страница. Пиши сюда всё, что хочешь сохранить.' },
    ];

    let letters = [];
    let currentIndex = 0;

    function sortLettersByDateDesc() {
        letters.sort((a, b) => (b.date > a.date) ? 1 : (b.date < a.date) ? -1 : 0);
    }

    function saveLetters() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(letters));
    }

    function loadLetters() {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
            try {
                letters = JSON.parse(stored);
                if (!Array.isArray(letters)) letters = [];
            } catch(e) { letters = []; }
        }
        if (!letters.length) {
            letters = [...DEMO_LETTERS];
            saveLetters();
        }
        sortLettersByDateDesc();
        currentIndex = letters.length ? 0 : -1;
        updateLetterDisplay();
        updateCounter();
    }

    function updateLetterDisplay() {
        const dateEl = document.getElementById('letterDate');
        const textEl = document.getElementById('letterText');
        const prevBtn = document.getElementById('prevLetter');
        const nextBtn = document.getElementById('nextLetter');

        if (!letters.length) {
            dateEl.textContent = '✨';
            textEl.textContent = 'Пока нет писем. Нажми «Админ», чтобы добавить первое 💌';
            prevBtn.classList.add('disabled');
            nextBtn.classList.add('disabled');
            return;
        }

        const letter = letters[currentIndex];
        const formattedDate = new Date(letter.date).toLocaleDateString('ru-RU', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        dateEl.textContent = `📅 ${formattedDate}`;
        textEl.textContent = letter.content;

        prevBtn.classList.toggle('disabled', currentIndex <= 0);
        nextBtn.classList.toggle('disabled', currentIndex >= letters.length - 1);
    }

    function updateCounter() {
        const counter = document.getElementById('letterCounter');
        const total = letters.length;
        const current = total ? currentIndex + 1 : 0;
        counter.textContent = `📩 ${current} / ${total} ${total === 1 ? 'письмо' : 'писем'}`;
    }

    function prevLetter() {
        if (letters.length && currentIndex > 0) {
            currentIndex--;
            updateLetterDisplay();
            updateCounter();
        }
    }

    function nextLetter() {
        if (letters.length && currentIndex < letters.length - 1) {
            currentIndex++;
            updateLetterDisplay();
            updateCounter();
        }
    }

    function addNewLetter(content, dateStr) {
        if (!content.trim()) {
            alert('Напиши что-нибудь в письме 💬');
            return false;
        }
        const useDate = dateStr || new Date().toISOString().slice(0,10);
        const newLetter = {
            id: Date.now() + '' + Math.random().toString(36),
            date: useDate,
            content: content.trim()
        };
        letters.push(newLetter);
        sortLettersByDateDesc();
        currentIndex = letters.findIndex(l => l.id === newLetter.id);
        saveLetters();
        updateLetterDisplay();
        updateCounter();
        return true;
    }

    function resetToDemo() {
        letters = [...DEMO_LETTERS];
        sortLettersByDateDesc();
        currentIndex = 0;
        saveLetters();
        updateLetterDisplay();
        updateCounter();
    }

    // ---------- АДМИН-МОДАЛ ----------
    const modal = document.getElementById('adminModal');
    const showBtn = document.getElementById('showAdminModal');
    const cancelBtn = document.getElementById('cancelModal');
    const saveBtn = document.getElementById('saveLetter');
    const contentInput = document.getElementById('newLetterContent');
    const dateInput = document.getElementById('newLetterDate');
    const resetLink = document.getElementById('resetToDemo');

    function setDefaultDate() {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        dateInput.value = `${yyyy}-${mm}-${dd}`;
    }

    function closeModal() {
        modal.style.display = 'none';
        contentInput.value = '';
    }

    showBtn.addEventListener('click', () => {
        setDefaultDate();
        modal.style.display = 'flex';
    });

    cancelBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    saveBtn.addEventListener('click', () => {
        const content = contentInput.value.trim();
        const date = dateInput.value;
        if (!content) {
            alert('Введите текст письма 💌');
            return;
        }
        if (addNewLetter(content, date)) {
            closeModal();
        }
    });

    resetLink.addEventListener('click', (e) => {
        e.preventDefault();
        if (confirm('Сбросить все письма до демонстрационных?')) {
            resetToDemo();
            closeModal();
        }
    });

    // Навигация
    document.getElementById('prevLetter').addEventListener('click', prevLetter);
    document.getElementById('nextLetter').addEventListener('click', nextLetter);

    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevLetter();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextLetter();
        }
    });

    // Старт
    loadLetters();
})();