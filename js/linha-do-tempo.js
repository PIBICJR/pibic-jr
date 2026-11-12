'use strict';
const months = window.PIBIC_MONTHS || [];
const releasedMonths = window.PIBIC_RELEASED_MONTHS || 0;
const storageKey = window.PIBIC_PROGRESS_KEY || 'pibic-month-pages-progress-v1';
const coordinates = [
  [500, 1375], [320, 1130], [685, 1030], [410, 805],
  [735, 665], [490, 470], [245, 310], [500, 145],
  [755, 310], [870, 455], [755, 105], [895, 185]
];
const edges = [[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,8],[8,9],[9,10],[10,11]];
let completed = 0;
let toastTimeout;

const $ = (selector) => document.querySelector(selector);
function safeRead(key, fallback) {
  try { return localStorage.getItem(key) ?? fallback; } catch { return fallback; }
}
function safeWrite(key, value) {
  try { localStorage.setItem(key, value); } catch { /* armazenamento indisponível */ }
}
function loadProgress() {
  const value = Number.parseInt(safeRead(storageKey, '0'), 10);
  completed = Number.isFinite(value) ? Math.min(releasedMonths, Math.max(0, value)) : 0;
}
function stateFor(index) {
  if (index >= releasedMonths) return 'future';
  if (index < completed) return 'done';
  if (index === completed) return 'available';
  return 'locked';
}
function edgePath(start, end) {
  const [x1, y1] = coordinates[start];
  const [x2, y2] = coordinates[end];
  const centerY = (y1 + y2) / 2;
  return `M ${x1} ${y1} C ${x1} ${centerY}, ${x2} ${centerY}, ${x2} ${y2}`;
}
function svgPath(d, className) {
  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', d);
  path.setAttribute('class', className);
  return path;
}
function renderBranches() {
  const background = $('#branchBackground');
  const active = $('#branchActive');
  background.replaceChildren();
  active.replaceChildren();
  for (const [from, to] of edges) {
    const path = edgePath(from, to);
    background.append(svgPath(path, 'branch-background-path'));
    if (to <= completed && to < releasedMonths) {
      active.append(svgPath(path, 'branch-active-glow'));
      active.append(svgPath(path, 'branch-active-path'));
    }
  }
}
function monthHref(index) {
  return `mes-${String(index + 1).padStart(2, '0')}-${months[index].slug}.html`;
}
function makeNode(index, state) {
  const month = months[index];
  const link = document.createElement('a');
  link.className = 'skill-node';
  link.dataset.state = state;
  link.href = monthHref(index);
  link.style.left = `${coordinates[index][0] / 10}%`;
  link.style.top = `${coordinates[index][1] / 15.6}%`;
  const stateLabel = {done: 'CONCLUÍDO ✓', available: 'DISPONÍVEL ↗', locked: 'A DESBLOQUEAR', future: 'EM PREPARAÇÃO'}[state];
  link.setAttribute('aria-label', `${month.label} de ${month.year}: ${month.title}. ${stateLabel}`);
  link.innerHTML = `<span class="node-ring"><span class="node-symbol" aria-hidden="true">${month.symbol}</span></span><span class="node-index">MÊS ${String(index + 1).padStart(2, '0')}</span><strong class="node-month">${month.label} ${month.year}</strong><span class="node-state">${stateLabel}</span>`;
  if (state === 'locked' || state === 'future') {
    link.setAttribute('aria-disabled', 'true');
    link.addEventListener('click', event => {
      event.preventDefault();
      showToast(state === 'future' ? 'Esse mês está em preparação.' : 'Conclua os meses anteriores para desbloquear esta página.');
    });
  }
  return link;
}
function renderNodes() {
  const wrapper = $('#skillNodes');
  wrapper.replaceChildren();
  months.forEach((month, index) => wrapper.append(makeNode(index, stateFor(index))));
}
function renderTextGrid() {
  const grid = $('#monthLinkGrid');
  if (!grid) return;
  grid.replaceChildren();
  months.forEach((month, index) => {
    const state = stateFor(index);
    const item = document.createElement(state === 'locked' || state === 'future' ? 'button' : 'a');
    item.className = 'month-pill';
    item.dataset.state = state;
    item.innerHTML = `<span>${String(index + 1).padStart(2, '0')}</span> ${month.label}`;
    if (item.tagName === 'A') item.href = monthHref(index);
    else item.type = 'button';
    item.addEventListener('click', event => {
      if (state === 'locked' || state === 'future') {
        event.preventDefault();
        showToast(state === 'future' ? 'Esse mês ainda não foi publicado.' : 'Esse mês será liberado depois da próxima leitura concluída.');
      }
    });
    grid.append(item);
  });
}
function renderProgress() {
  $('#completeCount').textContent = String(completed);
  const percent = Math.round((completed / months.length) * 100);
  $('#progressText').textContent = `${percent}%`;
  $('#progressFill').style.width = `${percent}%`;
  $('#progressBar').setAttribute('aria-valuenow', String(completed));
}
function showToast(message) {
  const el = $('#toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => el.classList.remove('visible'), 3400);
}
function setupEffects() {
  const leafField = $('#leafField');
  if (leafField) {
    for (let i = 0; i < 16; i++) {
      const leaf = document.createElement('span');
      leaf.className = 'floating-leaf';
      leaf.style.left = `${(i * 37.7) % 100}%`;
      leaf.style.animationDuration = `${15 + (i % 6) * 4}s`;
      leaf.style.animationDelay = `${-i * 3.1}s`;
      leaf.style.scale = `${0.5 + (i % 5) * .2}`;
      leafField.append(leaf);
    }
  }
  document.addEventListener('pointermove', (event) => {
    if (document.documentElement.classList.contains('effects-off')) return;
    const cursor = $('#cursorLight');
    if (!cursor) return;
    cursor.style.left = `${event.clientX}px`;
    cursor.style.top = `${event.clientY}px`;
  }, {passive:true});
}
function renderAll() { renderBranches(); renderNodes(); renderTextGrid(); renderProgress(); }
function setupEvents() {
  $('#startJourney')?.addEventListener('click', () => {
    const nextIndex = completed < releasedMonths ? completed : 0;
    window.location.href = monthHref(nextIndex);
  });
  $('#resetProgress')?.addEventListener('click', () => {
    if (!window.confirm('Deseja reiniciar o progresso de leitura desta jornada?')) return;
    completed = 0;
    safeWrite(storageKey, '0');
    renderAll();
    showToast('Jornada reiniciada. Junho está disponível para explorar.');
  });
  window.addEventListener('storage', (event) => {
    if (!event.key || event.key === storageKey) {
      loadProgress();
      renderAll();
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  loadProgress();
  renderAll();
  setupEffects();
  setupEvents();
});
