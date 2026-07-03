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

      if (!this.isActive) return;

      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        e.preventDefault();
        this.next();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        e.preventDefault();
        this.prev();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        this.close();
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        this.toggleFullscreen();
      }
    });

    // Jump buttons from within slides
    document.querySelectorAll('[data-jump-slide]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const target = parseInt(btn.getAttribute('data-jump-slide'), 10);
        if (!isNaN(target)) {
          this.goToSlide(target);
        }
      });
    });

    // Jump to live demo from slide 6
    const jumpToDemoBtn = document.getElementById('btn-slide-jump-demo');
    if (jumpToDemoBtn) {
      jumpToDemoBtn.addEventListener('click', () => {
        this.close();
        const mapEl = document.getElementById('system-map');
        if (mapEl) {
          mapEl.scrollIntoView({ behavior: 'smooth' });
        }
      });
    }
  }

  open(slideIndex = 0) {
    this.isActive = true;
    document.body.classList.add('presentation-active');
    this.goToSlide(slideIndex);
  }

  close() {
    this.isActive = false;
    document.body.classList.remove('presentation-active');
  }

  toggle() {
    if (this.isActive) {
      this.close();
    } else {
      this.open(this.currentSlide);
    }
  }

  next() {
    if (this.currentSlide < this.totalSlides - 1) {
      this.goToSlide(this.currentSlide + 1);
    }
  }

  prev() {
    if (this.currentSlide > 0) {
      this.goToSlide(this.currentSlide - 1);
    }
  }

  goToSlide(index) {
    if (index < 0 || index >= this.totalSlides) return;
    this.currentSlide = index;
    this.updateSlideUI();
  }

  updateSlideUI() {
    // Update slides
    const slides = document.querySelectorAll('.slide-slide');
    slides.forEach((slide, idx) => {
      if (idx === this.currentSlide) {
        slide.classList.add('active-slide');
      } else {
        slide.classList.remove('active-slide');
      }
    });

    // Update counter
    const counter = document.getElementById('deck-counter');
    if (counter) {
      const cur = (this.currentSlide + 1).toString().padStart(2, '0');
      const tot = this.totalSlides.toString().padStart(2, '0');
      counter.textContent = `SLIDE ${cur} / ${tot}`;
    }
  }

  toggleFullscreen() {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  window.presentationDeck = new PresentationDeckController();
});
