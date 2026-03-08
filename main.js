const members = [
  {
    name: "Kim Jisoo",
    nameKr: "김지수",
    dept: "Computer Science",
    bio: "Making things on the web, one commit at a time.",
    url: "https://jisookim.github.io",
    tags: ["web", "graphics"]
  },
  {
    name: "Lee Minjae",
    nameKr: "이민재",
    dept: "Electrical Engineering",
    bio: "Building embedded systems and tiny tools with outsized impact.",
    url: "https://minjae.dev",
    tags: ["embedded", "hardware"]
  },
  {
    name: "Park Yuna",
    nameKr: "박유나",
    dept: "Industrial Design",
    bio: "Designing interfaces that feel tactile and computational.",
    url: "https://yunapark.me",
    tags: ["ui", "interaction"]
  },
  {
    name: "Choi Donghyun",
    nameKr: "최동현",
    dept: "Mathematical Sciences",
    bio: "Exploring geometry, proof, and visual math communication.",
    url: "https://donghyun-choi.net",
    tags: ["math", "theory"]
  },
  {
    name: "Jung Ara",
    nameKr: "정아라",
    dept: "Bio and Brain Engineering",
    bio: "Computational biology notes, experiments, and open notebooks.",
    url: "https://ara-jung.org",
    tags: ["bio", "research"]
  },
  {
    name: "Han Seungwoo",
    nameKr: "한승우",
    dept: "Mechanical Engineering",
    bio: "Robotics prototypes, simulations, and mechanism sketches.",
    url: "https://seungwoo-han.com",
    tags: ["robotics", "simulation"]
  },
  {
    name: "Yoon Sohye",
    nameKr: "윤소혜",
    dept: "Business and Technology Management",
    bio: "Writing about startups, systems, and product strategy.",
    url: "https://sohye.page",
    tags: ["product", "strategy"]
  },
  {
    name: "Kang Taemin",
    nameKr: "강태민",
    dept: "Physics",
    bio: "Quantum curiosities, lab logs, and clean visual explainers.",
    url: "https://taemin-kang.space",
    tags: ["physics", "visualization"]
  }
];

const EDGE_THRESHOLD = 260;
const DRAG_THRESHOLD = 6;
const SIDEBAR_WIDTH = 240;
const INTRO_EDGE_THRESHOLD = 180;
const INTRO_PARTICLE_COUNT = 55;

const introEl = document.getElementById("intro");
const introLockEl = document.getElementById("intro-lock");
const enterHintEl = document.getElementById("enter-hint");
const introCanvasEl = document.getElementById("intro-canvas");
const terminalEl = document.getElementById("terminal");
const logoSystemEl = document.getElementById("logo-system");
const logoUnitEl = document.getElementById("logo-unit");
const wordmarkEl = document.getElementById("kaist-wordmark");
const ringSection = document.getElementById("ring-section");
const nodeField = document.getElementById("node-field");
const orbLayer = document.getElementById("orb-layer");
const edgeCanvas = document.getElementById("edge-canvas");
const sidebar = document.getElementById("sidebar");
const sidebarList = document.getElementById("sidebar-list");

let currentMembers = null;
let nodeState = [];
let orbElements = [];
let labelElements = [];
let entered = false;
let pendingShow = false;
let animationComplete = false;
let terminalText = "";
let edgeCtx = null;
let introCtx = null;
let rafId = null;
let hoverIndex = null;
let activeHighlight = null;
let dragging = null;
let layoutReady = false;
let layoutPending = false;
let introParticleRafId = null;
let introParticles = [];
let introParticlesActive = false;

function buildWordmark() {
  if (!wordmarkEl) return;
  wordmarkEl.innerHTML = "";
  ["K", "A", "I", "S", "T"].forEach((char, i) => {
    const span = document.createElement("span");
    span.className = "kaist-letter";
    span.textContent = char;
    span.style.animationDelay = `${i * 80}ms`;
    wordmarkEl.appendChild(span);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function preventScroll(e) {
  e.preventDefault();
}

function lockScroll() {
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";
  window.addEventListener("wheel", preventScroll, { passive: false });
  window.addEventListener("touchmove", preventScroll, { passive: false });
}

function unlockScroll() {
  document.body.style.overflow = "";
  document.documentElement.style.overflow = "";
  window.removeEventListener("wheel", preventScroll);
  window.removeEventListener("touchmove", preventScroll);
}

function createIntroParticles() {
  introParticles = Array.from({ length: INTRO_PARTICLE_COUNT }, () => ({
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 0.6,
    vy: (Math.random() - 0.5) * 0.6,
    r: 1.5 + Math.random() * 2,
    alpha: 0.15 + Math.random() * 0.35
  }));
}

function resizeIntroCanvas() {
  if (!introCanvasEl) return;
  const dpr = window.devicePixelRatio || 1;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  introCanvasEl.width = Math.floor(vw * dpr);
  introCanvasEl.height = Math.floor(vh * dpr);
  introCanvasEl.style.width = "100vw";
  introCanvasEl.style.height = "100vh";
  introCtx = introCanvasEl.getContext("2d");
  if (introCtx) {
    introCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

function drawIntroParticles(ctx) {
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  for (let i = 0; i < introParticles.length; i += 1) {
    for (let j = i + 1; j < introParticles.length; j += 1) {
      const dx = introParticles[j].x - introParticles[i].x;
      const dy = introParticles[j].y - introParticles[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > INTRO_EDGE_THRESHOLD) continue;

      const alpha = 0.18 * (1 - dist / INTRO_EDGE_THRESHOLD);
      ctx.beginPath();
      ctx.moveTo(introParticles[i].x, introParticles[i].y);
      ctx.lineTo(introParticles[j].x, introParticles[j].y);
      ctx.strokeStyle = `rgba(37, 99, 235, ${alpha.toFixed(3)})`;
      ctx.lineWidth = 0.6;
      ctx.stroke();
    }
  }

  introParticles.forEach((particle) => {
    particle.x += particle.vx;
    particle.y += particle.vy;

    if (particle.x < 0) particle.x = window.innerWidth;
    if (particle.x > window.innerWidth) particle.x = 0;
    if (particle.y < 0) particle.y = window.innerHeight;
    if (particle.y > window.innerHeight) particle.y = 0;

    ctx.beginPath();
    ctx.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(37, 99, 235, ${particle.alpha.toFixed(3)})`;
    ctx.fill();
  });
}

function introParticleLoop(timestamp) {
  if (!introParticlesActive) return;
  if (introCtx) {
    drawIntroParticles(introCtx);
  }
  introParticleRafId = requestAnimationFrame(introParticleLoop);
}

function startIntroParticleLoop() {
  if (!introCtx) resizeIntroCanvas();
  if (introParticles.length === 0) createIntroParticles();
  if (!introCtx) return;
  introParticlesActive = true;
  introCanvasEl.style.display = "block";
  introCanvasEl.style.opacity = "1";
  if (introParticleRafId) cancelAnimationFrame(introParticleRafId);
  introParticleRafId = requestAnimationFrame(introParticleLoop);
}

function fadeOutIntroParticles() {
  if (!introCanvasEl) return;
  introCanvasEl.style.transition = "opacity 1s ease";
  introCanvasEl.style.opacity = "0";
  setTimeout(() => {
    introParticlesActive = false;
    if (introParticleRafId) {
      cancelAnimationFrame(introParticleRafId);
      introParticleRafId = null;
    }
    introCanvasEl.style.display = "none";
  }, 1000);
}

function getMemberCountText() {
  return Array.isArray(currentMembers) ? String(currentMembers.length) : "...";
}

function setTerminal(content) {
  terminalText = content;
  terminalEl.innerHTML = `${content}<span class="cursor">_</span>`;
}

function updateTerminalNodeCount() {
  if (!Array.isArray(currentMembers)) return;
  if (!terminalText.includes("...") || !terminalText.includes("nodes loaded.")) return;
  setTerminal(terminalText.replace("...", String(currentMembers.length)));
}

async function typeLine(line, speedMs) {
  for (const ch of line) {
    terminalText += ch;
    setTerminal(terminalText);
    await wait(speedMs);
  }
}

function releaseIntroLocks() {
  animationComplete = true;
  unlockScroll();
  introLockEl.style.pointerEvents = "none";
  enterHintEl.classList.add("visible");
}

async function runIntroSequence() {
  setTerminal("");

  const line3 = `> ring online. ${getMemberCountText()} nodes loaded.`;
  const totalIntroDuration =
    600 + 400 + line3.length * 28 + 800 + 1000 + 500 + 300 + 500 + 600 + 800;

  setTimeout(releaseIntroLocks, totalIntroDuration);

  await wait(600);
  setTerminal("KAIST '25 WEBRING\n——————————————————\n");
  await wait(400);
  await typeLine(line3, 28);
  updateTerminalNodeCount();

  await wait(800);
  logoSystemEl.classList.add("visible");
  requestAnimationFrame(() => {
    startIntroParticleLoop();
    logoSystemEl.classList.add("live");
  });
}

function enterRing() {
  if (!animationComplete || entered) return;
  entered = true;
  fadeOutIntroParticles();

  enterHintEl.classList.remove("visible");
  enterHintEl.style.opacity = "0";
  lockScroll();

  introEl.style.transition = "opacity 0.7s ease";
  introEl.style.opacity = "0";

  setTimeout(() => {
    introEl.style.display = "none";
    if (Array.isArray(currentMembers) && currentMembers.length > 0) {
      showNodeField();
    } else {
      pendingShow = true;
    }
  }, 700);
}

function setupEnterTriggers() {
  document.addEventListener("keydown", enterRing);
  document.addEventListener("click", enterRing);
  window.addEventListener("wheel", enterRing, { passive: true });
  document.addEventListener("touchstart", enterRing, { passive: true });
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;
  const vw = nodeField ? nodeField.clientWidth : window.innerWidth;
  const vh = nodeField ? nodeField.clientHeight : window.innerHeight;
  edgeCanvas.width = Math.floor(vw * dpr);
  edgeCanvas.height = Math.floor(vh * dpr);
  edgeCanvas.style.width = "100%";
  edgeCanvas.style.height = "100%";
  edgeCtx = edgeCanvas.getContext("2d");
  edgeCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function updateOrbPosition(i) {
  const orb = orbElements[i];
  const label = labelElements[i];
  if (!orb) return;
  orb.style.setProperty("--nx", `${nodeState[i].x}px`);
  orb.style.setProperty("--ny", `${nodeState[i].y}px`);
  if (label) {
    label.style.setProperty("--nx", `${nodeState[i].x}px`);
    label.style.setProperty("--ny", `${nodeState[i].y}px`);
  }
}

function positionNodesToCircle() {
  const sidebarWidth = window.innerWidth >= 641 ? SIDEBAR_WIDTH : 190;
  const availableWidth = Math.max(280, window.innerWidth - sidebarWidth);
  const circleCenterX = availableWidth / 2;
  const circleCenterY = window.innerHeight / 2;
  const radius = Math.min(availableWidth, window.innerHeight) * 0.36;
  const n = nodeState.length;

  for (let i = 0; i < n; i += 1) {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    nodeState[i].bx = circleCenterX + radius * Math.cos(angle);
    nodeState[i].by = circleCenterY + radius * Math.sin(angle);
    nodeState[i].x = nodeState[i].bx;
    nodeState[i].y = nodeState[i].by;
  }
}

function clampNodeToViewport(i) {
  const size = window.matchMedia("(max-width: 640px)").matches ? 84 : 96;
  const r = size / 2;
  const maxX = window.innerWidth - r;
  const maxY = window.innerHeight - r;
  nodeState[i].bx = Math.max(r, Math.min(maxX, nodeState[i].bx));
  nodeState[i].by = Math.max(r, Math.min(maxY, nodeState[i].by));
  nodeState[i].x = nodeState[i].bx;
  nodeState[i].y = nodeState[i].by;
}

function drawEdges(ctx, nodes, focusIdx = null) {
  const vw = nodeField ? nodeField.clientWidth : window.innerWidth;
  const vh = nodeField ? nodeField.clientHeight : window.innerHeight;
  const maxDist = Math.sqrt(vw ** 2 + vh ** 2);

  ctx.clearRect(0, 0, vw, vh);

  for (let i = 0; i < nodes.length; i += 1) {
    for (let j = i + 1; j < nodes.length; j += 1) {
      const dx = nodes[j].x - nodes[i].x;
      const dy = nodes[j].y - nodes[i].y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const closeT = Math.max(0, 1 - dist / EDGE_THRESHOLD);
      const farT = Math.max(0, 1 - dist / (maxDist * 0.6)) * 0.12;
      const alpha = closeT > 0 ? 0.18 + closeT * 0.52 : farT;
      const lineWidth = closeT > 0 ? 0.8 + closeT * 1.4 : 0.4;

      const isFocused = focusIdx !== null && (i === focusIdx || j === focusIdx);
      const finalAlpha = focusIdx !== null
        ? (isFocused ? Math.max(alpha, 0.55) : alpha * 0.2)
        : alpha;
      const finalWidth = isFocused ? Math.max(lineWidth, 2) : lineWidth;

      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[j].x, nodes[j].y);
      ctx.strokeStyle = `rgba(37, 99, 235, ${(finalAlpha * 0.3).toFixed(3)})`;
      ctx.lineWidth = finalWidth + 2.5;
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(nodes[i].x, nodes[i].y);
      ctx.lineTo(nodes[j].x, nodes[j].y);
      ctx.strokeStyle = `rgba(91, 140, 245, ${finalAlpha.toFixed(3)})`;
      ctx.lineWidth = finalWidth;
      ctx.stroke();
    }
  }
}

function redrawCanvas() {
  if (!edgeCtx) return;
  const focusIdx = activeHighlight !== null ? activeHighlight : hoverIndex;
  drawEdges(edgeCtx, nodeState, focusIdx);
}

function applyHighlight(index, on) {
  const orb = orbElements[index];
  const label = labelElements[index];
  if (!orb) return;
  orb.classList.toggle("highlighted", on);
  if (label) label.style.opacity = on ? "1" : "0";
}

function attachDrag(orbEl, idx) {
  let pointerStartX = 0;
  let pointerStartY = 0;
  let nodeStartBX = 0;
  let nodeStartBY = 0;
  let hasMoved = false;

  orbEl.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    e.stopPropagation();

    pointerStartX = e.clientX;
    pointerStartY = e.clientY;
    nodeStartBX = nodeState[idx].bx;
    nodeStartBY = nodeState[idx].by;
    hasMoved = false;

    dragging = idx;
    orbEl.setPointerCapture(e.pointerId);
    orbEl.style.transition = "none";
    orbEl.classList.add("dragging");
    orbEl.style.zIndex = "999";
    orbEl.style.borderColor = "rgba(37, 99, 235, 1)";
    orbEl.style.boxShadow = "0 0 0 1px rgba(37,99,235,0.4), 0 0 28px rgba(37,99,235,0.3)";
  });

  orbEl.addEventListener("pointermove", (e) => {
    if (dragging !== idx) return;

    const dx = e.clientX - pointerStartX;
    const dy = e.clientY - pointerStartY;

    if (!hasMoved && Math.sqrt(dx * dx + dy * dy) > DRAG_THRESHOLD) {
      hasMoved = true;
    }

    nodeState[idx].bx = nodeStartBX + dx;
    nodeState[idx].by = nodeStartBY + dy;
    clampNodeToViewport(idx);
    nodeState[idx].x = nodeState[idx].bx;
    nodeState[idx].y = nodeState[idx].by;

    updateOrbPosition(idx);
    redrawCanvas();
  });

  orbEl.addEventListener("pointerup", () => {
    if (dragging !== idx) return;
    dragging = null;

    orbEl.classList.remove("dragging");
    orbEl.style.zIndex = "1";
    orbEl.style.borderColor = "";
    orbEl.style.boxShadow = "";
    orbEl.style.transition = "";

    if (!hasMoved) {
      window.open(currentMembers[idx].url, "_blank", "noopener");
    }

    hasMoved = false;
  });

  orbEl.addEventListener("pointercancel", () => {
    dragging = null;
    hasMoved = false;
    orbEl.classList.remove("dragging");
    orbEl.style.zIndex = "1";
    orbEl.style.borderColor = "";
    orbEl.style.boxShadow = "";
    orbEl.style.transition = "";
  });
}

function renderSidebar() {
  sidebarList.innerHTML = "";

  currentMembers.forEach((member, i) => {
    const item = document.createElement("li");
    item.className = "sidebar-item";
    item.dataset.index = String(i);

    let host = member.url;
    try {
      host = new URL(member.url).hostname;
    } catch (_err) {
      host = member.url.replace(/^https?:\/\//, "");
    }

    item.innerHTML = `
      <a href="${member.url}" target="_blank" rel="noopener noreferrer" aria-label="Open ${member.name}'s website">
        <span class="sidebar-name">${member.name}</span>
        <span class="sidebar-url">${host}</span>
      </a>
    `;

    item.addEventListener("mouseenter", () => {
      activeHighlight = i;
      applyHighlight(i, true);
      redrawCanvas();
    });

    item.addEventListener("mouseleave", () => {
      applyHighlight(i, false);
      activeHighlight = null;
      redrawCanvas();
    });

    sidebarList.appendChild(item);
  });
}

function renderOrbs() {
  orbLayer.innerHTML = "";
  orbElements = [];
  labelElements = [];

  nodeState.forEach((node, i) => {
    const member = currentMembers[i];

    const orb = document.createElement("div");
    orb.className = "node-orb";
    orb.dataset.index = String(i);
    orb.setAttribute("role", "button");
    orb.setAttribute("tabindex", "0");
    orb.setAttribute("aria-label", `Open ${member.name}'s personal website`);
    orb.innerHTML = `<span class="orb-name">${member.name}</span>`;

    const label = document.createElement("div");
    label.className = "node-label";
    let host = member.url;
    try {
      host = new URL(member.url).hostname;
    } catch (_err) {
      host = member.url.replace(/^https?:\/\//, "");
    }
    label.innerHTML = `
      <span class="label-dept">${member.dept}</span>
      <span class="label-url">${host}</span>
    `;

    orbLayer.appendChild(orb);
    orbLayer.appendChild(label);

    orbElements[i] = orb;
    labelElements[i] = label;
    updateOrbPosition(i);

    orb.addEventListener("mouseenter", () => {
      hoverIndex = i;
      label.style.opacity = "1";
      redrawCanvas();
    });

    orb.addEventListener("mouseleave", () => {
      hoverIndex = null;
      label.style.opacity = "0";
      redrawCanvas();
    });

    orb.addEventListener("focusin", () => {
      hoverIndex = i;
      label.style.opacity = "1";
    });

    orb.addEventListener("focusout", () => {
      hoverIndex = null;
      label.style.opacity = "0";
    });

    attachDrag(orb, i);
  });
}

function initNodeField() {
  if (!Array.isArray(currentMembers) || currentMembers.length === 0) return;

  resizeCanvas();
  positionNodesToCircle();
  renderOrbs();
  redrawCanvas();

  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(animationLoop);
}

function animationLoop(timestamp) {
  const t = timestamp / 1000;

  nodeState.forEach((node, i) => {
    if (dragging === i) return;

    const ox = node.floatRadius * Math.cos(t * 0.4 + node.floatPhase);
    const oy = node.floatRadius * Math.sin(t * 0.6 + node.floatPhase);

    node.x = node.bx + ox;
    node.y = node.by + oy;

    updateOrbPosition(i);
  });

  redrawCanvas();
  rafId = requestAnimationFrame(animationLoop);
}

function showNodeField() {
  ringSection.style.display = "block";
  window.scrollTo(0, 0);
  document.body.style.overflow = "hidden";
  document.documentElement.style.overflow = "hidden";

  requestAnimationFrame(() => {
    ringSection.classList.add("visible");
    sidebar.classList.add("visible");
  });
  setTimeout(() => {
    unlockScroll();
  }, 700);

  if (layoutReady) {
    initNodeField();
  } else {
    layoutPending = true;
  }

  renderSidebar();
}

function onResize() {
  resizeIntroCanvas();

  if (!entered || ringSection.style.display !== "block") return;
  resizeCanvas();
  positionNodesToCircle();
  nodeState.forEach((_, i) => updateOrbPosition(i));
  redrawCanvas();
}

function setMembersData(data) {
  currentMembers = data;
  updateTerminalNodeCount();

  nodeState = currentMembers.map((member) => ({
    ...member,
    bx: 0,
    by: 0,
    x: 0,
    y: 0,
    floatPhase: Math.random() * Math.PI * 2,
    floatRadius: 3 + Math.random() * 4
  }));

  if (pendingShow && entered) {
    pendingShow = false;
    showNodeField();
  }
}

function onWindowLoaded() {
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      layoutReady = true;
      if (layoutPending && entered) {
        layoutPending = false;
        initNodeField();
      }
    });
  });
}

async function init() {
  lockScroll();
  buildWordmark();
  resizeIntroCanvas();
  createIntroParticles();
  setupEnterTriggers();
  runIntroSequence();

  const resolved = await Promise.resolve(members);
  setMembersData(resolved);

  window.addEventListener("resize", onResize);
  if (document.readyState === "complete") {
    onWindowLoaded();
  } else {
    window.addEventListener("load", onWindowLoaded, { once: true });
  }
}

init();
