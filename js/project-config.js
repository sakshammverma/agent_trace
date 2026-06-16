/* ==========================================================================
   PROJECT CONFIGURATION & METADATA CONTROLLER
   Manages student details, guide name, project title, and reactive updates.
   ========================================================================== */

const DEFAULT_CONFIG = {
  projectTitle: 'AGENT-TRACE',
  projectVersion: 'v4.2',
  projectSubtitle: 'Autonomous Multi-Agent System Topology, Vulnerability & Failure-Cascade Blueprinter',
  studentName: 'Saksham & Team',
  rollNumber: 'B.Tech CSE / Final Year',
  collegeName: 'Department of Computer Science & Engineering',
  guideName: 'Dr. Project Guide & Review Committee',
  academicYear: '2026 - 2027'
};

class ProjectConfigManager {
  constructor() {
    this.config = this.loadConfig();
    this.initBindings();
  }

  loadConfig() {
    try {
      const saved = localStorage.getItem('agent_trace_config');
      if (saved) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(saved) };
      }
    } catch (e) {
      console.warn('Could not read localStorage config', e);
    }
    return { ...DEFAULT_CONFIG };
  }

  saveConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    try {
      localStorage.setItem('agent_trace_config', JSON.stringify(this.config));
    } catch (e) {
      console.warn('Could not save to localStorage', e);
    }
    this.applyConfig();
  }

  applyConfig() {
    // Update all elements with data-config attribute
    document.querySelectorAll('[data-config]').forEach(el => {
      const key = el.getAttribute('data-config');
      if (this.config[key]) {
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA') {
          el.value = this.config[key];
        } else {
          el.textContent = this.config[key];
        }
      }
    });
  }

  initBindings() {
    // Open/Close Drawer
    const settingsBtn = document.getElementById('open-settings-btn');
    const closeBtn = document.getElementById('close-settings-btn');
    const drawer = document.getElementById('settings-drawer');
    const saveBtn = document.getElementById('save-settings-btn');
    const resetBtn = document.getElementById('reset-settings-btn');

    if (settingsBtn && drawer) {
      settingsBtn.addEventListener('click', (e) => {
        e.preventDefault();
        drawer.classList.add('open');
        this.populateForm();
      });
    }

    if (closeBtn && drawer) {
      closeBtn.addEventListener('click', () => {
        drawer.classList.remove('open');
      });
    }

    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const updated = {
          projectTitle: document.getElementById('input-project-title')?.value || this.config.projectTitle,
          projectSubtitle: document.getElementById('input-project-subtitle')?.value || this.config.projectSubtitle,
          studentName: document.getElementById('input-student-name')?.value || this.config.studentName,
          rollNumber: document.getElementById('input-roll-number')?.value || this.config.rollNumber,
          collegeName: document.getElementById('input-college-name')?.value || this.config.collegeName,
          guideName: document.getElementById('input-guide-name')?.value || this.config.guideName,
          academicYear: document.getElementById('input-academic-year')?.value || this.config.academicYear
        };
        this.saveConfig(updated);
        drawer.classList.remove('open');
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.saveConfig(DEFAULT_CONFIG);
        this.populateForm();
      });
    }
  }

  populateForm() {
    const fields = ['projectTitle', 'projectSubtitle', 'studentName', 'rollNumber', 'collegeName', 'guideName', 'academicYear'];
    fields.forEach(field => {
      const el = document.getElementById(`input-${field.replace(/([A-Z])/g, '-$1').toLowerCase()}`);
      if (el) el.value = this.config[field] || '';
    });
  }
}

window.projectConfig = new ProjectConfigManager();
document.addEventListener('DOMContentLoaded', () => {
  window.projectConfig.applyConfig();
});
