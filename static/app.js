/* =========================
   app.js - interactions
   ========================= */

/* ---------- Helpers ---------- */
const qs = (s, root = document) => root.querySelector(s);
const qsa = (s, root = document) => Array.from(root.querySelectorAll(s));

/* ---------- Theme toggle & persistence ---------- */
const themeBtn = qs('#theme-toggle');
const body = document.body;
const savedTheme = localStorage.getItem('theme');

// Apply saved theme on load
if (savedTheme === 'light') {
  body.classList.add('light-mode');
}

const updateThemeButton = () => {
  const isLight = body.classList.contains('light-mode');
  themeBtn.textContent = isLight ? '☀️' : '🌙';
  themeBtn.setAttribute('aria-label', isLight ? 'Mode sombre' : 'Mode clair');
};

// Initial update
updateThemeButton();

themeBtn.addEventListener('click', () => {
  body.classList.toggle('light-mode');
  const theme = body.classList.contains('light-mode') ? 'light' : 'dark';
  localStorage.setItem('theme', theme);
  updateThemeButton();
  console.log('Thème changé:', theme);
});

/* ---------- Mobile nav ---------- */
const navToggle = qs('#nav-toggle');
const navList = qs('#nav-list');

navToggle.addEventListener('click', () => {
  const isOpen = navList.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
});

/* Close mobile nav when link clicked */
qsa('.nav-list a').forEach(link => {
  link.addEventListener('click', () => {
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

/* ---------- Smooth scroll for internal anchors ---------- */
qsa('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    
    // Close mobile menu if open
    navList.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
    
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });
});

/* ---------- Visit counter ---------- */
const visitCounter = qs('#visit-counter');
let visits = parseInt(localStorage.getItem('visits') || '0', 10);
visits += 1;
localStorage.setItem('visits', visits);
visitCounter.textContent = `Visites : ${visits}`;

/* ---------- Carousel (simple, accessible) ---------- */
const track = qs('#carousel-track');
const prevBtn = qs('.carousel-nav.prev');
const nextBtn = qs('.carousel-nav.next');
const dotsWrap = qs('#carousel-dots');

let slides = [];
let currentIndex = 0;

function updateSlidesList() {
  // Get only visible slides
  slides = qsa('.project-card', track).filter(card => card.style.display !== 'none');
}

function createDots() {
  dotsWrap.innerHTML = '';
  slides.forEach((slide, i) => {
    const dot = document.createElement('button');
    dot.className = 'carousel-dot';
    dot.setAttribute('aria-label', `Aller au projet ${i + 1}`);
    if (i === 0) dot.classList.add('active');
    dot.addEventListener('click', () => goTo(i));
    dotsWrap.appendChild(dot);
  });
}

function updateDots() {
  qsa('.carousel-dot', dotsWrap).forEach((dot, i) => {
    dot.classList.toggle('active', i === currentIndex);
  });
}

function goTo(index) {
  if (slides.length === 0) return;
  
  // Wrap around
  if (index < 0) index = slides.length - 1;
  if (index >= slides.length) index = 0;
  
  currentIndex = index;
  
  // Calculate position
  const slideWidth = slides[0].offsetWidth;
  const gap = 20;
  const scrollPosition = index * (slideWidth + gap);
  
  track.scrollTo({
    left: scrollPosition,
    behavior: 'smooth'
  });
  
  updateDots();
}

// Initialize carousel
updateSlidesList();
createDots();

prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
nextBtn.addEventListener('click', () => goTo(currentIndex + 1));

/* Enable swipe on mobile */
let startX = 0;
let isDragging = false;

track.addEventListener('touchstart', (e) => {
  startX = e.touches[0].clientX;
  isDragging = true;
});

track.addEventListener('touchmove', (e) => {
  if (!isDragging) return;
  // Prevent page scroll while swiping
  e.preventDefault();
}, { passive: false });

track.addEventListener('touchend', (e) => {
  if (!isDragging) return;
  isDragging = false;
  
  const endX = e.changedTouches[0].clientX;
  const diff = startX - endX;
  
  if (Math.abs(diff) > 50) { // Minimum swipe distance
    if (diff > 0) {
      goTo(currentIndex + 1);
    } else {
      goTo(currentIndex - 1);
    }
  }
});

/* Update slides array if projects change (filter) */
function refreshCarousel() {
  updateSlidesList();
  createDots();
  goTo(0);
}

/* ---------- Filters ---------- */
const filterBtns = qsa('.filter-btn');
const allProjectCards = qsa('.project-card');

filterBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    // Update active button
    filterBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    
    const filter = btn.getAttribute('data-filter');
    
    // Filter both carousel and grid cards
    allProjectCards.forEach(card => {
      if (filter === 'all' || card.dataset.category === filter) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
    
    // Refresh carousel with filtered slides
    refreshCarousel();
  });
});

/* ---------- Scroll animations (IntersectionObserver) ---------- */
const observerOptions = {
  threshold: 0.2,
  rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('in-view');
    }
  });
}, observerOptions);

// Observe elements for animations
qsa('.hero-content, h2, .about-text p, .cv-card, .project-card, .skill-tag, .contact-form').forEach(el => {
  observer.observe(el);
});

/* ---------- Form validation & submit ---------- */
const form = qs('#contact-form');
const nameInput = qs('#nom');
const emailInput = qs('#email');
const messageInput = qs('#message');
const errNom = qs('#err-nom');
const errEmail = qs('#err-email');
const errMessage = qs('#err-message');
const formStatus = qs('#form-status');
const submitBtn = qs('#submit-btn');

function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function validateField(field) {
  let isValid = true;
  
  if (field === 'nom' || !field) {
    const nomValue = nameInput.value.trim();
    if (!nomValue) {
      errNom.textContent = 'Le nom est requis';
      isValid = false;
    } else if (nomValue.length < 2) {
      errNom.textContent = 'Le nom doit contenir au moins 2 caractères';
      isValid = false;
    } else {
      errNom.textContent = '';
    }
  }
  
  if (field === 'email' || !field) {
    const emailValue = emailInput.value.trim();
    if (!emailValue) {
      errEmail.textContent = 'L\'email est requis';
      isValid = false;
    } else if (!validateEmail(emailValue)) {
      errEmail.textContent = 'Adresse email invalide';
      isValid = false;
    } else {
      errEmail.textContent = '';
    }
  }
  
  if (field === 'message' || !field) {
    const messageValue = messageInput.value.trim();
    if (!messageValue) {
      errMessage.textContent = 'Le message est requis';
      isValid = false;
    } else if (messageValue.length < 10) {
      errMessage.textContent = 'Le message doit contenir au moins 10 caractères';
      isValid = false;
    } else {
      errMessage.textContent = '';
    }
  }
  
  return isValid;
}

/* Real-time validation */
nameInput.addEventListener('input', () => validateField('nom'));
nameInput.addEventListener('blur', () => validateField('nom'));

emailInput.addEventListener('input', () => validateField('email'));
emailInput.addEventListener('blur', () => validateField('email'));

messageInput.addEventListener('input', () => validateField('message'));
messageInput.addEventListener('blur', () => validateField('message'));

/* Form submit */
form.addEventListener('submit', async (e) => {
  e.preventDefault();
  
  // Validate all fields
  const isValid = validateField();
  
  if (!isValid) {
    formStatus.textContent = '⚠️ Veuillez corriger les erreurs ci-dessus';
    formStatus.style.color = '#ff8080';
    return;
  }
  
  // Prevent double submit
  submitBtn.disabled = true;
  formStatus.textContent = '📤 Envoi en cours...';
  formStatus.style.color = 'var(--muted)';
  
  const formData = new FormData(form);
  
  try {
    const response = await fetch(form.action, {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json'
      }
    });
    
    if (response.ok) {
      formStatus.textContent = '✅ Message envoyé avec succès ! Merci de votre contact.';
      formStatus.style.color = '#00ff88';
      form.reset();
      
      // Clear error messages
      errNom.textContent = '';
      errEmail.textContent = '';
      errMessage.textContent = '';
    } else {
      const data = await response.json();
      formStatus.textContent = data.error 
        ? '❌ Erreur : ' + data.error 
        : '❌ Erreur lors de l\'envoi. Veuillez réessayer.';
      formStatus.style.color = '#ff8080';
    }
  } catch (error) {
    console.error('Form submission error:', error);
    formStatus.textContent = '❌ Erreur réseau. Vérifiez votre connexion et réessayez.';
    formStatus.style.color = '#ff8080';
  } finally {
    submitBtn.disabled = false;
  }
});

/* ---------- Misc ---------- */
// Set current year in footer
qs('#year').textContent = new Date().getFullYear();

/* Ensure carousel updates on window resize */
let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    refreshCarousel();
  }, 250);
});

/* ---------- Keyboard navigation for carousel ---------- */
document.addEventListener('keydown', (e) => {
  if (document.activeElement.closest('.carousel')) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(currentIndex - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(currentIndex + 1);
    }
  }
});

console.log('✨ Portfolio chargé avec succès !');