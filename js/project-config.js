/* ==========================================================================
   PROJECT CONFIGURATION & METADATA CONTROLLER
   Manages application title, version, and reactive telemetry bindings.
   ========================================================================== */

const DEFAULT_CONFIG = {
  projectTitle: 'AGENT-TRACE',
  projectVersion: 'v4.2',
  projectSubtitle: 'Autonomous Multi-Agent System Topology, Vulnerability & Failure-Cascade Blueprinter'
};

class ProjectConfigManager {
  constructor() {
    this.config = this.loadConfig();
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
}

window.projectConfig = new ProjectConfigManager();
document.addEventListener('DOMContentLoaded', () => {
  window.projectConfig.applyConfig();
});
