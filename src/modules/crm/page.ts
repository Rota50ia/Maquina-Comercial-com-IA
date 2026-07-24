export function renderCrmPage() {
  return `<!doctype html>
<html lang="pt-BR">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Máquina Comercial | CRM</title>
  <style>
    :root {
      color-scheme: light;
      --bg: #f5f7f8;
      --panel: #ffffff;
      --ink: #172026;
      --muted: #64717a;
      --line: #d9e0e4;
      --accent: #0f766e;
      --accent-weak: #d9f3ef;
      --hot: #b42318;
      --warm: #b45309;
      --ok: #15803d;
      --cold: #475569;
      --focus: #2563eb;
    }

    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--ink);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      font-size: 14px;
      line-height: 1.4;
    }

    header {
      border-bottom: 1px solid var(--line);
      background: var(--panel);
    }

    .shell {
      width: min(1440px, 100%);
      margin: 0 auto;
      padding: 18px 24px;
    }

    .topbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
    }

    h1 {
      margin: 0;
      font-size: 20px;
      font-weight: 750;
      letter-spacing: 0;
    }

    .subtitle {
      margin-top: 2px;
      color: var(--muted);
      font-size: 13px;
    }

    .refresh {
      min-height: 36px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--ink);
      color: #fff;
      padding: 0 12px;
      font-weight: 650;
      cursor: pointer;
    }

    main.shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 380px;
      gap: 18px;
      align-items: start;
    }

    .toolbar,
    .table-wrap,
    .detail {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }

    .toolbar {
      display: grid;
      grid-template-columns: 1fr repeat(3, minmax(150px, 190px));
      gap: 10px;
      padding: 12px;
      margin-bottom: 12px;
    }

    input,
    select {
      width: 100%;
      min-height: 38px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      padding: 0 10px;
      font: inherit;
    }

    input:focus,
    select:focus,
    button:focus {
      outline: 2px solid var(--focus);
      outline-offset: 1px;
    }

    .metrics {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 10px;
      margin-bottom: 12px;
    }

    .metric {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      min-height: 74px;
    }

    .metric span {
      display: block;
      color: var(--muted);
      font-size: 12px;
      margin-bottom: 4px;
    }

    .metric strong {
      font-size: 24px;
      letter-spacing: 0;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      table-layout: fixed;
    }

    th,
    td {
      border-bottom: 1px solid var(--line);
      padding: 11px 10px;
      text-align: left;
      vertical-align: top;
    }

    th {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
      background: #fbfcfd;
    }

    td {
      overflow-wrap: anywhere;
    }

    tr {
      cursor: pointer;
    }

    tr:hover td,
    tr.selected td {
      background: var(--accent-weak);
    }

    .lead-name {
      font-weight: 750;
      display: block;
      margin-bottom: 2px;
    }

    .muted {
      color: var(--muted);
      font-size: 12px;
    }

    .badge {
      display: inline-flex;
      align-items: center;
      min-height: 24px;
      border-radius: 999px;
      padding: 0 8px;
      font-size: 12px;
      font-weight: 750;
      background: #edf2f4;
      color: var(--cold);
      white-space: nowrap;
    }

    .badge.quente,
    .badge.prioridade { background: #fee4e2; color: var(--hot); }
    .badge.morno { background: #fef3c7; color: var(--warm); }
    .badge.frio { background: #e2e8f0; color: var(--cold); }

    .detail {
      min-height: 520px;
      position: sticky;
      top: 16px;
      overflow: hidden;
    }

    .detail-head,
    .detail-section {
      padding: 14px;
      border-bottom: 1px solid var(--line);
    }

    .detail-head h2 {
      margin: 0 0 4px;
      font-size: 18px;
      letter-spacing: 0;
    }

    .detail-section h3 {
      margin: 0 0 10px;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0;
      color: var(--muted);
    }

    .stack {
      display: grid;
      gap: 8px;
    }

    .kv {
      display: grid;
      grid-template-columns: 118px 1fr;
      gap: 8px;
      font-size: 13px;
    }

    .kv span:first-child {
      color: var(--muted);
    }

    .tag-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .empty,
    .error {
      padding: 24px;
      color: var(--muted);
    }

    .error {
      color: var(--hot);
    }

    @media (max-width: 980px) {
      main.shell {
        grid-template-columns: 1fr;
      }

      .detail {
        position: static;
      }

      .toolbar {
        grid-template-columns: 1fr 1fr;
      }
    }

    @media (max-width: 720px) {
      .shell {
        padding: 14px;
      }

      .topbar,
      .toolbar {
        grid-template-columns: 1fr;
        display: grid;
      }

      .metrics {
        grid-template-columns: 1fr 1fr;
      }

      table {
        min-width: 760px;
      }

      .table-wrap {
        overflow-x: auto;
      }
    }
  </style>
</head>
<body>
  <header>
    <div class="shell topbar">
      <div>
        <h1>Máquina Comercial</h1>
        <div class="subtitle">Leads, gargalos, score e rota comercial</div>
      </div>
      <button class="refresh" id="refreshButton" type="button">Atualizar</button>
    </div>
  </header>

  <main class="shell">
    <section>
      <div class="metrics" id="metrics"></div>
      <div class="toolbar">
        <input id="searchInput" type="search" placeholder="Buscar por nome, e-mail, WhatsApp ou tag">
        <select id="classificationFilter" aria-label="Filtrar por classificação">
          <option value="">Todas as classificações</option>
          <option value="frio">Frio</option>
          <option value="morno">Morno</option>
          <option value="quente">Quente</option>
          <option value="prioridade">Prioridade</option>
        </select>
        <select id="gargaloFilter" aria-label="Filtrar por gargalo">
          <option value="">Todos os gargalos</option>
        </select>
        <select id="routeFilter" aria-label="Filtrar por rota">
          <option value="">Todas as rotas</option>
        </select>
      </div>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th style="width: 26%">Lead</th>
              <th style="width: 16%">Gargalo</th>
              <th style="width: 12%">Score</th>
              <th style="width: 24%">Rota</th>
              <th style="width: 12%">Entrada</th>
              <th style="width: 10%">Canal</th>
            </tr>
          </thead>
          <tbody id="leadRows"></tbody>
        </table>
        <div id="tableState" class="empty">Carregando leads...</div>
      </div>
    </section>

    <aside class="detail" id="detailPanel">
      <div class="detail-head">
        <h2>Selecione um lead</h2>
        <div class="muted">O histórico aparecerá aqui.</div>
      </div>
    </aside>
  </main>

  <script>
    const state = {
      leads: [],
      filtered: [],
      selectedId: null,
    };

    const elements = {
      metrics: document.getElementById("metrics"),
      rows: document.getElementById("leadRows"),
      tableState: document.getElementById("tableState"),
      detail: document.getElementById("detailPanel"),
      search: document.getElementById("searchInput"),
      classification: document.getElementById("classificationFilter"),
      gargalo: document.getElementById("gargaloFilter"),
      route: document.getElementById("routeFilter"),
      refresh: document.getElementById("refreshButton"),
    };

    elements.refresh.addEventListener("click", loadLeads);
    elements.search.addEventListener("input", applyFilters);
    elements.classification.addEventListener("change", applyFilters);
    elements.gargalo.addEventListener("change", applyFilters);
    elements.route.addEventListener("change", applyFilters);

    loadLeads();

    async function loadLeads() {
      elements.tableState.textContent = "Carregando leads...";
      elements.tableState.className = "empty";

      try {
        const response = await fetch("/internal/leads", { credentials: "same-origin" });
        if (!response.ok) throw new Error("Falha ao carregar leads.");

        const data = await response.json();
        state.leads = data.leads || [];
        state.filtered = state.leads;
        populateDynamicFilters();
        applyFilters();
      } catch (error) {
        elements.tableState.textContent = error.message;
        elements.tableState.className = "error";
      }
    }

    function applyFilters() {
      const query = normalize(elements.search.value);
      const classification = elements.classification.value;
      const gargalo = elements.gargalo.value;
      const route = elements.route.value;

      state.filtered = state.leads.filter((lead) => {
        const score = lead.latestScore;
        const quiz = lead.latestQuizSubmission;
        const decision = lead.latestRoute;
        const tags = (lead.tags || []).map((tag) => tag.key).join(" ");
        const searchable = normalize([
          lead.name,
          lead.email,
          lead.phone,
          quiz && quiz.gargalo,
          decision && decision.route,
          tags,
        ].filter(Boolean).join(" "));

        return (!query || searchable.includes(query))
          && (!classification || (score && score.classification === classification))
          && (!gargalo || (quiz && quiz.gargalo === gargalo))
          && (!route || (decision && decision.route === route));
      });

      renderMetrics();
      renderRows();
    }

    function renderMetrics() {
      const total = state.filtered.length;
      const quente = state.filtered.filter((lead) => lead.latestScore && lead.latestScore.classification === "quente").length;
      const prioridade = state.filtered.filter((lead) => lead.latestScore && lead.latestScore.classification === "prioridade").length;
      const semRota = state.filtered.filter((lead) => !lead.latestRoute).length;

      elements.metrics.innerHTML = [
        metric("Leads", total),
        metric("Quentes", quente),
        metric("Prioridade", prioridade),
        metric("Sem rota", semRota),
      ].join("");
    }

    function metric(label, value) {
      return '<div class="metric"><span>' + escapeHtml(label) + '</span><strong>' + value + '</strong></div>';
    }

    function renderRows() {
      elements.rows.innerHTML = "";

      if (!state.filtered.length) {
        elements.tableState.textContent = "Nenhum lead encontrado.";
        elements.tableState.className = "empty";
        elements.tableState.style.display = "block";
        return;
      }

      elements.tableState.style.display = "none";

      for (const lead of state.filtered) {
        const quiz = lead.latestQuizSubmission || {};
        const score = lead.latestScore || {};
        const route = lead.latestRoute || {};
        const row = document.createElement("tr");
        row.className = lead.id === state.selectedId ? "selected" : "";
        row.innerHTML = [
          cell('<span class="lead-name">' + escapeHtml(lead.name || "Lead sem nome") + '</span><span class="muted">' + escapeHtml(lead.email || lead.phone || "") + '</span>'),
          cell(escapeHtml(quiz.gargalo || "-")),
          cell('<span class="badge ' + escapeHtml(score.classification || "") + '">' + escapeHtml(score.classification || "sem score") + '</span><div class="muted">' + escapeHtml(score.score ?? "-") + '</div>'),
          cell(escapeHtml(route.route || "-") + '<div class="muted">' + escapeHtml(route.reason || "") + '</div>'),
          cell(formatDate(quiz.submittedAt || lead.createdAt)),
          cell(escapeHtml(lead.preferredChannel || "-")),
        ].join("");
        row.addEventListener("click", () => selectLead(lead.id));
        elements.rows.appendChild(row);
      }
    }

    function cell(content) {
      return "<td>" + content + "</td>";
    }

    async function selectLead(id) {
      state.selectedId = id;
      renderRows();
      elements.detail.innerHTML = '<div class="detail-head"><h2>Carregando...</h2></div>';

      try {
        const response = await fetch("/internal/leads/" + encodeURIComponent(id), { credentials: "same-origin" });
        if (!response.ok) throw new Error("Falha ao carregar lead.");

        const data = await response.json();
        renderDetail(data.lead);
      } catch (error) {
        elements.detail.innerHTML = '<div class="error">' + escapeHtml(error.message) + '</div>';
      }
    }

    function renderDetail(lead) {
      const latestQuiz = lead.quizSubmissions[0] || {};
      const latestScore = lead.leadScores[0] || {};
      const latestRoute = lead.routeDecisions[0] || {};
      const tags = (lead.tags || []).map((tag) => '<span class="badge">' + escapeHtml(tag.key) + '</span>').join("");
      const events = (lead.eventLogs || []).slice(0, 8).map((event) => (
        '<div class="kv"><span>' + formatDate(event.createdAt) + '</span><strong>' + escapeHtml(event.eventType) + '</strong></div>'
      )).join("");

      elements.detail.innerHTML = [
        '<div class="detail-head"><h2>' + escapeHtml(lead.name || "Lead sem nome") + '</h2><div class="muted">' + escapeHtml(lead.email || "") + ' ' + escapeHtml(lead.phone || "") + '</div></div>',
        section("Diagnóstico", [
          kv("Gargalo", latestQuiz.gargalo || "-"),
          kv("Resultado", latestQuiz.resultTitle || "-"),
          kv("Entrada", formatDate(latestQuiz.submittedAt || lead.createdAt)),
        ].join("")),
        section("Score e rota", [
          kv("Score", latestScore.score ?? "-"),
          kv("Classificação", latestScore.classification || "-"),
          kv("Rota", latestRoute.route || "-"),
          kv("Motivo", latestRoute.reason || "-"),
        ].join("")),
        section("Tags", '<div class="tag-list">' + (tags || '<span class="muted">Sem tags</span>') + '</div>'),
        section("Eventos", '<div class="stack">' + (events || '<span class="muted">Sem eventos</span>') + '</div>'),
      ].join("");
    }

    function section(title, content) {
      return '<div class="detail-section"><h3>' + escapeHtml(title) + '</h3><div class="stack">' + content + '</div></div>';
    }

    function kv(label, value) {
      return '<div class="kv"><span>' + escapeHtml(label) + '</span><strong>' + escapeHtml(String(value)) + '</strong></div>';
    }

    function populateDynamicFilters() {
      setOptions(elements.gargalo, "Todos os gargalos", uniqueValues(state.leads.map((lead) => lead.latestQuizSubmission && lead.latestQuizSubmission.gargalo)));
      setOptions(elements.route, "Todas as rotas", uniqueValues(state.leads.map((lead) => lead.latestRoute && lead.latestRoute.route)));
    }

    function setOptions(select, label, values) {
      const selected = select.value;
      select.innerHTML = '<option value="">' + escapeHtml(label) + '</option>' + values.map((value) => (
        '<option value="' + escapeHtml(value) + '">' + escapeHtml(value) + '</option>'
      )).join("");
      select.value = values.includes(selected) ? selected : "";
    }

    function uniqueValues(values) {
      return Array.from(new Set(values.filter(Boolean))).sort();
    }

    function normalize(value) {
      return String(value || "").trim().toLowerCase();
    }

    function formatDate(value) {
      if (!value) return "-";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      }).format(new Date(value));
    }

    function escapeHtml(value) {
      return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
    }
  </script>
</body>
</html>`;
}
