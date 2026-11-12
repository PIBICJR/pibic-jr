const root = document.documentElement;
let tx = 0, ty = 0, px = 0, py = 0;
document.addEventListener('pointermove', e => { if (root.classList.contains('effects-off')) return; root.style.setProperty('--mx', e.clientX + 'px'); root.style.setProperty('--my', e.clientY + 'px'); tx = (e.clientX / window.innerWidth - .5) * 42; ty = (e.clientY / window.innerHeight - .5) * 42; }, { passive: true });
function animate() { if (root.classList.contains('effects-off')) { requestAnimationFrame(animate); return; } px += (tx - px) * .065; py += (ty - py) * .065; root.style.setProperty('--px', px + 'px'); root.style.setProperty('--py', py + 'px'); requestAnimationFrame(animate); }
if (!matchMedia('(prefers-reduced-motion: reduce)').matches)
    animate();
const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) {
    e.target.classList.add('visible');
    io.unobserve(e.target);
} }), { threshold: .12 });
document.querySelectorAll('.reveal').forEach(el => io.observe(el));
document.getElementById('menu').addEventListener('click', () => { const n = document.querySelector('nav'); n.style.display = n.style.display === 'flex' ? 'none' : 'flex'; Object.assign(n.style, { position: 'absolute', top: '75px', left: '0', right: '0', padding: '25px', background: '#09180ff2', flexDirection: 'column', borderRadius: '18px' }); });
// Folhas vetoriais criadas localmente: não exigem bibliotecas nem imagens externas.
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const leafSVG = '<svg viewBox="0 0 44 68" aria-hidden="true"><path d="M22 61C-2 37 4 13 38 2 45 29 39 50 22 61Z"/><path d="M22 61Q28 34 38 2" fill="none" stroke="#e3ffbe" stroke-width="1.3" opacity=".54"/></svg>';
let seed = 2026;
function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; }
const field = document.getElementById('leaf-field');
for (let i = 0; i < 23; i++) {
    const node = document.createElement('span');
    node.className = 'falling-leaf';
    const size = 12 + random() * 30;
    const drift = (-200 + random() * 400).toFixed(1) + 'px';
    node.style.cssText = `--left:${(random() * 104 - 2).toFixed(2)}%;--size:${size.toFixed(1)}px;--duration:${(12 + random() * 21).toFixed(2)}s;--delay:${(-random() * 31).toFixed(2)}s;--drift:${drift};--turn:${Math.floor(random() * 360)}deg;--opacity:${(.23 + random() * .47).toFixed(2)};--leaf-color:${['#72b651', '#a6d968', '#45895c', '#d0eba0', '#387c4e'][i % 5]}`;
    node.innerHTML = leafSVG;
    field.append(node);
}
const glimmers = document.getElementById('glimmer-field');
for (let i = 0; i < 23; i++) {
    const n = document.createElement('i');
    n.className = 'botanical-glimmer';
    n.style.cssText = `--left:${(random() * 100).toFixed(2)}%;--top:${(random() * 100).toFixed(2)}%;--duration:${(2 + random() * 4).toFixed(2)}s;--delay:${(-random() * 6).toFixed(2)}s`;
    glimmers.append(n);
}
