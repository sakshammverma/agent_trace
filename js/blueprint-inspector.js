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