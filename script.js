
// ===== MA PETITE CONFIG =====
const config = {
    graph: {
        particleCount: 50, // J'ai réduit à 50 pour que ce soit moins le bazar
        connectionDistance: 150,
        mouseDistance: 150, // La souris influence moins loin
        particleSpeed: 0.2, // Ça bouge plus doucement (zen)
        particleSize: 2
    }
};

// ===== GESTION DU THÈME (JOUR/NUIT) =====
// ===== LE SLIDER MÉTÉO POUR CHANGER DE THÈME =====
const themeSlider = document.getElementById('themeSlider');
const html = document.documentElement;

// Je définis mes palettes de couleurs ici (en RGB pour pouvoir faire des transitions stylées)
const themes = {
    light: {
        '--bg-primary': [250, 247, 242],    // #FAF7F2
        '--bg-secondary': [250, 247, 242],  // #FAF7F2
        '--text-primary': [26, 22, 18],     // #1A1612
        '--text-secondary': [61, 52, 42],   // #3D342A
        '--earth-brown': [139, 115, 85],    // #8B7355
        '--cyan-primary': [0, 206, 209]     // #00CED1
    },
    dark: {
        '--bg-primary': [26, 22, 18],       // #1A1612
        '--bg-secondary': [26, 22, 18],     // #1A1612
        '--text-primary': [245, 230, 211],  // #F5E6D3
        '--text-secondary': [232, 220, 196],// #E8DCC4
        '--earth-brown': [212, 165, 116],   // #D4A574
        '--cyan-primary': [0, 229, 232]     // #00E5E8
    }
};

// Une petite fonction de maths pour les transitions fluides (lerp)
function lerp(start, end, t) {
    return start * (1 - t) + end * t;
}

// C'est ici que la magie opère pour changer le thème selon le slider
function updateTheme(value) {
    const t = value / 100; // On ramène tout entre 0 et 1

    // On calcule la couleur intermédiaire pour chaque variable
    for (const [variable, lightColor] of Object.entries(themes.light)) {
        const darkColor = themes.dark[variable];

        // Pour le texte, on change direct à 50% sinon c'est illisible
        // Pour le fond, on garde le dégradé tout doux
        let localT = t;
        if (!variable.includes('bg-')) {
            localT = t < 0.5 ? 0 : 1;
        }

        const r = Math.round(lerp(lightColor[0], darkColor[0], localT));
        const g = Math.round(lerp(lightColor[1], darkColor[1], localT));
        const b = Math.round(lerp(lightColor[2], darkColor[2], localT));

        html.style.setProperty(variable, `rgb(${r}, ${g}, ${b})`);
    }

    // On cache le soleil quand le nuage passe devant (logique)
    const sun = document.querySelector('.sun-bg');
    if (sun) {
        sun.style.opacity = 1 - t;
    }

    // On sauvegarde le choix de l'utilisateur (cookie style)
    const mode = t > 0.5 ? 'dark' : 'light';
    html.setAttribute('data-theme', mode); // Pour que le CSS sache quoi faire
    localStorage.setItem('themeValue', value);
}

// On lance tout au démarrage
const savedValue = localStorage.getItem('themeValue') || '0';
if (themeSlider) {
    themeSlider.value = savedValue;
    updateTheme(savedValue);

    themeSlider.addEventListener('input', (e) => {
        updateTheme(e.target.value);
    });
}

// ===== LE MENU BURGER POUR MOBILE =====
const mobileMenuToggle = document.getElementById('mobileMenuToggle');
const navMenu = document.getElementById('navMenu');

if (mobileMenuToggle) {
    mobileMenuToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');

        // On anime les barres du menu burger
        const spans = mobileMenuToggle.querySelectorAll('span');
        if (navMenu.classList.contains('active')) {
            spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
            spans[1].style.opacity = '0';
            spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
        } else {
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }
    });

    // On ferme le menu quand on clique sur un lien (ergonomie !)
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            const spans = mobileMenuToggle.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        });
    });
}

// ===== L'ANIMATION DU FOND (PARTICULES) =====
const canvas = document.getElementById('graphCanvas');
const ctx = canvas.getContext('2d');
let width, height;
let particles = [];
let mouse = { x: null, y: null };

// Ma classe pour gérer chaque particule
class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.vx = (Math.random() - 0.5) * config.graph.particleSpeed;
        this.vy = (Math.random() - 0.5) * config.graph.particleSpeed;
        this.size = Math.random() * config.graph.particleSize + 1;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;

        // Boing ! Ça rebondit sur les murs
        if (this.x < 0 || this.x > width) this.vx *= -1;
        if (this.y < 0 || this.y > height) this.vy *= -1;

        // Les particules fuient la souris (mais doucement)
        if (mouse.x != null) {
            let dx = mouse.x - this.x;
            let dy = mouse.y - this.y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.graph.mouseDistance) {
                const forceDirectionX = dx / distance;
                const forceDirectionY = dy / distance;
                const force = (config.graph.mouseDistance - distance) / config.graph.mouseDistance;
                // J'ai mis une force toute douce pour pas que ça explose
                const directionX = forceDirectionX * force * 0.05;
                const directionY = forceDirectionY * force * 0.05;

                this.vx -= directionX;
                this.vy -= directionY;
            }
        }
    }

    draw() {
        const isDark = html.getAttribute('data-theme') === 'dark';
        ctx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.5)' : 'rgba(33, 37, 41, 0.5)';
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function initGraph() {
    resizeCanvas();
    particles = [];
    // Moins de particules sur mobile pour pas faire laguer le téléphone
    const count = window.innerWidth < 768 ? 40 : config.graph.particleCount;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function resizeCanvas() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
}

function animateGraph() {
    ctx.clearRect(0, 0, width, height);

    const isDark = html.getAttribute('data-theme') === 'dark';
    const lineColor = isDark ? '255, 255, 255' : '33, 37, 41';

    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();

        // On relie les points entre eux
        for (let j = i; j < particles.length; j++) {
            let dx = particles[i].x - particles[j].x;
            let dy = particles[i].y - particles[j].y;
            let distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < config.graph.connectionDistance) {
                ctx.beginPath();
                let opacity = 1 - (distance / config.graph.connectionDistance);
                ctx.strokeStyle = `rgba(${lineColor}, ${opacity * 0.2})`;
                ctx.lineWidth = 1;
                ctx.moveTo(particles[i].x, particles[i].y);
                ctx.lineTo(particles[j].x, particles[j].y);
                ctx.stroke();
            }
        }
    }
    requestAnimationFrame(animateGraph);
}

// On écoute ce qui se passe (resize, souris...)
window.addEventListener('resize', () => {
    resizeCanvas();
    initGraph();
});

window.addEventListener('mousemove', (e) => {
    mouse.x = e.x;
    mouse.y = e.y;
});

window.addEventListener('mouseout', () => {
    mouse.x = null;
    mouse.y = null;
});

// On lance tout au démarrage
initGraph();
animateGraph();


// ===== LE SCROLL TOUT DOUX =====
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// ===== QUELLE SECTION EST ACTIVE ? =====
const sections = document.querySelectorAll('section');
const navLinks = document.querySelectorAll('.nav-link');

function updateActiveNav() {
    let current = '';

    sections.forEach(section => {
        const sectionTop = section.offsetTop;
        const sectionHeight = section.clientHeight;
        if (pageYOffset >= (sectionTop - 300)) {
            current = section.getAttribute('id');
        }
    });

    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${current}`) {
            link.classList.add('active');
        }
    });
}

// On ne fait ça que sur l'accueil, sinon ça plante
if (document.getElementById('home')) {
    window.addEventListener('scroll', updateActiveNav);
}

// ===== LES ÉLÉMENTS QUI APPARAISSENT AU SCROLL =====
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const fadeObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('fade-in');
            fadeObserver.unobserve(entry.target); // Juste une fois, on va pas le refaire à chaque fois
        }
    });
}, observerOptions);

// On surveille quand les éléments arrivent à l'écran
document.querySelectorAll('.project-card, .value-item, .contact-card, .cv-block, .timeline-item, .experience-item').forEach(el => {
    el.style.opacity = '0';
    fadeObserver.observe(el);
});

// ===== LES BARRES DE SKILLS QUI SE REMPLISSENT =====
const skillsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const progressBars = entry.target.querySelectorAll('.skill-progress');
            progressBars.forEach((bar, index) => {
                setTimeout(() => {
                    // On récupère le pourcentage de skill depuis le HTML
                    // Au début c'est vide
                    // Comme défini dans le HTML
                    const progress = bar.getAttribute('data-progress') || '80';
                    bar.style.width = progress + '%';
                }, index * 100);
            });
            skillsObserver.unobserve(entry.target);
        }
    });
}, { threshold: 0.2 });

const skillsSection = document.querySelector('.skills-section');
if (skillsSection) {
    skillsObserver.observe(skillsSection); // On déclenche quand on voit la section
    // On pourrait faire un par un mais tout le bloc c'est bien aussi
    document.querySelectorAll('.skill-item').forEach(item => {
        skillsObserver.observe(item);
    });
}

// ===== UN PETIT EAST EGG DANS LA CONSOLE =====
console.log('%c Portfolio Redesigned', 'color: #212529; font-size: 20px; font-weight: bold; background: #f8f9fa; padding: 10px; border: 1px solid #dee2e6;');
console.log('%c Neutral & Original Theme', 'color: #6c757d; font-size: 14px;');

// ===== LA GALERIE D'IMAGES (LIGHTBOX) =====
const lightboxModal = document.getElementById('lightboxModal');
if (lightboxModal) {
    const lightboxImg = document.getElementById('lightboxImage');
    const captionText = document.getElementById('caption');
    const closeBtn = document.querySelector('.close-btn');
    const prevBtn = document.querySelector('.prev-btn');
    const nextBtn = document.querySelector('.next-btn');

    // On chope toutes les images
    const galleryImages = document.querySelectorAll('.gallery-card img');
    let currentImageIndex = 0;

    // Hop, on ouvre l'image en grand
    galleryImages.forEach((img, index) => {
        img.addEventListener('click', () => {
            lightboxModal.style.display = "block";
            lightboxImg.src = img.src;
            captionText.innerHTML = img.alt;
            currentImageIndex = index;
            document.body.style.overflow = 'hidden'; // On bloque le scroll derrière
        });
    });

    // On ferme la fenêtre
    function closeLightbox() {
        lightboxModal.style.display = "none";
        document.body.style.overflow = 'auto'; // On peut scroller de nouveau
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', closeLightbox);
    }

    // Pour passer à l'image suivante/précédente
    function showImage(index) {
        if (index >= galleryImages.length) {
            currentImageIndex = 0;
        } else if (index < 0) {
            currentImageIndex = galleryImages.length - 1;
        } else {
            currentImageIndex = index;
        }

        const img = galleryImages[currentImageIndex];
        lightboxImg.src = img.src;
        captionText.innerHTML = img.alt;
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showImage(currentImageIndex - 1);
        });
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showImage(currentImageIndex + 1);
        });
    }

    // Si on clique à côté, ça ferme
    lightboxModal.addEventListener('click', (e) => {
        if (e.target === lightboxModal) {
            closeLightbox();
        }
    });

    // On peut aussi utiliser les flèches du clavier (accessibilité !)
    document.addEventListener('keydown', (e) => {
        if (lightboxModal.style.display === "block") {
            if (e.key === "ArrowLeft") {
                showImage(currentImageIndex - 1);
            } else if (e.key === "ArrowRight") {
                showImage(currentImageIndex + 1);
            } else if (e.key === "Escape") {
                closeLightbox();
            }
        }
    });
}

// ===== LES FILTRES POUR TRIER MES PROJETS =====
const filterButtons = document.querySelectorAll('.filter-btn');
const projectCards = document.querySelectorAll('.project-card');

filterButtons.forEach(button => {
    button.addEventListener('click', () => {
        // On désactive les autres boutons
        filterButtons.forEach(btn => btn.classList.remove('active'));
        // On active celui qu'on vient de cliquer
        button.classList.add('active');

        const filterValue = button.getAttribute('data-filter');

        projectCards.forEach(card => {
            if (filterValue === 'all' || card.getAttribute('data-category') === filterValue) {
                card.style.display = 'flex';
                // Une petite animation sympa
                card.style.opacity = '0';
                setTimeout(() => {
                    card.style.opacity = '1';
                }, 50);
            } else {
                card.style.display = 'none';
            }
        });
    });
});

// ===== RENDRE TOUTE LA CARTE PROJET CLIQUABLE =====
document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('click', (e) => {
        // On évite de déclencher deux fois si on clique directement sur le lien
        if (e.target.tagName === 'A' || e.target.closest('a')) return;

        const link = card.querySelector('.btn-detail');
        if (link) {
            window.location.href = link.href;
        }
    });
});

// ===== LA BARRE DE PROGRESSION EN HAUT =====
window.addEventListener('scroll', () => {
    const scrollProgress = document.getElementById('scrollProgress');
    if (scrollProgress) {
        const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
        const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
        const scrolled = (winScroll / height) * 100;
        scrollProgress.style.width = scrolled + '%';
    }
});

// ===== LE BOUTON THÈME SUR MOBILE =====
const mobileThemeToggle = document.getElementById('mobileThemeToggle');
const sunIcon = document.querySelector('.sun-icon');
const moonIcon = document.querySelector('.moon-icon');

if (mobileThemeToggle) {
    mobileThemeToggle.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        const isDark = currentTheme === 'dark';

        // On inverse la valeur (0 = Jour, 100 = Nuit)
        const newValue = isDark ? 0 : 100;

        // On applique le changement
        updateTheme(newValue);

        // On met à jour le slider si on est sur PC
        if (themeSlider) {
            themeSlider.value = newValue;
        }

        // On change l'icône (Soleil/Lune)
        updateMobileIcon(isDark ? 'light' : 'dark');
    });
}

function updateMobileIcon(theme) {
    if (theme === 'dark') {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    } else {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    }
}

// On synchronise tout au chargement de la page
// On reprend la valeur sauvegardée
const currentMode = document.documentElement.getAttribute('data-theme') || 'light';
updateMobileIcon(currentMode);
