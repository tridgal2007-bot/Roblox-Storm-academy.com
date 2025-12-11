// Navbar Logic
const navbar = document.getElementById('navbar');
const mobileToggle = document.getElementById('mobile-toggle');
const mobileMenu = document.getElementById('mobile-menu');
const mobileLinks = document.querySelectorAll('.mobile-link');

// Scroll Effect
window.addEventListener('scroll', () => {
    if (navbar) {
        if (window.scrollY > 20) {
            navbar.classList.add('bg-storm-dark/95', 'border-storm-accent', 'shadow-lg');
            navbar.classList.remove('border-transparent');
        } else {
            navbar.classList.remove('bg-storm-dark/95', 'border-storm-accent', 'shadow-lg');
            navbar.classList.add('border-transparent');
        }
    }
});

// Mobile Menu Toggle
if (mobileToggle && mobileMenu) {
    mobileToggle.addEventListener('click', () => {
        const isOpen = mobileMenu.classList.contains('opacity-100');
        if (isOpen) {
            mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        } else {
            mobileMenu.classList.add('opacity-100', 'pointer-events-auto');
            mobileMenu.classList.remove('opacity-0', 'pointer-events-none');
        }
    });

    mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileMenu.classList.remove('opacity-100', 'pointer-events-auto');
            mobileMenu.classList.add('opacity-0', 'pointer-events-none');
        });
    });
}

// ----------------------------------------------------
// WINTER / IDLE SYSTEM LOGIC
// ----------------------------------------------------
let isWinterMode = false;
let idleTimer;
const IDLE_LIMIT = 10000; // 10 seconds

function setWinterMode(active) {
    if (isWinterMode === active) return;
    isWinterMode = active;
    
    const body = document.body;
    if (active) {
        body.classList.add('theme-winter');
        // Stop rain immediately to clear canvas for snow
        const rainCanvas = document.getElementById('rain-canvas');
        if(rainCanvas) {
            const ctx = rainCanvas.getContext('2d');
            ctx.clearRect(0,0, rainCanvas.width, rainCanvas.height);
        }
    } else {
        body.classList.remove('theme-winter');
    }
}

function checkDate() {
    const today = new Date();
    // Month is 0-indexed (11 is Dec), Date is 1-indexed (25)
    if (today.getMonth() === 11 && today.getDate() === 25) {
        return true;
    }
    return false;
}

function resetIdleTimer() {
    // If it's Christmas, force winter mode and ignore interaction
    if (checkDate()) {
        setWinterMode(true);
        return;
    }

    // Otherwise, interaction resets to Storm mode
    setWinterMode(false);
    
    clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
        setWinterMode(true);
    }, IDLE_LIMIT);
}

// Initialize Logic
if (checkDate()) {
    setWinterMode(true);
} else {
    // Setup listeners for inactivity
    ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'].forEach(evt => {
        window.addEventListener(evt, resetIdleTimer, { passive: true });
    });
    // Start initial timer
    resetIdleTimer();
}


// ----------------------------------------------------
// VFX: Rain and Lightning OR Snow
// ----------------------------------------------------
const rainCanvas = document.getElementById('rain-canvas');
const lightningCanvas = document.getElementById('lightning-canvas');
const flashOverlay = document.getElementById('lightning-flash-overlay');

if (rainCanvas && lightningCanvas) {
    const ctxRain = rainCanvas.getContext('2d');
    const ctxLightning = lightningCanvas.getContext('2d');

    let w = window.innerWidth;
    let h = window.innerHeight;

    const resize = () => {
        w = window.innerWidth;
        h = window.innerHeight;
        rainCanvas.width = w;
        rainCanvas.height = h;
        lightningCanvas.width = w;
        lightningCanvas.height = h;
    };
    window.addEventListener('resize', resize);
    resize();

    // --- RAIN PARTICLES ---
    const raindrops = [];
    const maxRainDrops = 150;
    for (let i = 0; i < maxRainDrops; i++) {
        raindrops.push({
            x: Math.random() * w,
            y: Math.random() * h,
            speed: Math.random() * 15 + 10,
            len: Math.random() * 20 + 10,
        });
    }

    // --- SNOW PARTICLES ---
    const snowflakes = [];
    const maxSnowFlakes = 100;
    for (let i = 0; i < maxSnowFlakes; i++) {
        snowflakes.push({
            x: Math.random() * w,
            y: Math.random() * h,
            radius: Math.random() * 3 + 1,
            speed: Math.random() * 1 + 0.5,
            wind: Math.random() * 2 - 1, // Side to side drift
            angle: Math.random() * Math.PI * 2
        });
    }

    function drawRain() {
        ctxRain.clearRect(0, 0, w, h);
        ctxRain.strokeStyle = 'rgba(174, 194, 224, 0.3)';
        ctxRain.lineWidth = 1;
        ctxRain.lineCap = 'round';

        ctxRain.beginPath();
        for (let i = 0; i < maxRainDrops; i++) {
            const d = raindrops[i];
            ctxRain.moveTo(d.x, d.y);
            ctxRain.lineTo(d.x, d.y + d.len);

            d.y += d.speed;
            d.x -= 1; // Slight wind

            if (d.y > h) {
                d.y = -20;
                d.x = Math.random() * w;
            }
        }
        ctxRain.stroke();
    }

    function drawSnow() {
        ctxRain.clearRect(0, 0, w, h);
        ctxRain.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctxRain.shadowBlur = 5;
        ctxRain.shadowColor = 'white';

        ctxRain.beginPath();
        for (let i = 0; i < maxSnowFlakes; i++) {
            const s = snowflakes[i];
            ctxRain.moveTo(s.x, s.y);
            ctxRain.arc(s.x, s.y, s.radius, 0, Math.PI * 2);

            // Update physics
            s.y += s.speed;
            s.angle += 0.02;
            s.x += Math.sin(s.angle) * 0.5 + (s.wind * 0.2);

            if (s.y > h) {
                s.y = -10;
                s.x = Math.random() * w;
            }
            if (s.x > w) s.x = 0;
            if (s.x < 0) s.x = w;
        }
        ctxRain.fill();
        ctxRain.shadowBlur = 0; // Reset
    }

    // --- LIGHTNING LOGIC (Only runs if NOT winter) ---
    let isFlashing = false;
    function flash() {
        if (isFlashing || isWinterMode) return; // No lightning in winter
        isFlashing = true;

        if (flashOverlay) {
            flashOverlay.style.opacity = (Math.random() * 0.3 + 0.1).toString();
            setTimeout(() => {
                flashOverlay.style.opacity = '0';
            }, 100);
        }

        const startX = Math.random() * w;
        
        ctxLightning.strokeStyle = '#ffffff';
        ctxLightning.shadowBlur = 20;
        ctxLightning.shadowColor = '#818cf8';
        ctxLightning.lineWidth = 2;
        
        ctxLightning.beginPath();
        ctxLightning.moveTo(startX, 0);
        
        let currentX = startX;
        let currentY = 0;
        
        while (currentY < h) {
            const newX = currentX + (Math.random() * 40 - 20);
            const newY = currentY + (Math.random() * 30 + 10);
            ctxLightning.lineTo(newX, newY);
            currentX = newX;
            currentY = newY;
        }
        ctxLightning.stroke();

        setTimeout(() => {
            ctxLightning.clearRect(0, 0, w, h);
            isFlashing = false;
            scheduleFlash();
        }, 150);
    }

    function scheduleFlash() {
        // If winter mode is active, check again in a few seconds but don't flash
        if (isWinterMode) {
            setTimeout(scheduleFlash, 2000);
            return;
        }
        const delay = Math.random() * 5000 + 2000;
        setTimeout(flash, delay);
    }
    scheduleFlash();

    // --- MAIN LOOP ---
    function animateVFX() {
        if (isWinterMode) {
            drawSnow();
        } else {
            drawRain();
        }
        requestAnimationFrame(animateVFX);
    }
    animateVFX();
}

// ----------------------------------------------------
// QUIRK SYSTEM LOGIC
// ----------------------------------------------------

const RARITY_THEMES = {
    'MÍTICO': { 
        bg: 'bg-red-600',
        text: 'text-red-500',
        border: 'border-red-500',
        colorHex: '#dc2626',
        display: 'MYTHICAL'
    },
    'LENDÁRIO': { 
        bg: 'bg-orange-500',
        text: 'text-orange-400',
        border: 'border-orange-500',
        colorHex: '#e2b900ff',
        display: 'LEGENDARY'
    },
    'ÉPICO': { 
        bg: 'bg-purple-600',
        text: 'text-purple-400',
        border: 'border-purple-500',
        colorHex: '#9333ea',
        display: 'EPIC'
    },
    'RARO': { 
        bg: 'bg-blue-500',
        text: 'text-blue-400',
        border: 'border-blue-500',
        colorHex: '#3b82f6',
        display: 'RARE'
    },
    'INCOMUM': { 
        bg: 'bg-emerald-500',
        text: 'text-emerald-400',
        border: 'border-emerald-500',
        colorHex: '#10b981',
        display: 'UNCOMMON'
    },
    'COMUM': { 
        bg: 'bg-slate-500',
        text: 'text-slate-300',
        border: 'border-slate-400',
        colorHex: '#64748b',
        display: 'COMMON'
    }
};

// Static Image for profile
const PLACEHOLDER_IMG = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Crect width='400' height='400' fill='transparent'/%3E%3Cpath d='M200,100 C240,100 270,130 270,170 C270,210 240,240 200,240 C160,240 130,210 130,170 C130,130 160,100 200,100 Z M100,350 C100,280 150,260 200,260 C250,260 300,280 300,350 L100,350 Z' fill='%23111' opacity='0.3'/%3E%3C/svg%3E";

const quirksData = [
    // LENDÁRIO (2)
    {
        id: 'explosion-x',
        name: 'EXPLOSION X',
        desc: 'O usuário possui glândulas explosivas super-evoluídas capazes de gerar explosões colossais a partir do suor nitroglicerínico do corpo. Na forma Lendária, a quirk libera uma energia explosiva tão intensa que cria propulsão aérea ilimitada, impactos sísmicos, ondas de choque cortantes e explosões acumuladas capazes de devastar tudo ao redor.',
        rarity: 'LENDÁRIO',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-explosion-x'
    },
    {
        id: 'electrik-x',
        name: 'ELECTRIK X',
        desc: 'O usuário se transforma em uma fonte viva de energia elétrica, capaz de gerar tempestades internas e controlar eletricidade em escala massiva. Seus nervos funcionam como circuitos avançados que conduzem milhões de volts, permitindo ataques instantâneos, velocidade sobre-humana e descargas capazes de destruir tudo ao redor.',
        rarity: 'LENDÁRIO',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-electrik-x'
    },
    // ÉPICO (1)
    {
        id: 'engine-plus',
        name: 'ENGINE+',
        desc: 'O usuário possui motores biológicos ultra-potentes embutidos nas pernas (ou pernas e braços, dependendo da evolução). Esses motores funcionam como turbinas vivas capazes de gerar impulsos extremos, permitindo velocidade absurda, arranques instantâneos, manobras aéreas e chutes devastadores. Na classe Épica, o usuário pode alternar entre diferentes “Modos de Propulsão”, cada um especializado em velocidade, força ou mobilidade. Os motores também podem superaquecer, ativando efeitos temporários que aumentam drasticamente o poder — mas exigem cooldown.',
        rarity: 'ÉPICO',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-engine-plus'
    },
    // RARO (3)
    {
        id: 'dark-shadow',
        name: 'DARK SHADOW',
        desc: 'O usuário controla uma entidade sombria viva que nasce da própria sombra. O Dark Shadow age como um parceiro de combate, podendo atacar, defender ou se mover independentemente do usuário. Em ambientes escuros, torna-se extremamente poderoso, ganhando força, velocidade e tamanho. Porém, quanto mais forte ele fica, mais difícil é controlá-lo. Em locais muito iluminados, o Dark Shadow enfraquece, ficando pequeno e menos agressivo.',
        rarity: 'RARO',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-dark-shadow'
    },
    {
        id: 'armada-animal',
        name: 'ARMADA ANIMAL',
        desc: 'O usuário possui a habilidade de invocar e comandar uma força inteira de criaturas animais, cada uma com funções específicas: ataque, defesa, rastreamento, suporte e distração. As criaturas são formadas por energia espiritual e surgem a partir das marcas animais que aparecem no corpo do usuário. Quanto maior a criatura ou a quantidade invocada, mais energia o usuário gasta. A Armada não controla a vontade própria — segue apenas os comandos diretos do usuário, podendo agir como um exército coordenado.',
        rarity: 'RARO',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-armada-animal'
    },
    {
        id: 'zero-gravity',
        name: 'ZERO GRAVITY',
        desc: 'O usuário pode remover completamente a gravidade de qualquer objeto que tocar, fazendo-o flutuar livremente pelo ar. Quanto mais tempo o objeto fica sem gravidade, mais leve e imprevisível ele se torna. O usuário pode acumular vários objetos flutuantes ao mesmo tempo e, quando quiser, reativar a gravidade de todos eles de uma vez, causando quedas violentas, explosões de impacto e ataques inesperados. Com treino, o usuário consegue manipular a direção, velocidade e colisão dos objetos suspensos, criando combos devastadores.',
        rarity: 'RARO',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-zero-gravity'
    },
    // INCOMUM (2)
    {
        id: 'acid',
        name: 'ACID',
        desc: 'O usuário produz um líquido corrosivo que pode variar entre ácido fraco e extremamente tóxico. O ácido pode ser lançado como projétil, espalhado pelo chão ou usado para derreter objetos. O usuário também pode controlar a viscosidade, tornando-o mais espesso para prender inimigos ou mais fluido para aumentar o alcance. Quanto mais potente o ácido, maior o risco de o próprio usuário sofrer queimaduras se não controlar bem a quirk.',
        rarity: 'INCOMUM',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-acid'
    },
    {
        id: 'pop-off',
        name: 'POP OFF',
        desc: 'O usuário possui esferas adesivas na cabeça que podem ser arrancadas e lançadas como projéteis. As esferas grudam em qualquer superfície — chão, paredes, inimigos — e o tempo de adesão varia conforme a força do usuário. Elas podem ser usadas para imobilizar, criar armadilhas, rebater ataques ou até para saltos rápidos ao grudar nelas. Quanto mais esferas o usuário arranca de uma vez, mais forte fica a dor na cabeça, podendo causar tontura.',
        rarity: 'INCOMUM',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-pop-off'
    },
    // COMUM (2)
    {
        id: 'tail',
        name: 'TAIL',
        desc: 'O usuário possui uma cauda forte, flexível e totalmente controlável. A cauda pode ser usada para ataques simples, agarrar objetos ou equilibrar o corpo em movimentos rápidos. Embora não tenha grande poder ofensivo, aumenta bastante a mobilidade e permite manobras acrobáticas.',
        rarity: 'COMUM',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-tail'
    },
    {
        id: 'invisible',
        name: 'INVISIBLE',
        desc: 'O usuário pode tornar o próprio corpo invisível, desaparecendo completamente da visão dos inimigos. A quirk é ótima para furtividade e emboscadas, mas não remove o som dos passos nem o cheiro do usuário. Ataques realizados enquanto invisível fazem o corpo piscar rapidamente, revelando a posição por alguns segundos.',
        rarity: 'COMUM',
        imageUrl: PLACEHOLDER_IMG,
        vfx: 'vfx-invisible'
    }
];

const classButtonsContainer = document.getElementById('class-buttons');
const classTitle = document.getElementById('class-title');
const classDesc = document.getElementById('class-desc');
const classImage = document.getElementById('class-image');
const classImageContainer = document.getElementById('class-image-container');
const rarityBadge = document.getElementById('rarity-badge');
const quirkIdDisplay = document.getElementById('quirk-id-display');
const quirkVfxContainer = document.getElementById('quirk-vfx-container');

let activeBtn = null;

if (classButtonsContainer) {
    classButtonsContainer.innerHTML = '';

    quirksData.forEach((quirk, index) => {
        const theme = RARITY_THEMES[quirk.rarity] || RARITY_THEMES['COMUM'];

        const btn = document.createElement('div');
        
        // Initial classes (Inactive State)
        btn.className = `
            relative cursor-pointer group 
            bg-[#1e293b] 
            border-l-4 ${theme.border} 
            border-y border-r border-black
            p-3
            mb-2 
            transition-all duration-200
            hover:bg-[#334155] hover:pl-5
        `;

        btn.innerHTML = `
            <div class="flex items-center justify-between relative z-10 pointer-events-none">
                <div class="flex flex-col">
                    <span class="font-comic text-xl tracking-wide uppercase transition-colors text-white group-hover:text-storm-accent">${quirk.name}</span>
                    <span class="font-tech text-xs font-bold ${theme.text} uppercase tracking-widest opacity-80">${quirk.rarity}</span>
                </div>
                <i data-lucide="chevron-right" class="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity"></i>
            </div>
        `;
        
        btn.onclick = (e) => {
            e.preventDefault();
            
            // Deactivate previous
            if (activeBtn) {
                activeBtn.className = `
                    relative cursor-pointer group 
                    bg-[#1e293b] 
                    border-l-4 
                    border-y border-r border-black
                    p-3
                    mb-2 
                    transition-all duration-200
                    hover:bg-[#334155] hover:pl-5
                `;
                const prevTheme = RARITY_THEMES[activeBtn.dataset.rarity];
                activeBtn.classList.add(prevTheme.border);
            }
            
            activeBtn = btn;
            activeBtn.dataset.rarity = quirk.rarity; 
            
            // Activate current
            btn.className = `
                relative cursor-pointer 
                bg-black 
                border-l-8 ${theme.border}
                border-y border-r border-white/20
                p-3 pl-6
                mb-2 
                transition-all duration-200
                shadow-[inset_0_0_20px_rgba(0,0,0,0.5)]
            `;

            selectQuirk(quirk);
        };
        
        classButtonsContainer.appendChild(btn);
    });

    function selectQuirk(quirk) {
        const theme = RARITY_THEMES[quirk.rarity] || RARITY_THEMES['COMUM'];

        if(classImage) {
            classImage.style.opacity = '0';
            classImage.style.transform = 'scale(0.95)';
        }

        const idNum = Math.floor(Math.random() * 900) + 100;
        if(quirkIdDisplay) quirkIdDisplay.innerText = idNum;

        setTimeout(() => {
            if(classTitle) {
                classTitle.innerText = quirk.name;
                classTitle.className = `font-comic text-4xl md:text-6xl italic uppercase leading-none mb-4 text-stroke-black drop-shadow-[3px_3px_0px_#000] transform -skew-x-6 origin-bottom-left text-white`;
            }
            
            if(classDesc) {
                classDesc.innerText = quirk.desc;
            }

            if(rarityBadge) {
                rarityBadge.className = `transform skew-x-[-12deg] ${theme.bg} text-white px-4 py-1 font-comic uppercase text-base md:text-xl border-2 border-black shadow-[3px_3px_0px_#000] inline-block`;
                rarityBadge.innerHTML = `<span class="transform skew-x-[12deg] inline-block">${theme.display}</span>`;
            }

            if (classImageContainer) {
                classImageContainer.style.backgroundColor = theme.colorHex;
                classImageContainer.style.borderColor = "#000";
            }

            if (quirkVfxContainer) {
                quirkVfxContainer.className = "absolute inset-0 z-10 pointer-events-none mix-blend-screen transition-opacity duration-500"; 
                if (quirk.vfx) {
                    quirkVfxContainer.classList.add(quirk.vfx);
                }
            }
            
            if(classImage) {
                classImage.src = quirk.imageUrl;
                setTimeout(() => {
                    classImage.style.opacity = '0.4'; 
                    classImage.style.transform = 'scale(1)';
                }, 50);
            }
            
            if (window.lucide) window.lucide.createIcons();

        }, 100);
    }

    if (quirksData.length > 0) {
        const firstBtn = classButtonsContainer.firstElementChild;
        if(firstBtn) firstBtn.click();
    }
}