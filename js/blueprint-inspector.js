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