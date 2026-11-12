(() => {
  "use strict";
  const search = document.getElementById("plantSearch");
  const grid = document.getElementById("plantGrid");
  const cards = [...grid.querySelectorAll(".plant-card")];
  const status = document.getElementById("searchStatus");
  const empty = document.getElementById("emptyState");
  const count = document.getElementById("count");
  const buttons = [...document.querySelectorAll("[data-view]")];
  const stored = (() => { try { return localStorage.getItem("pibic-plants-view") } catch { return null; } })();
  function setView(view) {
    if (!["list", "compact", "grid", "large"].includes(view)) view = "grid";
    grid.dataset.view = view;
    buttons.forEach(b => b.setAttribute("aria-pressed", String(b.dataset.view === view)));
    try { localStorage.setItem("pibic-plants-view", view); } catch {}
  }
  function normalize(text) { return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }
  function filter() {
    const term = normalize(search.value);
    let shown = 0;
    cards.forEach(card => {
      const match = normalize(card.dataset.name).includes(term);
      card.hidden = !match;
      if (match) shown++;
    });
    status.textContent = `MOSTRANDO ${String(shown).padStart(2, "0")} ${shown === 1 ? "RESULTADO" : "RESULTADOS"}`;
    count.textContent = String(shown).padStart(2, "0");
    empty.hidden = shown !== 0;
  }
  buttons.forEach(button => button.addEventListener("click", () => setView(button.dataset.view)));
  document.getElementById("clearSearch").addEventListener("click", () => { search.value = ""; filter(); search.focus(); });
  search.addEventListener("input", filter);
  setView(stored || "grid"); filter();
})();
