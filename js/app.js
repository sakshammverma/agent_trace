/* ==========================================================================
   AGENT-TRACE MAIN APPLICATION ORCHESTRATION
   Global cursor telemetry, accordion interactions, smooth navigation
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  // 1. Global Cursor Telemetry Tracker
  const globalX = document.getElementById('head-coord-x');
  const globalY = document.getElementById('head-coord-y');

  window.addEventListener('mousemove', (e) => {
    if (globalX) globalX.textContent = e.clientX.toString().padStart(4, '0');
    if (globalY) globalY.textContent = e.clientY.toString().padStart(4, '0');
  });

  // 2. Technical Accordions
  const accordionItems = document.querySelectorAll('.accordion-item');
  accordionItems.forEach(item => {
    const trigger = item.querySelector('.accordion-trigger');
    const content = item.querySelector('.accordion-content');
    const icon = item.querySelector('.accordion-icon');

    if (trigger && content) {
      trigger.addEventListener('click', () => {
        const isOpen = item.classList.contains('open');

        // Close others in same accordion group
        const parent = item.closest('.accordion-group');
        if (parent) {
          parent.querySelectorAll('.accordion-item').forEach(sibling => {
            sibling.classList.remove('open');
            const siblingContent = sibling.querySelector('.accordion-content');
            const siblingIcon = sibling.querySelector('.accordion-icon');
            if (siblingContent) siblingContent.style.maxHeight = null;
            if (siblingIcon) siblingIcon.textContent = '+';
          });
        }

        if (!isOpen) {
          item.classList.add('open');
          content.style.maxHeight = content.scrollHeight + 'px';
          if (icon) icon.textContent = '—';
        } else {
          item.classList.remove('open');
          content.style.maxHeight = null;
          if (icon) icon.textContent = '+';
        }
      });
    }
  });

  // Open first accordion by default
  const firstAccordion = document.querySelector('.accordion-item');
  if (firstAccordion) {
    firstAccordion.classList.add('open');
    const content = firstAccordion.querySelector('.accordion-content');
    const icon = firstAccordion.querySelector('.accordion-icon');
    if (content) content.style.maxHeight = content.scrollHeight + 'px';
    if (icon) icon.textContent = '—';
  }

  // 3. Smooth Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const targetId = this.getAttribute('href');
      if (targetId && targetId !== '#') {
        const target = document.querySelector(targetId);
        if (target) {
          e.preventDefault();
          target.scrollIntoView({ behavior: 'smooth' });
        }
      }
    });
  });

  // 4. System Clock / Heartbeat
  const clockEl = document.getElementById('sys-heartbeat');
  if (clockEl) {
    setInterval(() => {
      const now = new Date();
      clockEl.textContent = now.toTimeString().split(' ')[0];
    }, 1000);
  }

  console.log('AGENT-TRACE: Blueprint engine initialized successfully.');
});
