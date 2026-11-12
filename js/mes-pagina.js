'use strict';
const months = window.PIBIC_MONTHS || [];
const releasedMonths = window.PIBIC_RELEASED_MONTHS || 0;
const storageKey = window.PIBIC_PROGRESS_KEY || 'pibic-month-pages-progress-v1';
let toastTimeout;

function $(selector) { return document.querySelector(selector); }
function readProgress() {
  try {
    const value = Number.parseInt(localStorage.getItem(storageKey) ?? '0', 10);
    return Number.isFinite(value) ? Math.min(releasedMonths, Math.max(0, value)) : 0;
  } catch {
    return 0;
  }
}
function writeProgress(value) {
  try { localStorage.setItem(storageKey, String(value)); } catch { /* armazenamento indisponível */ }
}
function stateFor(index, completed) {
  if (index >= releasedMonths) return 'future';
  if (index < completed) return 'done';
  if (index === completed) return 'available';
  return 'locked';
}
function hrefFor(index) {
  return `mes-${String(index + 1).padStart(2, '0')}-${months[index].slug}.html`;
}
function showToast(message) {
  const toast = $('#monthToast');
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3200);
}
function renderHighlights(data) {
  return data.highlights.map(([label, value]) => `
    <article class="month-highlight">
      <small>${label}</small>
      <strong>${value}</strong>
    </article>
  `).join('');
}
function renderSections(data) {
  return data.sections.map(section => `
    <section class="month-section-box">
      <h2>${section.title}</h2>
      <p>${section.text}</p>
    </section>
  `).join('');
}
function renderMapSection(data) {
  if (!data.hasMap) {
    return `
      <div class="month-panel month-placeholder">
        <h3>Sem mapa nesta etapa</h3>
        <p>Esta página segue o modelo mensal padrão. Se você quiser, depois podemos adicionar mapas, galerias, documentos ou fotos reais aos outros meses também.</p>
      </div>
    `;
  }
  return `
    <section class="month-map-stage">
      <div class="map-kicker">
        <div>
          <p>MAPA TERRITORIAL</p>
          <h2>${data.mapTitle}</h2>
        </div>
        <div class="month-status"><span class="month-status-dot"></span> VISUAL 3D</div>
      </div>
      <p class="month-intro">${data.mapText}</p>
      <div class="map-3d-stage" id="map3dStage">
        <div class="map-stack" id="mapStack">
          <div class="map-shadow"></div>
          <div class="map-layer layer-1"></div>
          <div class="map-layer layer-2"></div>
          <div class="map-main">
            <div class="map-grid-glow"></div>
            <img src="assets/mapa-santa-luzia-base.png" alt="Mapa de Santa Luzia do Norte em Alagoas, usado como base visual do primeiro mês.">
            <div class="map-scan" aria-hidden="true"></div>
            <div class="map-pin pin-city" aria-hidden="true"></div>
            <div class="map-pin pin-community" aria-hidden="true"></div>
            <div class="map-tooltip city"><strong>Santa Luzia do Norte — AL</strong>Local de início do projeto e referência territorial desta jornada.</div>
            <div class="map-tooltip community"><strong>Comunidade foco</strong>Comunidade local do município, acompanhada ao longo do projeto.</div>
          </div>
        </div>
      </div>
      <div class="map-meta-grid">
        <article class="map-meta"><small>LOCALIZAÇÃO</small><strong>Santa Luzia do Norte — AL</strong></article>
        <article class="map-meta"><small>MUNICÍPIO EM DESTAQUE</small><strong>Santa Luzia do Norte</strong></article>
        <article class="map-meta"><small>COMUNIDADE</small><strong>Comunidade local do município</strong></article>
        <article class="map-meta"><small>OBJETIVO DESTA PÁGINA</small><strong>Situar o começo do projeto no território</strong></article>
      </div>
    </section>
  `;
}
function statusText(state) {
  return {
    done: 'Mês concluído',
    available: 'Leitura disponível',
    locked: 'Bloqueado até concluir o mês anterior',
    future: 'Etapa futura em preparação'
  }[state];
}
function applyStateSpecificContent(data, state, completed, index) {
  const status = $('#monthStatusLabel');
  if (status) status.textContent = statusText(state);
  const progress = $('#monthProgressInfo');
  if (progress) progress.textContent = `Você concluiu ${completed} de ${months.length} meses.`;
  const button = $('#completeMonthButton');
  const help = $('#completeHelp');
  if (!button || !help) return;

  if (state === 'done') {
    button.disabled = true;
    button.textContent = 'MÊS JÁ CONCLUÍDO ✓';
    help.textContent = 'Este mês já faz parte do caminho iluminado. Você pode revisar o conteúdo livremente.';
  } else if (state === 'available') {
    button.disabled = false;
    button.textContent = 'CONCLUIR LEITURA E DESBLOQUEAR O PRÓXIMO';
    help.textContent = 'Quando terminar a leitura, clique no botão para salvar seu progresso e abrir o próximo mês.';
  } else if (state === 'locked') {
    button.disabled = true;
    button.textContent = 'MÊS BLOQUEADO';
    help.textContent = 'Conclua o mês anterior na ordem da árvore para liberar esta página.';
  } else {
    button.disabled = true;
    button.textContent = 'MÊS AINDA NÃO PUBLICADO';
    help.textContent = 'Esta etapa representa um mês futuro da jornada e será atualizada depois.';
  }

  button.addEventListener('click', () => {
    if (state !== 'available') return;
    const newProgress = Math.min(releasedMonths, completed + 1);
    writeProgress(newProgress);
    showToast(index + 1 < months.length ? `${data.label} concluído. O próximo mês foi desbloqueado.` : 'Jornada concluída.');
    
window.location.href = 'linha-do-tempo.html';
(() => {
      const targetIndex = Math.min(index + 1, months.length - 1);
      window.location.href = hrefFor(targetIndex);
    }, 700);
  });
}
function setupEffects() {
  const stage = $('#map3dStage');
  const stack = $('#mapStack');
  if (stage && stack) {
    stage.addEventListener('pointermove', event => {
      if (document.documentElement.classList.contains('effects-off')) return;
      const rect = stage.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      stack.style.transform = `rotateX(${(-y * 12).toFixed(2)}deg) rotateY(${(x * 16).toFixed(2)}deg) translateZ(0)`;
    });
    stage.addEventListener('pointerleave', () => {
      stack.style.transform = 'rotateX(0deg) rotateY(0deg)';
    });
  }
}
window.addEventListener('storage', event => {
  if (!event.key || event.key === storageKey) location.reload();
});
document.addEventListener('DOMContentLoaded', () => {
  const root = document.body;
  const index = Number.parseInt(root.dataset.monthIndex || '-1', 10);
  const data = months[index];
  if (!data) return;
  const completed = readProgress();
  const state = stateFor(index, completed);
  $('#monthKicker').textContent = `MÊS ${String(index + 1).padStart(2, '0')} · ${data.label} ${data.year}`;
  $('#monthTitle').innerHTML = `${data.title.split(' ').slice(0, -1).join(' ')} <em>${data.title.split(' ').slice(-1).join(' ')}</em>`;
  $('#monthIntro').textContent = data.intro;
  $('#monthSummary').textContent = data.summary;
  $('#monthStatusLabel').textContent = statusText(state);
  $('#monthHighlights').innerHTML = renderHighlights(data);
  $('#monthSections').innerHTML = renderSections(data);
  $('#monthAside').innerHTML = renderMapSection(data);
  $('#monthNumberBadge').textContent = `${String(index + 1).padStart(2, '0')} / 12`;
  $('#monthProjectTag').textContent = data.statusText;
  applyStateSpecificContent(data, state, completed, index);
  setupEffects();
});
