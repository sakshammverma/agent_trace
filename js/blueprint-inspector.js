/* ==========================================================================
   AGENT-TRACE BLUEPRINT INSPECTOR & TOPOLOGY INGESTION ENGINE
   Interactive Multi-Agent Network Topology, Clickable Vulnerability Nodes,
   Dynamic Animated Attack Trajectory Tracing, Auto-Patcher, and Multi-Topology Ingest.

   Vulnerability findings for every topology (presets AND custom pasted
   graphs) are produced by a real call to POST /api/analyze, which runs the
   graph through backend/agent_trace_engine.py's structural analyzer. Only
   the visual layout (node x/y, track paths, colors) is computed client-side.
   ========================================================================== */

// Real graphs (id/name/role + edges) sent to the backend for analysis.
// Visual layout (x,y positions, SVG track paths, pin coordinates) is kept
// separate below so the diagram can be drawn without waiting on the network.
const TOPOLOGY_GRAPHS = {
  enterprise: {
    name: "Enterprise Multi-Agent Cluster (Default)",
    nodes: [
      { id: "gateway", name: "01 // GATEWAY", role: "AST Ingress Tokenizer" },
      { id: "router", name: "02 // ROUTER", role: "Intent Classifier" },
      { id: "synthesizer", name: "03 // SYNTHESIZER", role: "AST Code Generator" },
      { id: "critic", name: "04 // CRITIC", role: "LLM-as-a-Judge" },
      { id: "tool_exec", name: "05 // TOOL EXEC", role: "Function Calling" },
      { id: "db_bridge", name: "06 // DB BRIDGE", role: "Production State Store" }
    ],
    edges: [
      { from: "gateway", to: "router" },
      { from: "router", to: "synthesizer" },
      { from: "synthesizer", to: "critic" },
      { from: "critic", to: "synthesizer" },
      { from: "router", to: "tool_exec" },
      { from: "tool_exec", to: "db_bridge" }
    ]
  },

  langgraph_dev: {
    name: "LangGraph Software Development Swarm",
    nodes: [
      { id: "jira_ingest", name: "01 // JIRA INGEST", role: "Ticket Parser Agent" },
      { id: "architect", name: "02 // ARCHITECT", role: "Spec Decomposition Planner" },
      { id: "coder_agent", name: "03 // CODER AGENT", role: "Python/TS Synthesizer" },
      { id: "qa_tester", name: "04 // QA TESTER", role: "PyTest Runner Agent" },
      { id: "k8s_deployer", name: "05 // K8S DEPLOYER", role: "Cluster Release Tool" }
    ],
    edges: [
      { from: "jira_ingest", to: "architect" },
      { from: "architect", to: "coder_agent" },
      { from: "coder_agent", to: "qa_tester" },
      { from: "qa_tester", to: "coder_agent" },
      { from: "coder_agent", to: "k8s_deployer" }
    ]
  },

  crewai_finance: {
    name: "CrewAI Algorithmic Financial & Trading Network",
    nodes: [
      { id: "rss_scraper", name: "01 // RSS SCRAPER", role: "News Ingest Stream" },
      { id: "sentiment", name: "02 // SENTIMENT", role: "Market Tone Analyzer" },
      { id: "quant_risk", name: "03 // QUANT RISK", role: "Monte Carlo VaR" },
      { id: "strategy", name: "04 // STRATEGY", role: "Trade Decision Router" },
      { id: "broker_api", name: "05 // BROKER API", role: "Direct Market Access" }
    ],
    edges: [
      { from: "rss_scraper", to: "sentiment" },
      { from: "sentiment", to: "quant_risk" },
      { from: "quant_risk", to: "strategy" },
      { from: "strategy", to: "broker_api" }
    ]
  }
};

// Visual-only layout: node coordinates, colors, and drawn track paths for
// each preset. None of this affects the security findings.
const TOPOLOGY_LAYOUTS = {
  enterprise: {
    spanInfo: "TOTAL SYSTEM CLUSTER LATENCY SPAN: 140MS // BUFFER LIMIT: 16MB",
    positions: {
      gateway: { x: 140, y: 320, color: "#fa3600" },
      router: { x: 380, y: 160, color: "#fa3600" },
      synthesizer: { x: 700, y: 120, color: "#b3b3af" },
      critic: { x: 1050, y: 160, color: "#fa3600" },
      tool_exec: { x: 680, y: 360, color: "#fa3600" },
      db_bridge: { x: 1080, y: 420, color: "#fa3600" }
    },
    tracks: [
      "M 270,370 L 380,210 L 700,170 L 1050,210",
      "M 480,210 L 680,410 L 1080,470",
      "M 1050,230 Q 900,300 810,190"
    ]
  },
  langgraph_dev: {
    spanInfo: "LANGGRAPH WORKFLOW LATENCY: 210MS // BRANCH: main",
    positions: {
      jira_ingest: { x: 140, y: 280, color: "#fa3600" },
      architect: { x: 420, y: 160, color: "#fa3600" },
      coder_agent: { x: 740, y: 140, color: "#fa3600" },
      qa_tester: { x: 1040, y: 180, color: "#fa3600" },
      k8s_deployer: { x: 820, y: 400, color: "#fa3600" }
    },
    tracks: [
      "M 270,330 L 420,210 L 740,190 L 1040,230",
      "M 740,190 L 820,440",
      "M 1040,230 Q 900,310 740,210"
    ]
  },
  crewai_finance: {
    spanInfo: "FINANCIAL AGENT CLUSTER LATENCY: 85MS // EXECUTION GATE: SEC Compliant",
    positions: {
      rss_scraper: { x: 140, y: 300, color: "#fa3600" },
      sentiment: { x: 420, y: 180, color: "#b3b3af" },
      quant_risk: { x: 740, y: 160, color: "#b3b3af" },
      strategy: { x: 760, y: 380, color: "#fa3600" },
      broker_api: { x: 1080, y: 380, color: "#fa3600" }
    },
    tracks: [
      "M 270,350 L 420,230 L 740,210 L 760,430 L 1080,430",
      "M 420,230 L 760,430"
    ]
  }
};

// Maps the backend's patch_type to a real guardrail decorator + snippet
// (mirrors the classes actually defined in backend/guardrails.py).
const PATCH_TYPE_INFO = {
  TaintBoundaryIsolation: {
    codeFor: (nodeId) => `@TaintBoundaryIsolation(strict_mode=True, nonce="AGENT_TRACE_NONCE_984")
def guarded_${nodeId}_ingress(raw_input: str) -> str:
    """Sanitizes user input and neutralizes prompt injection payloads."""
    return raw_input`
  },
  CircuitBreaker: {
    codeFor: (nodeId) => `@CircuitBreaker(max_retries=3, timeout_sec=5.0, fallback_action="escalate_to_human")
def guarded_${nodeId}_handler(state: dict) -> dict:
    """Halts execution after repeated failures, breaking the cycle."""
    return execute_node(state)`
  },
  HardwarePermissionCeiling: {
    codeFor: (nodeId) => `@HardwarePermissionCeiling(max_financial_limit=50000.0, require_2fa=True)
def guarded_${nodeId}_dispatcher(tool_call: dict) -> dict:
    """Blocks unverified tool/DB calls exceeding the authorized ceiling."""
    return execute_tool(tool_call)`
  }
};

class BlueprintInspector {
  constructor() {
    this.currentTopologyKey = 'enterprise';
    this.currentTopology = null;
    this.activeMarker = null;
    this.resolvedCount = 0;
    this.totalVulns = 0;
    this.init();
  }

  init() {
    this.bindHUDCoordinates();
    this.bindPatchButtons();
    this.bindIngestionControls();
    this.loadPreset('enterprise');
  }

  /** Loads a built-in preset: draws its fixed layout immediately, then
   *  requests real vulnerability findings from POST /api/analyze. */
  async loadPreset(key) {
    const graph = TOPOLOGY_GRAPHS[key];
    const layout = TOPOLOGY_LAYOUTS[key];
    if (!graph || !layout) return;

    this.currentTopologyKey = key;

    const nodes = graph.nodes.map(n => ({
      id: n.id,
      name: n.name,
      role: n.role,
      ...layout.positions[n.id]
    }));

    this.setStatus(`ANALYZING TOPOLOGY '${graph.name}' VIA BACKEND...`);
    let vulnerabilities = [];
    try {
      vulnerabilities = await this.analyzeGraph({ name: graph.name, nodes: graph.nodes, edges: graph.edges });
    } catch (err) {
      this.setStatus(`BACKEND ERROR: ${err.message}. Is uvicorn backend.api:app running?`);
    }

    this.currentTopology = this.buildTopologyView({
      name: graph.name,
      spanInfo: layout.spanInfo,
      nodes,
      tracks: layout.tracks,
      vulnerabilities
    });

    this.renderCurrentTopology();
  }

  /** Calls the real FastAPI analyzer (backend/agent_trace_engine.py) and
   *  returns its vulnerabilities array. Throws if the backend is unreachable. */
  async analyzeGraph(workflow) {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workflow)
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    return data.vulnerabilities || [];
  }

  /** Converts a laid-out node list + real backend vulnerabilities into the
   *  {nodes, tracks, markers, vulns} shape the renderer/selector expect. */
  buildTopologyView({ name, spanInfo, nodes, tracks, vulnerabilities }) {
    const nodeById = {};
    nodes.forEach(n => { nodeById[n.id] = n; });

    const markers = [];
    const vulns = {};

    vulnerabilities.forEach((v, idx) => {
      const vid = String(idx + 1).padStart(2, '0');
      const targetNode = nodeById[v.node] || nodes[0];
      if (!targetNode) return;

      const halfW = (targetNode.width || 170) / 2;
      const halfH = (targetNode.height || 95) / 2;
      const leftPct = Math.round(((targetNode.x + halfW) / 1440) * 100);
      const topPct = Math.round(((targetNode.y + halfH) / 700) * 100);
      markers.push({ vid, top: `${topPct}%`, left: `${leftPct}%` });

      const patchInfo = PATCH_TYPE_INFO[v.patch_type];
      const pathTrack = tracks[idx % tracks.length] || tracks[0] || 'M 100,280 L 1000,280';

      vulns[vid] = {
        id: v.id,
        severity: v.severity,
        title: v.title,
        node: targetNode.name || v.node,
        desc: v.desc,
        pythonCode: patchInfo ? patchInfo.codeFor(v.node) : `# Patch type '${v.patch_type}' synthesized by AGENT-TRACE engine`,
        targetFile: 'backend/hardened_workflow.py',
        path: pathTrack,
        markerPos: idx % 2 === 0
          ? { top: '15%', right: '4rem', left: 'auto' }
          : { top: '15%', left: '4rem', right: 'auto' }
      };
    });

    return {
      name,
      spanInfo: spanInfo || `TOPOLOGY: ${name.toUpperCase()} // NODES: ${nodes.length} // REACHABILITY AUDITED VIA LIVE BACKEND`,
      nodes,
      tracks: tracks.length ? tracks : ["M 100,280 L 1000,280"],
      markers,
      vulns
    };
  }

  setStatus(text) {
    const hudPrompt = document.getElementById('map-hud-status');
    if (hudPrompt) hudPrompt.textContent = text;
  }

  loadTopology(key, customData = null) {
    if (customData) {
      this.currentTopologyKey = 'custom';
      this.currentTopology = customData;
    } else if (TOPOLOGY_GRAPHS[key]) {
      this.loadPreset(key);
      return;
    } else {
      return;
    }

    this.activeMarker = null;
    this.resolvedCount = 0;
    this.totalVulns = Object.keys(this.currentTopology.vulns || {}).length;

    this.renderCurrentTopology();
    this.deselect();

    // Update Section Title & Telemetry
    const spanText = document.getElementById('map-span-annotation');
    if (spanText) spanText.textContent = this.currentTopology.spanInfo;

    const counterEl = document.getElementById('taint-counter');
    if (counterEl) counterEl.textContent = `ACTIVE_VULNS: ${this.totalVulns} / ${this.totalVulns}`;

    const nodeCountEl = document.getElementById('map-node-count');
    if (nodeCountEl) nodeCountEl.textContent = `TOPOLOGY_NODES: ${this.currentTopology.nodes.length}`;
  }

  renderCurrentTopology() {
    const topo = this.currentTopology;
    const svg = document.querySelector('.blueprint-svg');
    const viewport = document.querySelector('.map-viewport');
    if (!svg || !viewport || !topo) return;

    this.activeMarker = null;
    this.resolvedCount = 0;
    this.totalVulns = Object.keys(topo.vulns || {}).length;

    const spanText = document.getElementById('map-span-annotation');
    if (spanText) spanText.textContent = topo.spanInfo;

    const counterEl = document.getElementById('taint-counter');
    if (counterEl) counterEl.textContent = `ACTIVE_VULNS: ${this.totalVulns} / ${this.totalVulns}`;

    const nodeCountEl = document.getElementById('map-node-count');
    if (nodeCountEl) nodeCountEl.textContent = `TOPOLOGY_NODES: ${topo.nodes.length}`;

    // 1. Render Tracks and Nodes into SVG
    let tracksHtml = '';
    topo.tracks.forEach(d => {
      tracksHtml += `<path d="${d}" stroke="#b3b3af" stroke-width="2" stroke-opacity="0.6"/>`;
    });

    let nodesHtml = '';
    topo.nodes.forEach(n => {
      const color = n.color || '#282828';
      nodesHtml += `
        <g transform="translate(${n.x}, ${n.y})">
          <rect width="170" height="95" fill="#f5f5ef" stroke="#282828" stroke-width="1.5"/>
          <rect x="0" y="0" width="170" height="22" fill="#282828"/>
          <text x="10" y="15" fill="#ffffff" font-family="'Space Grotesk', sans-serif" font-size="11" font-weight="700">${n.name}</text>
          <text x="10" y="44" fill="#282828" font-family="'JetBrains Mono', monospace" font-size="10">${n.role || n.sub || ''}</text>
          <text x="10" y="62" fill="#626260" font-family="'JetBrains Mono', monospace" font-size="9">${n.port || n.id}</text>
          <text x="10" y="80" fill="${color}" font-family="'JetBrains Mono', monospace" font-size="9">${n.extra || 'NODE ID: ' + n.id}</text>
          <rect x="152" y="6" width="8" height="8" fill="${color}"/>
        </g>
      `;
    });

    // Update dynamic elements in SVG
    const dynamicGroup = document.getElementById('svg-dynamic-elements');
    if (dynamicGroup) {
      dynamicGroup.innerHTML = `
        ${tracksHtml}
        ${nodesHtml}
        <path id="trace-path" d="" stroke="#fa3600" stroke-width="3.5" fill="none"/>
        <path id="trace-path-green" d="" stroke="#1b873f" stroke-width="3" fill="none" stroke-dasharray="4 2"/>
      `;
    }

    // 2. Render Markers into Viewport
    // Remove existing markers
    viewport.querySelectorAll('.violation-marker').forEach(m => m.remove());

    topo.markers.forEach(m => {
      const markerEl = document.createElement('div');
      markerEl.className = 'violation-marker';
      markerEl.setAttribute('data-vid', m.vid);
      markerEl.style.top = m.top;
      markerEl.style.left = m.left;
      markerEl.textContent = m.vid;
      viewport.appendChild(markerEl);
    });

    // Re-bind markers
    this.bindMarkers();
    this.deselect();
  }

  bindMarkers() {
    const markers = document.querySelectorAll('.violation-marker');
    markers.forEach(marker => {
      marker.addEventListener('click', (e) => {
        e.stopPropagation();
        const vid = marker.getAttribute('data-vid');
        this.selectVulnerability(vid, marker);
      });
    });

    document.addEventListener('click', (e) => {
      if (!e.target.closest('#violation-detail-card') && !e.target.closest('.violation-marker')) {
        this.deselect();
      }
    });
  }

  selectVulnerability(vid, markerEl) {
    const data = this.currentTopology.vulns[vid];
    if (!data) return;

    this.activeMarker = vid;
    document.querySelectorAll('.violation-marker').forEach(m => m.classList.remove('active'));
    markerEl.classList.add('active');

    const tracePath = document.getElementById('trace-path');
    const tracePathGreen = document.getElementById('trace-path-green');

    if (markerEl.classList.contains('resolved')) {
      if (tracePath) tracePath.setAttribute('d', '');
      if (tracePathGreen) tracePathGreen.setAttribute('d', data.path);
    } else {
      if (tracePathGreen) tracePathGreen.setAttribute('d', '');
      if (tracePath) {
        tracePath.setAttribute('d', data.path);
        tracePath.style.animation = 'none';
        tracePath.offsetHeight;
        tracePath.style.animation = 'dashAnim 1s linear infinite';
      }
    }

    const card = document.getElementById('violation-detail-card');
    if (card) {
      document.getElementById('card-tag').textContent = `[${data.id}] // ${data.severity}`;
      document.getElementById('card-title').textContent = data.title;
      document.getElementById('card-desc').textContent = data.desc;
      
      const codeEl = document.getElementById('card-patch-code');
      if (codeEl) codeEl.textContent = data.pythonCode || data.patch;

      const targetEl = document.getElementById('card-patch-target');
      if (targetEl) targetEl.textContent = `TARGET: ${data.targetFile || 'backend/hardened_workflow.py'}`;

      const patchBtn = document.getElementById('btn-apply-patch');
      const dlBtn = document.getElementById('btn-download-hardened');

      if (markerEl.classList.contains('resolved')) {
        patchBtn.textContent = 'PATCH INJECTED INTO BACKEND ✓';
        patchBtn.disabled = true;
        patchBtn.style.background = '#1b873f';
        patchBtn.style.borderColor = '#1b873f';
        if (dlBtn) dlBtn.style.display = 'block';
      } else {
        patchBtn.textContent = 'APPLY AUTOMATED PATCH →';
        patchBtn.disabled = false;
        patchBtn.style.background = '';
        patchBtn.style.borderColor = '';
        if (dlBtn) dlBtn.style.display = 'none';