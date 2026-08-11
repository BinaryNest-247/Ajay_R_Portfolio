const body = document.body;
const navToggle = document.querySelector('.nav-toggle');
const siteNav = document.querySelector('.site-nav');
const themeToggle = document.querySelector('.theme-toggle');
const galleryFrameImage = document.querySelector('.gallery-frame img');
const galleryCaption = document.querySelector('.gallery-frame .gallery-caption');
const galleryThumbs = document.querySelectorAll('.gallery-thumb');
const galleryPrev = document.querySelector('.gallery-nav.prev');
const galleryNext = document.querySelector('.gallery-nav.next');
const certCards = document.querySelectorAll('.cert-card');
const projectFilterButtons = document.querySelectorAll('.project-filter-btn');
const skillControls = document.querySelectorAll('.skill-control');
const skillPanels = document.querySelectorAll('.skill-panel');
const contactForm = document.querySelector('#contact-form');
const siteNavLinks = document.querySelectorAll('.site-nav a');
const scrollButtons = document.querySelectorAll('[data-scroll]');
const cursorDot = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
const isReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const trailPool = [];
let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let cursorX = mouseX;
let cursorY = mouseY;
const modalViewer = document.querySelector('.modal-viewer');
const viewerFrame = document.querySelector('.viewer-frame');
const modalCaption = document.querySelector('.modal-caption');
const modalClose = modalViewer ? modalViewer.querySelector('.modal-close') : null;
const viewerPrev = modalViewer ? modalViewer.querySelector('.modal-prev') : null;
const viewerNext = modalViewer ? modalViewer.querySelector('.modal-next') : null;

const galleryItems = [
  { src: 'DataMind_01_Home.png', caption: 'DataMind AI home screen' },
  { src: 'DataMind_02_Upload.png', caption: 'Dataset upload screen' },
  { src: 'DataMind_03_Machine_Learning.png', caption: 'Machine learning workspace' },
  { src: 'DataMind_04_EDA.png', caption: 'Exploratory analysis overview' },
  { src: 'DataMind_05_Explainable_AI.png', caption: 'Explainable AI screen' },
  { src: 'DataMind_06_Report.png', caption: 'Automated report generation' }
];

const achievementItems = [
  { src: '09_NASA_Space_Apps_2025.jpg', title: 'NASA International Space Apps Challenge 2025' },
  { src: '10_Final_Reboot_2.5.jpg', title: 'Final Reboot 2.5' }
];

const certItems = [
  { src: '04_Certificate_Statistics_Foundations.pdf', title: 'Statistics Foundations' },
  { src: 'AI and Disaster Management.pdf', title: 'AI and Disaster Management' },
  { src: 'Excel Basics for Data Analysis.pdf', title: 'Excel Basics for Data Analysis' },
  { src: 'Improving Deep Neural Networks.pdf', title: 'Improving Deep Neural Networks' },
  { src: 'Introduction to Tableau.pdf', title: 'Introduction to Tableau' },
  { src: 'Machine Learning with Python.pdf', title: 'Machine Learning with Python' },
  { src: 'Numerical Computing with Python Essentials.pdf', title: 'Numerical Computing with Python Essentials' },
  { src: 'Oracle.pdf', title: 'OCI Data Science Professional' },
  { src: 'What is Data Science.pdf', title: 'What is Data Science?' }
];

let currentViewerSource = 'gallery';
let currentViewerIndex = 0;
let currentSectionId = '';
const validSections = ['home','about','skills','projects','achievements','certifications','experience','resume','contact'];

const normalizeSectionId = value => String(value || '').replace('#', '').toLowerCase();
const getRouteId = (route) => {
  const id = normalizeSectionId(route || location.hash);
  return validSections.includes(id) ? id : 'home';
};

const getHeaderOffset = () => {
  const header = document.querySelector('.site-header');
  const height = header ? header.getBoundingClientRect().height : 0;
  return Math.max(height, 70) + 8;
};

const scrollToSection = (sectionId, behavior = 'smooth') => {
  const target = document.getElementById(sectionId) || document.getElementById('home');
  if (!target) return;
  const top = window.pageYOffset + target.getBoundingClientRect().top - getHeaderOffset();
  window.scrollTo({ top, behavior });
};

const setActiveSection = (sectionId, options = {}) => {
  const id = normalizeSectionId(sectionId) || 'home';
  const target = document.getElementById(id) || document.getElementById('home');
  if (!target) return;

  document.querySelectorAll('main > section[id]').forEach(section => {
    section.classList.toggle('section-active', section.id === id);
  });

  currentSectionId = id;
  updateActiveNav();

  if (options.scrollTo !== false) {
    requestAnimationFrame(() => scrollToSection(id, options.behavior || 'smooth'));
  }
};

const setTheme = theme => {
  if (theme === 'light') {
    body.classList.add('light');
  } else {
    body.classList.remove('light');
  }
  const portrait = document.querySelector('.hero-portrait');
  if (portrait) {
    const lightSrc = portrait.dataset.srcLight;
    const darkSrc = portrait.dataset.srcDark;
    portrait.src = theme === 'light' && lightSrc ? lightSrc : (darkSrc || portrait.src);
  }
  localStorage.setItem('portfolio-theme', theme);
};

const updateActiveNav = () => {
  siteNavLinks.forEach(link => {
    const href = link.getAttribute('href') || '';
    const hash = href.startsWith('#') ? href.slice(1) : href;
    const active = hash === currentSectionId;
    link.classList.toggle('active', active);
    if (active) link.setAttribute('aria-current', 'page');
    else link.removeAttribute('aria-current');
  });
};

const applySection = (sectionId, opts = {}) => {
  setActiveSection(sectionId, opts);
  siteNav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
};

const navigateTo = (sectionId) => {
  const id = getRouteId(sectionId);
  const desiredHash = `#${id}`;

  if (location.hash !== desiredHash) {
    history.pushState(null, '', desiredHash);
  }

  applySection(id, { scrollTo: true });
};

const setActiveSkillPanel = category => {
  skillControls.forEach(control => control.classList.toggle('active', control.dataset.category === category));
  skillPanels.forEach(panel => panel.classList.toggle('active', panel.dataset.category === category || category === 'all'));
};

const setProjectFilter = filter => {
  projectFilterButtons.forEach(btn => btn.classList.toggle('active', btn.dataset.filter === filter));
  document.querySelectorAll('.project-card').forEach(card => {
    const filters = card.dataset.filters?.split(' ') || [];
    card.style.display = filter === 'all' || filters.includes(filter) ? 'grid' : 'none';
  });
};

const openModal = () => {
  if (!modalViewer) return;
  modalViewer.classList.add('open');
  modalViewer.removeAttribute('aria-hidden');
};

const closeModal = () => {
  if (!modalViewer) return;
  modalViewer.classList.remove('open');
  modalViewer.setAttribute('aria-hidden', 'true');
};

const renderViewerItem = () => {
  const items = currentViewerSource === 'gallery'
    ? galleryItems
    : currentViewerSource === 'achievement'
      ? achievementItems
      : certItems;
  const item = items[currentViewerIndex];

  if (currentViewerSource === 'gallery') {
    if (galleryFrameImage) {
      galleryFrameImage.src = item.src;
      galleryFrameImage.alt = item.caption;
    }
    if (galleryCaption) {
      galleryCaption.textContent = item.caption;
    }
    if (modalViewer.classList.contains('open')) {
      viewerFrame.innerHTML = '';
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.caption;
      viewerFrame.appendChild(img);
      modalCaption.textContent = item.caption;
    }
  } else {
    viewerFrame.innerHTML = '';
    const lower = item.src.toLowerCase();
    if (lower.endsWith('.pdf')) {
      const iframe = document.createElement('iframe');
      iframe.src = item.src;
      iframe.title = item.title;
      iframe.loading = 'lazy';
      iframe.style.width = '100%';
      iframe.style.height = '72vh';
      iframe.style.border = 'none';
      viewerFrame.appendChild(iframe);
    } else {
      const img = document.createElement('img');
      img.src = item.src;
      img.alt = item.title;
      viewerFrame.appendChild(img);
    }
    modalCaption.textContent = item.title;
  }
  galleryThumbs.forEach((thumb, idx) => thumb.classList.toggle('active', idx === currentViewerIndex));
};

const showGalleryItem = (index, openModalViewer = false) => {
  currentViewerSource = 'gallery';
  currentViewerIndex = index;
  renderViewerItem();
  if (openModalViewer) openModal();
};

const showCertItem = index => {
  currentViewerSource = 'cert';
  currentViewerIndex = index;
  renderViewerItem();
  openModal();
};

const showAchievementItem = index => {
  currentViewerSource = 'achievement';
  currentViewerIndex = index;
  renderViewerItem();
  openModal();
};

const handleClickOutside = event => {
  if (event.target.classList.contains('modal')) closeModal();
};

const lerp = (start, end, amount) => start + (end - start) * amount;

const updateCursor = event => {
  mouseX = event.clientX;
  mouseY = event.clientY;
  if (!isReducedMotion) {
    emitTrail(mouseX, mouseY);
  }
};

const animateCursor = () => {
  const ease = isReducedMotion ? 1 : 0.22;
  cursorX = lerp(cursorX, mouseX, ease);
  cursorY = lerp(cursorY, mouseY, ease);

  const transformValue = `translate3d(${cursorX}px, ${cursorY}px, 0) translate(-50%, -50%)`;
  cursorDot.style.transform = transformValue;
  cursorRing.style.transform = transformValue;

  requestAnimationFrame(animateCursor);
};

const toggleCursorHover = state => {
  document.documentElement.classList.toggle('cursor-hover', state);
};

const handleCursorClick = () => {
  document.documentElement.classList.add('cursor-click');
  window.setTimeout(() => {
    document.documentElement.classList.remove('cursor-click');
  }, 320);
};

const createTrailParticle = () => {
  const el = document.createElement('div');
  el.className = 'cursor-trail';
  document.body.appendChild(el);
  return { el, active: false };
};

const initializeTrail = () => {
  if (isReducedMotion) return;
  for (let i = 0; i < 5; i++) {
    trailPool.push(createTrailParticle());
  }
};

const emitTrail = (x, y) => {
  const particle = trailPool.find(p => !p.active);
  if (!particle) return;

  particle.active = true;
  const size = 2 + Math.round(Math.random() * 2);
  particle.el.style.width = `${size}px`;
  particle.el.style.height = `${size}px`;
  particle.el.style.left = `${x}px`;
  particle.el.style.top = `${y}px`;
  particle.el.style.opacity = '1';
  particle.el.style.transform = 'translate(-50%, -50%) scale(1)';

  requestAnimationFrame(() => {
    particle.el.style.opacity = '0';
    particle.el.style.transform = 'translate(-50%, -50%) scale(0.28)';
  });

  window.setTimeout(() => {
    particle.active = false;
  }, 260);
};

const validateEmail = email => /\S+@\S+\.\S+/.test(email);

if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('prefers-reduced-motion');
}

const savedTheme = localStorage.getItem('portfolio-theme');
setTheme(savedTheme === 'light' ? 'light' : 'dark');

navToggle.addEventListener('click', () => {
  const expanded = navToggle.getAttribute('aria-expanded') === 'true';
  navToggle.setAttribute('aria-expanded', String(!expanded));
  siteNav.classList.toggle('open');
});

themeToggle.addEventListener('click', () => setTheme(body.classList.contains('light') ? 'dark' : 'light'));

if (galleryPrev) {
  galleryPrev.addEventListener('click', () => showGalleryItem((currentViewerIndex + galleryItems.length - 1) % galleryItems.length));
}
if (galleryNext) {
  galleryNext.addEventListener('click', () => showGalleryItem((currentViewerIndex + 1) % galleryItems.length));
}

if (viewerPrev) {
  viewerPrev.addEventListener('click', () => {
    const items = currentViewerSource === 'gallery'
      ? galleryItems
      : currentViewerSource === 'achievement'
        ? achievementItems
        : certItems;
    currentViewerIndex = (currentViewerIndex + items.length - 1) % items.length;
    renderViewerItem();
  });
}

if (viewerNext) {
  viewerNext.addEventListener('click', () => {
    const items = currentViewerSource === 'gallery'
      ? galleryItems
      : currentViewerSource === 'achievement'
        ? achievementItems
        : certItems;
    currentViewerIndex = (currentViewerIndex + 1) % items.length;
    renderViewerItem();
  });
}

if (modalClose) {
  modalClose.addEventListener('click', closeModal);
}

skillControls.forEach(control => {
  control.addEventListener('click', () => setActiveSkillPanel(control.dataset.category));
});

projectFilterButtons.forEach(button => {
  button.addEventListener('click', () => setProjectFilter(button.dataset.filter));
});

certCards.forEach(card => {
  const button = card.querySelector('.view-cert-btn');
  if (button) button.addEventListener('click', () => showCertItem(Number(card.dataset.certIndex)));
});

document.querySelectorAll('.view-achievement-btn').forEach((btn, idx) => {
  btn.addEventListener('click', () => showAchievementItem(idx));
});

// Wire project screenshot viewer buttons (preserve access to screenshots)
document.querySelectorAll('.view-gallery-btn').forEach((btn, idx) => {
  btn.addEventListener('click', () => showGalleryItem(0, true));
});

galleryThumbs.forEach((thumb, index) => {
  thumb.addEventListener('click', () => showGalleryItem(index));
});

const portrait = document.querySelector('.hero-portrait');
const portraitOverlay = document.querySelector('.hero-portrait-overlay');
const preventImageInteraction = event => {
  event.preventDefault();
  event.stopPropagation();
};

if (portrait) {
  portrait.draggable = false;
  portrait.addEventListener('dragstart', preventImageInteraction);
  portrait.addEventListener('mousedown', preventImageInteraction);
  portrait.addEventListener('contextmenu', preventImageInteraction);
  portrait.addEventListener('selectstart', preventImageInteraction);
}

if (portraitOverlay) {
  portraitOverlay.addEventListener('contextmenu', preventImageInteraction);
  portraitOverlay.addEventListener('dragstart', preventImageInteraction);
  portraitOverlay.addEventListener('mousedown', preventImageInteraction);
  portraitOverlay.addEventListener('selectstart', preventImageInteraction);
  portraitOverlay.addEventListener('touchstart', preventImageInteraction);
}

scrollButtons.forEach(button => {
  button.addEventListener('click', () => {
    const sel = button.dataset.scroll;
    const target = document.querySelector(sel);
    if (!target) return;
    const parentSection = target.closest('section');
    if (parentSection) {
      navigateTo(parentSection.id);
    } else {
      scrollToSection(target.id);
    }
  });
});

document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', event => {
    const href = link.getAttribute('href') || '';
    const targetId = href.startsWith('#') ? href.slice(1) : '';
    if (targetId && document.getElementById(targetId)) {
      event.preventDefault();
      navigateTo(targetId);
    }
  });
});

siteNavLinks.forEach(link => {
  link.addEventListener('click', () => {
    siteNav.classList.remove('open');
    navToggle.setAttribute('aria-expanded', 'false');
  });
});

if (contactForm) {
  contactForm.addEventListener('submit', event => {
    event.preventDefault();
    const name = contactForm.name.value.trim();
    const email = contactForm.email.value.trim();
    const message = contactForm.message.value.trim();
    const status = contactForm.querySelector('.form-status');
    if (!name || !validateEmail(email) || !message) {
      status.textContent = 'Please complete all fields with valid information.';
      return;
    }
    contactForm.reset();
    status.textContent = 'Thank you. Your message is validated and ready for backend integration.';
  });
}

const handleRouteChange = () => {
  const id = getRouteId();
  if (location.hash !== `#${id}`) {
    history.replaceState(null, '', `#${id}`);
  }
  applySection(id, { scrollTo: true });
};

window.addEventListener('load', () => {
  const id = getRouteId();
  if (location.hash !== `#${id}`) {
    history.replaceState(null, '', `#${id}`);
  }
  applySection(id, { scrollTo: true });
  if (galleryFrameImage) showGalleryItem(0);
});

window.addEventListener('hashchange', handleRouteChange);
window.addEventListener('popstate', handleRouteChange);
window.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    closeModal();
  }
});
window.addEventListener('click', handleClickOutside);

if (!('ontouchstart' in window)) {
  initializeTrail();
  document.addEventListener('mousemove', updateCursor);
  document.addEventListener('mousedown', handleCursorClick);
  document.querySelectorAll('a, button, .gallery-thumb, .view-cert-btn, .view-achievement-btn, .feature-card, .project-card, .cert-card, .theme-toggle, .btn').forEach(el => {
    el.addEventListener('mouseenter', () => toggleCursorHover(true));
    el.addEventListener('mouseleave', () => toggleCursorHover(false));
  });
  animateCursor();
} else {
  cursorDot.style.display = 'none';
  cursorRing.style.display = 'none';
}
