/* Eucalipto — estudo botânico tridimensional em dois modos:
   1) ramo detalhado com folhas e flores;
   2) árvore completa inspirada na fotografia enviada.
   Geometria procedural em Canvas; é uma ilustração interativa, não um escaneamento real. */
(() => {
  'use strict';
  const canvas = document.getElementById('plant3d');
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const V = (x, y, z) => [x, y, z];
  const add = (a, b) => a.map((c, i) => c + b[i]);
  const sub = (a, b) => a.map((c, i) => c - b[i]);
  const mul = (a, s) => a.map(c => c * s);
  const mix = (a, b, t) => add(mul(a, 1 - t), mul(b, t));
  const cross = (a, b) => V(a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]);
  const normalize = a => mul(a, 1 / (Math.hypot(...a) || 1));

  let seed = 82031;
  const resetSeed = value => { seed = value >>> 0; };
  const rnd = () => ((seed = (1664525 * seed + 1013904223) >>> 0) / 4294967296);
  const jitter = amount => (rnd() - 0.5) * amount;

  let yaw = -0.18;
  let pitch = -0.13;
  let zoom = 1;
  let auto = true;
  let dragging = false;
  let px = 0;
  let py = 0;
  let w = 0;
  let h = 0;
  let dpr = 1;
  let raf = 0;
  let last = 0;
  let scene = null;
  let currentMode = 'branch';

  const buttonBranch = document.getElementById('modelBranch');
  const buttonTree = document.getElementById('modelTree');
  const branchReference = document.getElementById('branchReference');
  const treeReference = document.getElementById('treeReference');

  function buildLeafShapes(targetShapes, base, tip, width, paletteIndex = 0, bend = null) {
    const d = sub(tip, base);
    const tangent = normalize(d);
    let normal = normalize(cross(tangent, [0, 0, 1]));
    if (Math.hypot(...normal) < 0.2) normal = [1, 0, 0];
    const curve = bend ?? ((paletteIndex % 2 ? -1 : 1) * (0.1 + rnd() * 0.12));
    const rows = [];
    const segments = 18;
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const middle = add(
        mix(base, tip, t),
        V(Math.sin(t * Math.PI) * curve * 0.32, -Math.sin(Math.PI * t) * (0.11 + rnd() * 0.003), Math.sin(t * Math.PI) * curve)
      );
      const profile = Math.pow(Math.sin(Math.PI * t), 0.95) * (1 - 0.18 * t);
      const breadth = width * profile;
      rows.push([sub(middle, mul(normal, breadth)), middle, add(middle, mul(normal, breadth))]);
    }
    targetShapes.push({ kind: 'leaf', out: rows, shade: 0.20 + (paletteIndex % 7) * 0.095 });
  }

  function createBranchScene() {
    resetSeed(6738);
    const shapes = [];
    const line = (a, b, width, color) => shapes.push({ kind: 'line', a, b, width, color });
    const twig = (start, end, thick = 0.014) => {
      const mid = mix(start, end, 0.52);
      mid[1] += 0.075;
      mid[2] += 0.03;
      line(start, mid, thick, '#a78b41');
      line(mid, end, thick * 0.76, '#c4a052');
      return { start, end, mid };
    };

    const axis = [V(-1.75, -1.22, -0.02), V(-1.15, -0.76, 0.08), V(-0.44, -0.32, 0.01), V(0.27, 0.12, 0.03), V(0.95, 0.65, 0.01), V(1.64, 1.24, -0.04)];
    axis.slice(1).forEach((p, i) => line(axis[i], p, 0.036 - i * 0.003, i % 2 ? '#b39951' : '#aa8543'));
    const baseBranches = [
      [1, V(-1.95, 0.42, 0.10), 0.016], [1, V(-1.65, -1.65, -0.16), 0.015],
      [2, V(-0.90, 0.88, -0.11), 0.015], [2, V(-0.72, -1.72, 0.18), 0.016],
      [3, V(0.25, -1.75, -0.11), 0.015], [3, V(0.62, 1.34, 0.12), 0.014],
      [4, V(1.40, -0.95, 0.18), 0.014], [4, V(1.92, 0.30, -0.14), 0.013],
      [4, V(0.85, -0.36, -0.09), 0.014]
    ];
    for (const [idx, tip, r] of baseBranches) twig(axis[idx], tip, r);

    const configs = [
      [-1.60, -0.88, 0.2, 1.10, 1.12, 0.10], [-1.65, -1.55, -0.02, -0.24, 1.08, 0.11],
      [-1.18, -0.80, 0.08, -1.72, -1.15, 0.14], [-1.15, -0.74, 0.03, -1.35, 0.28, 0.14],
      [-0.85, -0.59, 0.01, -2.14, -0.27, -0.16], [-0.83, -0.57, 0.02, -0.60, -1.72, 0.15],
      [-0.51, -0.37, -0.04, -0.70, 0.79, -0.16], [-0.50, -0.38, 0.04, -1.45, -1.04, 0.20],
      [-0.20, -0.15, 0.02, 0.02, -1.95, -0.15], [-0.16, -0.10, -0.05, 0.04, 0.89, -0.12],
      [0.06, -0.02, 0.01, -0.72, 0.68, 0.09], [0.10, 0.00, -0.02, 0.41, -1.75, 0.12],
      [0.36, 0.18, 0.03, 0.98, 1.37, -0.16], [0.43, 0.23, -0.02, 0.13, -1.41, 0.14],
      [0.58, 0.39, 0.04, 1.35, -0.57, -0.10], [0.70, 0.48, -0.04, 0.74, 1.65, 0.16],
      [1.00, 0.67, 0.03, 1.95, 0.14, -0.12], [1.18, 0.82, -0.02, 1.37, -0.41, 0.15],
      [0.94, 0.54, 0.09, 0.01, 1.29, 0.04], [1.43, 1.05, -0.05, 1.85, 1.73, 0.10]
    ];
    for (let i = 0; i < configs.length; i++) {
      const [bx, by, bz, tx, ty, tz] = configs[i];
      buildLeafShapes(shapes, V(bx, by, bz), V(tx, ty, tz), 0.095 + (i % 4) * 0.018, i);
      line(V(bx, by, bz), add(V(bx, by, bz), mul(sub(V(tx, ty, tz), V(bx, by, bz)), 0.12)), 0.009, '#c9b162');
    }

    const blossoms = [V(-0.32, -0.26, 0.28), V(-0.16, -0.48, 0.32), V(0.10, -0.37, 0.24), V(0.18, -0.17, 0.33), V(0.36, -0.28, 0.19), V(-0.04, -0.08, 0.24)];
    for (let k = 0; k < blossoms.length; k++) {
      const p = blossoms[k];
      const from = axis[2 + (k % 2)];
      twig(from, p, 0.008);
      shapes.push({ kind: 'bud', p, r: 0.068, color: k % 3 === 0 ? '#c18f4b' : '#d6b26e' });
      const n = 72;
      for (let i = 0; i < n; i++) {
        const phi = i * 2.39996;
        const theta = Math.acos(1 - 2 * (i + 0.5) / n);
        const l = 0.10 + rnd() * 0.095;
        const d = V(Math.cos(phi) * Math.sin(theta), Math.sin(phi) * Math.sin(theta), Math.cos(theta));
        const start = add(p, mul(d, 0.015));
        const end = add(p, mul(d, l));
        shapes.push({ kind: 'stamen', a: start, b: end, color: i % 6 === 0 ? '#fbf1d5' : '#f9fff0', width: 0.65 });
        if (i % 3 === 0) shapes.push({ kind: 'pollen', p: end, r: 0.0055, color: i % 2 ? '#eac36d' : '#fff6e3' });
      }
    }
    for (let i = 0; i < 5; i++) {
      const p = V(-0.55 + i * 0.2, -0.45 + jitter(0.24), 0.14 + jitter(0.16));
      shapes.push({ kind: 'bud', p, r: 0.035, color: '#bd8f4c' });
    }

    return {
      name: 'branch',
      origin: V(0, -0.02, 0),
      shapes,
      defaults: { yaw: -0.18, pitch: -0.13, zoom: 0.96 },
      zoomRange: [0.60, 1.8],
      ariaLabel: 'Modelo 3D estilizado de ramo de eucalipto com folhas longas e flores brancas. Arraste para girar.'
    };
  }

  function createTreeScene() {
    resetSeed(33091);
    const shapes = [];
    const line = (a, b, width, color) => shapes.push({ kind: 'line', a, b, width, color });

    function addLeafSpray(base, dir, scale = 1, count = 4) {
      const tangent = normalize(dir);
      for (let i = 0; i < count; i++) {
        const offset = add(base, V(jitter(0.15 * scale), jitter(0.22 * scale), jitter(0.14 * scale)));
        const side = i % 2 === 0 ? 1 : -1;
        const sway = V(
          tangent[0] * (0.55 + rnd() * 0.55) + side * (0.25 + rnd() * 0.22),
          tangent[1] * (0.55 + rnd() * 0.48) + jitter(0.18),
          tangent[2] * (0.35 + rnd() * 0.25) + side * (0.10 + rnd() * 0.10)
        );
        const tip = add(offset, mul(normalize(sway), 0.75 * scale + rnd() * 0.45 * scale));
        buildLeafShapes(shapes, offset, tip, (0.06 + rnd() * 0.03) * scale, i + Math.floor(rnd() * 5), side * (0.06 + rnd() * 0.08));
        line(offset, mix(offset, tip, 0.14), 0.0045 * scale, '#c6b162');
      }
    }

    function addCanopyCluster(center, radius, count) {
      for (let i = 0; i < count; i++) {
        const theta = rnd() * Math.PI * 2;
        const phi = Math.acos(1 - 2 * rnd());
        const spread = radius * (0.35 + rnd() * 0.75);
        const base = add(center, V(Math.cos(theta) * Math.sin(phi) * spread, Math.cos(phi) * spread * 0.7, Math.sin(theta) * Math.sin(phi) * spread * 0.7));
        const dir = normalize(sub(base, center));
        addLeafSpray(base, add(dir, V(jitter(0.25), 0.25 + rnd() * 0.25, jitter(0.2))), 0.85 + rnd() * 0.35, 3 + Math.floor(rnd() * 3));
      }
    }

    function growBranch(start, direction, length, depth, thickness) {
      const segments = Math.max(2, Math.round(length * 1.3));
      let current = start;
      let dir = normalize(direction);
      for (let i = 0; i < segments; i++) {
        const t = (i + 1) / segments;
        const bend = V(jitter(0.10) * (1 - t), 0.18 * (1 - depth * 0.12), jitter(0.08));
        dir = normalize(add(dir, bend));
        const next = add(current, mul(dir, length / segments));
        line(current, next, Math.max(0.006, thickness * (1 - t * 0.72)), depth <= 1 ? '#83623c' : depth <= 3 ? '#8f6f45' : '#9a7b4f');
        if (depth >= 3 && i > 0 && i % 2 === 0) addLeafSpray(next, dir, 0.85 + depth * 0.05, 3 + (i % 3));
        current = next;
      }
      if (depth >= 1) addCanopyCluster(current, 0.45 + depth * 0.08, 5 + depth * 2);
      if (depth <= 0) return;
      const branches = depth >= 4 ? 3 : 2;
      for (let i = 0; i < branches; i++) {
        const angle = (i - (branches - 1) / 2) * (0.42 + rnd() * 0.18);
        const childDir = normalize(add(dir, V(angle + jitter(0.16), 0.30 + rnd() * 0.26, jitter(0.34))));
        growBranch(current, childDir, length * (0.58 + rnd() * 0.18), depth - 1, thickness * 0.64);
      }
    }

    // trunk and main scaffold
    const trunk = [V(0, -2.65, 0), V(0.02, -1.75, 0.02), V(0.06, -0.75, 0.04), V(0.08, 0.35, 0.02), V(0.10, 1.55, 0.00), V(0.08, 2.45, -0.02)];
    for (let i = 1; i < trunk.length; i++) {
      const width = 0.17 - i * 0.018;
      line(trunk[i - 1], trunk[i], width, i < 3 ? '#7a5d3e' : '#8a6845');
    }
    // subtle secondary stems
    const stemBases = [
      [2, V(-0.55, 0.25, 0.18), 1.8, 4, 0.085],
      [2, V(0.62, 0.45, -0.12), 1.7, 4, 0.080],
      [3, V(-0.95, 1.05, 0.14), 1.45, 3, 0.068],
      [3, V(0.82, 1.20, -0.08), 1.55, 3, 0.070],
      [4, V(-0.35, 2.05, 0.16), 1.15, 2, 0.050],
      [4, V(0.42, 2.10, -0.10), 1.12, 2, 0.050]
    ];
    for (const [idx, dirV, len, depth, thick] of stemBases) {
      growBranch(trunk[idx], sub(dirV, trunk[idx]), len, depth, thick);
    }
    // low branches and hanging foliage
    growBranch(V(-0.12, -0.45, 0.10), V(-0.72, -0.20, 0.28), 1.45, 3, 0.058);
    growBranch(V(0.16, -0.28, -0.06), V(0.78, -0.08, -0.24), 1.38, 3, 0.056);

    // extra drooping leaf curtains around canopy for eucalyptus feel
    const curtains = [
      V(-0.92, 0.85, 0.28), V(-0.55, 1.35, -0.10), V(0.62, 0.95, 0.12), V(0.92, 1.55, -0.05),
      V(-0.18, 2.05, 0.10), V(0.22, 2.18, -0.08), V(-0.82, -0.10, 0.18), V(0.75, 0.15, -0.18)
    ];
    curtains.forEach((p, idx) => {
      for (let i = 0; i < 5; i++) {
        const base = add(p, V(jitter(0.18), jitter(0.10), jitter(0.12)));
        const tip = add(base, V(jitter(0.55), -0.85 - rnd() * 0.45, jitter(0.18)));
        buildLeafShapes(shapes, base, tip, 0.055 + rnd() * 0.02, idx + i, (i % 2 ? -1 : 1) * (0.05 + rnd() * 0.06));
        line(base, mix(base, tip, 0.14), 0.0035, '#c0ab61');
      }
    });

    return {
      name: 'tree',
      origin: V(0, -0.2, 0),
      shapes,
      defaults: { yaw: -0.40, pitch: -0.08, zoom: 0.93 },
      zoomRange: [0.52, 1.55],
      ariaLabel: 'Modelo 3D estilizado de uma árvore de eucalipto, com tronco alto, copa irregular e folhas alongadas. Arraste para girar.'
    };
  }

  const scenes = {
    branch: createBranchScene(),
    tree: createTreeScene()
  };

  function currentOrigin() {
    return scene ? scene.origin : V(0, 0, 0);
  }

  function project(q) {
    const p = sub(q, currentOrigin());
    const cy = Math.cos(yaw), sy = Math.sin(yaw);
    const x = p[0] * cy - p[2] * sy;
    const z = p[0] * sy + p[2] * cy;
    const cp = Math.cos(pitch), sp = Math.sin(pitch);
    const y = p[1] * cp - z * sp;
    const depth = p[1] * sp + z * cp;
    const f = 4.9 / (5.8 - depth);
    const scale = Math.min(w * 0.26, h * 0.35) * zoom * f;
    return { x: w / 2 + x * scale, y: h * 0.57 - y * scale, z: depth, s: scale };
  }

  function pathTo(points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
  }

  function renderLeaf(shape) {
    const rows = shape.out.map(row => row.map(project));
    const first = rows.map(r => r[0]);
    const center = rows.map(r => r[1]);
    const lastRow = rows.map(r => r[2]);
    const g = ctx.createLinearGradient(first[8].x, first[8].y, lastRow[8].x, lastRow[8].y);
    const greens = [['#90ad8e', '#3a6c58'], ['#a8bd8b', '#4b7656'], ['#8ea989', '#335f53'], ['#98b7a4', '#407569']];
    const c = greens[Math.round(shape.shade * 3) % 4];
    g.addColorStop(0, c[0]);
    g.addColorStop(0.48, '#709878');
    g.addColorStop(1, c[1]);
    ctx.beginPath();
    ctx.moveTo(first[0].x, first[0].y);
    for (let i = 1; i < first.length; i++) ctx.lineTo(first[i].x, first[i].y);
    for (let i = lastRow.length - 1; i >= 0; i--) ctx.lineTo(lastRow[i].x, lastRow[i].y);
    ctx.closePath();
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = 'rgba(19,49,35,.42)';
    ctx.lineWidth = 0.75;
    ctx.stroke();
    pathTo(center);
    ctx.strokeStyle = 'rgba(226,224,153,.82)';
    ctx.lineWidth = 1.0;
    ctx.stroke();
    for (let i = 3; i < rows.length - 2; i += 3) {
      for (const side of [0, 2]) {
        ctx.beginPath();
        ctx.moveTo(center[i].x, center[i].y);
        const target = rows[Math.min(i + 2, rows.length - 1)][side];
        ctx.lineTo(target.x, target.y);
        ctx.strokeStyle = 'rgba(209,216,161,.28)';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  function drawGroundAndAura() {
    const shadow = ctx.createRadialGradient(w * 0.5, h * 0.8, 20, w * 0.5, h * 0.8, w * 0.3);
    shadow.addColorStop(0, 'rgba(118,205,138,.24)');
    shadow.addColorStop(1, 'rgba(118,205,138,0)');
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(w * 0.5, h * 0.83, w * 0.19, h * 0.055, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    drawGroundAndAura();
    const all = scene.shapes.map(shape => {
      const focus = shape.kind === 'leaf' ? shape.out[9][1] : shape.a ? mix(shape.a, shape.b, 0.5) : shape.p;
      return { shape, depth: project(focus).z };
    }).sort((a, b) => a.depth - b.depth);

    for (const { shape } of all) {
      if (shape.kind === 'leaf') {
        renderLeaf(shape);
        continue;
      }
      if (shape.kind === 'line' || shape.kind === 'stamen') {
        const a = project(shape.a), b = project(shape.b);
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = shape.color;
        ctx.lineCap = 'round';
        ctx.lineWidth = shape.kind === 'stamen' ? Math.max(0.55, 0.8 * zoom) : Math.max(0.6, shape.width * (a.s + b.s) * 0.5);
        ctx.stroke();
        continue;
      }
      const p = project(shape.p);
      const r = Math.max(1, shape.r * p.s);
      const g = ctx.createRadialGradient(p.x - r * 0.35, p.y - r * 0.35, 0.2, p.x, p.y, r);
      g.addColorStop(0, shape.kind === 'bud' ? '#f1d798' : shape.color);
      g.addColorStop(1, shape.color);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width || 520;
    h = rect.height || 570;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function motionEnabled() {
    return !document.documentElement.classList.contains('effects-off') && !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function setAuto(value) {
    auto = value;
    document.getElementById('autoRotate')?.setAttribute('aria-pressed', String(auto));
    const state = document.getElementById('rotationState');
    if (state) state.textContent = auto ? 'ATIVA' : 'PAUSADA';
  }

  function applyMode(mode, preserveZoom = false) {
    currentMode = mode;
    scene = scenes[mode];
    canvas.setAttribute('aria-label', scene.ariaLabel);
    yaw = scene.defaults.yaw;
    pitch = scene.defaults.pitch;
    if (!preserveZoom) zoom = scene.defaults.zoom;
    buttonBranch?.classList.toggle('active', mode === 'branch');
    buttonTree?.classList.toggle('active', mode === 'tree');
    buttonBranch?.setAttribute('aria-pressed', String(mode === 'branch'));
    buttonTree?.setAttribute('aria-pressed', String(mode === 'tree'));
    branchReference?.classList.toggle('is-active', mode === 'branch');
    treeReference?.classList.toggle('is-active', mode === 'tree');
    draw();
  }

  function clampZoom() {
    const [minZoom, maxZoom] = scene.zoomRange;
    zoom = Math.max(minZoom, Math.min(maxZoom, zoom));
  }

  function tick(time) {
    if (auto && motionEnabled() && !dragging && document.visibilityState === 'visible') {
      yaw += (Math.min(40, time - last || 16) / 1000) * (scene.name === 'tree' ? 0.075 : 0.10);
    }
    last = time;
    draw();
    raf = requestAnimationFrame(tick);
  }

  canvas.addEventListener('pointerdown', event => {
    dragging = true;
    px = event.clientX;
    py = event.clientY;
    canvas.setPointerCapture(event.pointerId);
    setAuto(false);
  });
  canvas.addEventListener('pointermove', event => {
    if (!dragging) return;
    yaw += (event.clientX - px) * 0.008;
    pitch = Math.max(-0.65, Math.min(0.65, pitch + (event.clientY - py) * 0.004));
    px = event.clientX;
    py = event.clientY;
    draw();
  });
  canvas.addEventListener('pointerup', () => { dragging = false; });
  canvas.addEventListener('pointercancel', () => { dragging = false; });
  canvas.addEventListener('wheel', event => {
    event.preventDefault();
    zoom -= event.deltaY * 0.001;
    clampZoom();
    draw();
  }, { passive: false });

  document.getElementById('autoRotate')?.addEventListener('click', () => setAuto(!auto));
  document.getElementById('resetCamera')?.addEventListener('click', () => {
    yaw = scene.defaults.yaw;
    pitch = scene.defaults.pitch;
    zoom = scene.defaults.zoom;
    setAuto(true);
    draw();
  });
  document.getElementById('zoomIn')?.addEventListener('click', () => {
    zoom += 0.12;
    clampZoom();
    draw();
  });
  document.getElementById('zoomOut')?.addEventListener('click', () => {
    zoom -= 0.12;
    clampZoom();
    draw();
  });
  buttonBranch?.addEventListener('click', () => applyMode('branch'));
  buttonTree?.addEventListener('click', () => applyMode('tree'));

  new ResizeObserver(resize).observe(canvas);
  applyMode('branch');
  resize();
  raf = requestAnimationFrame(tick);
  document.addEventListener('visibilitychange', () => { last = 0; });
})();
