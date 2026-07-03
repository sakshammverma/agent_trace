/* ==========================================================================
   AGENT-TRACE PRESENTATION / VIVA SLIDE DECK CONTROLLER
   Full-screen academic presentation deck for 4th-year mini project defense
   ========================================================================== */

class PresentationDeckController {
  constructor() {
    this.currentSlide = 0;
    this.totalSlides = 8;
    this.isActive = false;
    this.init();
  }

  init() {
    this.bindEvents();
    this.updateSlideUI();
  }

  bindEvents() {
    // Header & trigger buttons
    const triggerBtn = document.getElementById('btn-open-presentation');
    const exitBtn = document.getElementById('btn-exit-presentation');
    const prevBtn = document.getElementById('btn-prev-slide');
    const nextBtn = document.getElementById('btn-next-slide');
    const fsBtn = document.getElementById('btn-fullscreen-slide');

    if (triggerBtn) {
      triggerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        this.open();
      });
    }

    if (exitBtn) {
      exitBtn.addEventListener('click', () => {
        this.close();
      });
    }

    if (prevBtn) {
      prevBtn.addEventListener('click', () => this.prev());
    }

    if (nextBtn) {
      nextBtn.addEventListener('click', () => this.next());
    }

    if (fsBtn) {
      fsBtn.addEventListener('click', () => this.toggleFullscreen());
    }

    // Keyboard Shortcuts
    document.addEventListener('keydown', (e) => {
      // Toggle with 'P' or 'p' when not in input
      if ((e.key === 'p' || e.key === 'P') && !['INPUT', 'TEXTAREA'].includes(e.target.tagName)) {
        e.preventDefault();
        this.toggle();
        return;
      }

