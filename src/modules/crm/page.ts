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
      --danger: #b42318;
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

    .refresh,
    .action-button {
      min-height: 36px;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: var(--ink);
      color: #fff;
      padding: 0 12px;
      font-weight: 650;
      cursor: pointer;
    }

    .action-button {
      width: 100%;
      background: #fff;
      color: var(--ink);
    }

    .action-button.primary {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }

    .action-button.danger {
      background: #fff;
      border-color: #fecaca;
      color: var(--danger);
    }

    .refresh:disabled,
    .action-button:disabled {
      cursor: wait;
      opacity: 0.62;
    }

    main.shell {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 380px;
      gap: 18px;
      align-items: start;
    }

    main.shell.report-mode {
      grid-template-columns: 1fr;
    }

    .toolbar,
    .view-tabs,
    .table-wrap,
    .report,
    .detail {
      background: var(--panel);
      border: 1px solid var(--line);
      border-radius: 8px;
    }

    .toolbar {
      display: grid;
      grid-template-columns: 1fr repeat(4, minmax(140px, 180px));
      gap: 10px;
      padding: 12px;
      margin-bottom: 12px;
    }

    .view-tabs {
      display: inline-grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 4px;
      padding: 4px;
      margin-bottom: 12px;
    }

    .view-button {
      min-height: 34px;
      border: 0;
      border-radius: 5px;
      background: transparent;
      color: var(--muted);
      padding: 0 12px;
      font-weight: 750;
      cursor: pointer;
    }

    .view-button.active {
      background: var(--ink);
      color: #fff;
    }

    input,
    select,
    textarea {
      width: 100%;
      border: 1px solid var(--line);
      border-radius: 6px;
      background: #fff;
      color: var(--ink);
      padding: 0 10px;
      font: inherit;
    }

    input,
    select {
      min-height: 38px;
    }

    textarea {
      min-height: 78px;
      padding: 10px;
      resize: vertical;
    }

    .message-text {
      min-height: 148px;
    }

    input:focus,
    select:focus,
    textarea:focus,
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

    .report {
      padding: 14px;
      margin-bottom: 12px;
    }

    .report-head {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 14px;
    }

    .report-head h2,
    .report-section h3 {
      margin: 0;
      letter-spacing: 0;
    }

    .report-head h2 {
      font-size: 18px;
    }

    .report-section h3 {
      font-size: 13px;
      text-transform: uppercase;
      color: var(--muted);
      margin-bottom: 10px;
    }

    .report-grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
    }

    .report-section {
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 12px;
      min-height: 160px;
      background: #fff;
    }

    .report-section.full {
      grid-column: 1 / -1;
    }

    .bar-list {
      display: grid;
      gap: 8px;
    }

    .bar-row {
      display: grid;
      grid-template-columns: minmax(120px, 1fr) minmax(120px, 2fr) 44px;
      align-items: center;
      gap: 8px;
      font-size: 13px;
    }

    .bar-label {
      overflow-wrap: anywhere;
      font-weight: 650;
    }

    .bar-track {
      height: 8px;
      border-radius: 999px;
      background: #edf2f4;
      overflow: hidden;
    }

    .bar-fill {
      display: block;
      height: 100%;
      border-radius: inherit;
      background: var(--accent);
    }

    .report-events {
      display: grid;
      gap: 8px;
    }

    .report-event {
      display: grid;
      grid-template-columns: 112px 1fr;
      gap: 10px;
      padding-bottom: 8px;
      border-bottom: 1px solid var(--line);
      font-size: 13px;
    }

    .report-event:last-child {
      border-bottom: 0;
      padding-bottom: 0;
    }

    .hidden {
      display: none !important;
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
    .badge.active { background: #dcfce7; color: var(--ok); }
    .badge.paused { background: #fef3c7; color: var(--warm); }
    .badge.optout { background: #fee4e2; color: var(--hot); }

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

    .field-label {
      color: var(--muted);
      font-size: 12px;
      font-weight: 700;
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

    .actions-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 8px;
    }

    .message-actions {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr;
      gap: 8px;
    }

    .notice {
      border-radius: 6px;
      padding: 10px;
      background: #f1f5f9;
      color: var(--muted);
      font-size: 12px;
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

      .view-tabs {
        display: grid;
        grid-template-columns: 1fr 1fr;
      }

      .report-grid,
      .bar-row,
      .report-event {
        grid-template-columns: 1fr;
      }

      .message-actions {
        grid-template-columns: 1fr;
      }

      table {
        min-width: 860px;
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
        <div class="subtitle">Leads, gargalos, score e rota comercial <span id="lastUpdated"></span></div>
      </div>
      <button class="refresh" id="refreshButton" type="button">Atualizar</button>
    </div>
  </header>

  <main class="shell" id="crmShell">
    <section>
      <div class="metrics" id="metrics"></div>
      <div class="view-tabs" aria-label="Visão do CRM">
        <button class="view-button active" type="button" data-view="all">Todos</button>
        <button class="view-button" type="button" data-view="handoff">Fila handoff</button>
        <button class="view-button" type="button" data-view="followup">Follow-up</button>
        <button class="view-button" type="button" data-view="report">Relatório</button>
      </div>
      <div class="report hidden" id="reportPanel"></div>
      <div class="toolbar" id="toolbar">
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
        <select id="statusFilter" aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="active">Ativo</option>
          <option value="paused">Pausado</option>
          <option value="optout">Opt-out</option>
        </select>
      </div>
      <div class="table-wrap" id="tableWrap">
        <table>
          <thead>
            <tr>
              <th style="width: 23%">Lead</th>
              <th style="width: 13%">Status</th>
              <th style="width: 14%">Gargalo</th>
              <th style="width: 12%">Score</th>
              <th style="width: 22%">Rota</th>
              <th style="width: 10%">Entrada</th>
              <th style="width: 6%">Canal</th>
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
      view: "all",
      report: null,
    };

    const elements = {
      shell: document.getElementById("crmShell"),
      metrics: document.getElementById("metrics"),
      report: document.getElementById("reportPanel"),
      toolbar: document.getElementById("toolbar"),
      tableWrap: document.getElementById("tableWrap"),
      rows: document.getElementById("leadRows"),
      tableState: document.getElementById("tableState"),
      detail: document.getElementById("detailPanel"),
      search: document.getElementById("searchInput"),
      classification: document.getElementById("classificationFilter"),
      gargalo: document.getElementById("gargaloFilter"),
      route: document.getElementById("routeFilter"),
      status: document.getElementById("statusFilter"),
      refresh: document.getElementById("refreshButton"),
      lastUpdated: document.getElementById("lastUpdated"),
      viewButtons: Array.from(document.querySelectorAll("[data-view]")),
    };

    elements.refresh.addEventListener("click", () => {
      if (state.view === "report") {
        loadReport({ showFeedback: true });
        return;
      }

      loadLeads({ refreshDetail: true, showFeedback: true });
    });
    elements.search.addEventListener("input", applyFilters);
    elements.classification.addEventListener("change", applyFilters);
    elements.gargalo.addEventListener("change", applyFilters);
    elements.route.addEventListener("change", applyFilters);
    elements.status.addEventListener("change", applyFilters);
    for (const button of elements.viewButtons) {
      button.addEventListener("click", () => setView(button.dataset.view));
    }

    loadLeads();

    async function loadLeads(options = {}) {
      if (options.showFeedback) {
        setRefreshState("Atualizando...", true);
      }

      if (!state.leads.length) {
        elements.tableState.textContent = "Carregando leads...";
        elements.tableState.className = "empty";
      }

      try {
        const url = getLeadsUrl();
        const response = await fetch(url, { credentials: "same-origin" });
        if (!response.ok) throw new Error("Falha ao carregar leads.");

        const data = await response.json();
        state.leads = data.leads || [];
        state.filtered = state.leads;
        populateDynamicFilters();
        applyFilters();

        if (options.refreshDetail && state.selectedId) {
          await selectLead(state.selectedId);
        }

        elements.lastUpdated.textContent = "· atualizado " + formatTime(new Date());

        if (options.showFeedback) {
          setRefreshState("Atualizado", false);
          setTimeout(() => setRefreshState("Atualizar", false), 1200);
        }
      } catch (error) {
        elements.tableState.textContent = error.message;
        elements.tableState.className = "error";

        if (options.showFeedback) {
          setRefreshState("Erro", false);
          setTimeout(() => setRefreshState("Atualizar", false), 1600);
        }
      }
    }

    function applyFilters() {
      const query = normalize(elements.search.value);
      const classification = elements.classification.value;
      const gargalo = elements.gargalo.value;
      const route = elements.route.value;
      const status = elements.status.value;

      state.filtered = state.leads.filter((lead) => {
        const score = lead.latestScore;
        const quiz = lead.latestQuizSubmission;
        const decision = lead.latestRoute;
        const tags = (lead.tags || []).map((tag) => tag.key).join(" ");
        const searchable = normalize([
          lead.name,
          lead.email,
          lead.phone,
          lead.status,
          quiz && quiz.gargalo,
          decision && decision.route,
          tags,
        ].filter(Boolean).join(" "));

        return (!query || searchable.includes(query))
          && (!classification || (score && score.classification === classification))
          && (!gargalo || (quiz && quiz.gargalo === gargalo))
          && (!route || (decision && decision.route === route))
          && (!status || lead.status === status);
      });

      renderMetrics();
      renderRows();
    }

    function renderMetrics() {
      const total = state.filtered.length;
      const quente = state.filtered.filter((lead) => lead.latestScore && lead.latestScore.classification === "quente").length;
      const followup = state.filtered.filter(isLeadInFollowUpQueue).length;
      const handoff = state.filtered.filter(isLeadInHandoffQueue).length;

      elements.metrics.innerHTML = [
        metric("Leads", total),
        metric("Quentes", quente),
        metric("Follow-up", followup),
        metric("Handoff", handoff),
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
          cell('<span class="badge ' + escapeHtml(lead.status || "") + '">' + escapeHtml(statusLabel(lead.status)) + '</span>'),
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

    function setView(view) {
      state.view = ["handoff", "followup", "report"].includes(view) ? view : "all";
      state.selectedId = null;
      elements.detail.innerHTML = '<div class="detail-head"><h2>Selecione um lead</h2><div class="muted">O histórico aparecerá aqui.</div></div>';

      for (const button of elements.viewButtons) {
        button.classList.toggle("active", button.dataset.view === state.view);
      }

      toggleViewPanels();
      if (state.view === "report") {
        loadReport({ showFeedback: true });
        return;
      }

      loadLeads({ showFeedback: true });
    }

    function toggleViewPanels() {
      const isReport = state.view === "report";
      elements.shell.classList.toggle("report-mode", isReport);
      elements.report.classList.toggle("hidden", !isReport);
      elements.toolbar.classList.toggle("hidden", isReport);
      elements.tableWrap.classList.toggle("hidden", isReport);
      elements.detail.classList.toggle("hidden", isReport);
    }

    async function loadReport(options = {}) {
      if (options.showFeedback) {
        setRefreshState("Atualizando...", true);
      }

      elements.metrics.innerHTML = "";
      elements.report.className = "report";
      elements.report.innerHTML = '<div class="empty">Carregando relatório...</div>';

      try {
        const response = await fetch("/internal/reports/summary?days=14", { credentials: "same-origin" });
        if (!response.ok) throw new Error("Falha ao carregar relatório.");

        const data = await response.json();
        state.report = data;
        renderReport(data);
        elements.lastUpdated.textContent = "· atualizado " + formatTime(new Date());

        if (options.showFeedback) {
          setRefreshState("Atualizado", false);
          setTimeout(() => setRefreshState("Atualizar", false), 1200);
        }
      } catch (error) {
        elements.report.innerHTML = '<div class="error">' + escapeHtml(error.message) + '</div>';

        if (options.showFeedback) {
          setRefreshState("Erro", false);
          setTimeout(() => setRefreshState("Atualizar", false), 1600);
        }
      }
    }

    function renderReport(report) {
      const totals = report.totals || {};
      elements.metrics.innerHTML = [
        metric("Leads totais", totals.contacts ?? 0),
        metric("Novos em 14 dias", totals.newContacts ?? 0),
        metric("Follow-up", totals.followUp ?? 0),
        metric("Handoff", totals.handoff ?? 0),
      ].join("");

      elements.report.innerHTML = [
        '<div class="report-head">',
        '<div><h2>Relatório gerencial</h2><div class="muted">Resumo dos últimos ' + escapeHtml(report.period && report.period.days ? report.period.days : 14) + ' dias.</div></div>',
        '<span class="badge active">Operacional</span>',
        '</div>',
        '<div class="report-grid">',
        reportSection("Gargalos", renderBars(report.byGargalo || [])),
        reportSection("Classificação", renderBars(report.byClassification || [])),
        reportSection("Rotas", renderBars(report.byRoute || [])),
        reportSection("Leads por dia", renderBars((report.leadsByDay || []).map((item) => ({ key: formatDay(item.date), count: item.count })))),
        reportSection("Eventos comerciais", renderEventSummary(report.events || {})),
        reportSection("Últimos eventos", renderLatestEvents(report.latestEvents || []), "full"),
        '</div>',
      ].join("");
    }

    function reportSection(title, content, variant) {
      return '<div class="report-section ' + escapeHtml(variant || "") + '"><h3>' + escapeHtml(title) + '</h3>' + content + '</div>';
    }

    function renderBars(items) {
      if (!items.length) return '<div class="muted">Sem dados no período.</div>';

      const max = Math.max(...items.map((item) => Number(item.count) || 0), 1);
      return '<div class="bar-list">' + items.map((item) => {
        const count = Number(item.count) || 0;
        const width = Math.max(4, Math.round((count / max) * 100));

        return [
          '<div class="bar-row">',
          '<div class="bar-label">' + escapeHtml(item.key || "-") + '</div>',
          '<div class="bar-track"><span class="bar-fill" style="width: ' + width + '%"></span></div>',
          '<strong>' + count + '</strong>',
          '</div>',
        ].join("");
      }).join("") + '</div>';
    }

    function renderEventSummary(events) {
      const items = [
        { key: "Handoffs abertos", count: events.handoffs || 0 },
        { key: "Atendimentos iniciados", count: events.handoffsStarted || 0 },
        { key: "Handoffs resolvidos", count: events.handoffsResolved || 0 },
        { key: "Follow-ups agendados", count: events.followUpsScheduled || 0 },
        { key: "Follow-ups feitos", count: events.followUpsDone || 0 },
        { key: "Mensagens copiadas", count: events.messagesCopied || 0 },
        { key: "Mensagens enviadas", count: events.messagesSent || 0 },
        { key: "WhatsApp enviados", count: events.whatsAppSent || 0 },
        { key: "WhatsApp recebidos", count: events.whatsAppReceived || 0 },
        { key: "Intenções comerciais", count: events.whatsAppCommercialIntents || 0 },
        { key: "Falhas WhatsApp", count: events.whatsAppFailed || 0 },
        { key: "Contatos realizados", count: events.contactsDone || 0 },
        { key: "Contatos atualizados", count: events.contactUpdates || 0 },
      ];

      return renderBars(items);
    }

    function renderLatestEvents(events) {
      if (!events.length) return '<div class="muted">Sem eventos recentes.</div>';

      return '<div class="report-events">' + events.map((event) => {
        const contact = event.contact || {};
        const leadLabel = contact.name || contact.email || contact.phone || contact.id || "Lead sem identificação";
        const note = event.note ? '<div class="muted">' + escapeHtml(event.note) + '</div>' : "";

        return [
          '<div class="report-event">',
          '<div class="muted">' + formatDate(event.createdAt) + '</div>',
          '<div><strong>' + escapeHtml(event.eventType) + '</strong><div>' + escapeHtml(leadLabel) + '</div>' + note + '</div>',
          '</div>',
        ].join("");
      }).join("") + '</div>';
    }

    function getLeadsUrl() {
      if (state.view === "handoff") return "/internal/leads?handoff=true";
      if (state.view === "followup") return "/internal/leads?followup=true";

      return "/internal/leads";
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
      const latestFollowUp = getLatestFollowUpFromEvents(lead.eventLogs || []);
      const messageSuggestion = generateMessageSuggestion(lead, latestQuiz, latestRoute);
      const handoffSummary = renderHandoffSummary(lead, latestQuiz, latestScore, latestRoute);
      const tags = (lead.tags || []).map((tag) => '<span class="badge">' + escapeHtml(tag.key) + '</span>').join("");
      const events = (lead.eventLogs || []).slice(0, 8).map((event) => (
        '<div class="kv"><span>' + formatDate(event.createdAt) + '</span><strong>' + escapeHtml(event.eventType) + eventNote(event) + '</strong></div>'
      )).join("");

      elements.detail.innerHTML = [
        '<div class="detail-head"><h2>' + escapeHtml(lead.name || "Lead sem nome") + '</h2><div class="muted">' + escapeHtml(lead.email || "") + ' ' + escapeHtml(lead.phone || "") + '</div><div style="margin-top: 10px"><span class="badge ' + escapeHtml(lead.status || "") + '">' + escapeHtml(statusLabel(lead.status)) + '</span></div></div>',
        section("Contato", [
          '<label class="field-label" for="contactName">Nome</label>',
          '<input id="contactName" type="text" maxlength="160" autocomplete="name" value="' + escapeHtml(lead.name || "") + '">',
          '<label class="field-label" for="contactEmail">E-mail</label>',
          '<input id="contactEmail" type="email" maxlength="254" autocomplete="email" value="' + escapeHtml(lead.email || "") + '">',
          '<label class="field-label" for="contactPhone">WhatsApp</label>',
          '<input id="contactPhone" type="tel" maxlength="32" autocomplete="tel" inputmode="tel" placeholder="5511999999999" value="' + escapeHtml(lead.phone || "") + '">',
          '<button class="action-button primary" type="button" data-contact-save>Salvar contato</button>',
          '<div class="notice" id="contactState">Use DDI e DDD no WhatsApp antes de enviar mensagem.</div>',
        ].join("")),
        handoffSummary,
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
        section("Follow-up", [
          kv("Status", followUpStatusLabel(latestFollowUp)),
          kv("Próxima ação", latestFollowUp && latestFollowUp.dueAt ? formatDate(latestFollowUp.dueAt) : "-"),
          kv("Nota", latestFollowUp && latestFollowUp.note ? latestFollowUp.note : "-"),
        ].join("")),
        section("Mensagem", [
          '<textarea class="message-text" id="messageText">' + escapeHtml(messageSuggestion) + '</textarea>',
          '<div class="message-actions">',
          '<button class="action-button primary" type="button" data-message-action="copy">Copiar mensagem</button>',
          '<button class="action-button" type="button" data-message-action="sent">Registrar enviada</button>',
          '<button class="action-button primary" type="button" data-message-action="send">Enviar WhatsApp</button>',
          '</div>',
          '<div class="notice" id="messageState">Mensagem editável antes do envio.</div>',
        ].join("")),
        section("Ações", [
          '<textarea id="actionNote" maxlength="500" placeholder="Nota opcional para registrar no histórico"></textarea>',
          '<input id="followUpDueAt" type="datetime-local" aria-label="Data e hora do follow-up">',
          '<div class="actions-grid">',
          actionButton("marcar_para_contato", "Marcar para contato", "primary"),
          actionButton("contato_realizado", "Contato realizado", ""),
          actionButton("agendar_followup", "Agendar follow-up", "primary"),
          actionButton("followup_realizado", "Follow-up feito", ""),
          actionButton("handoff_humano", "Handoff humano", "primary"),
          actionButton("atendimento_iniciado", "Atendimento iniciado", "primary"),
          actionButton("resolver_handoff", "Resolver handoff", ""),
          actionButton("pausar", "Pausar lead", ""),
          actionButton("reativar", "Reativar", ""),
          actionButton("optout", "Opt-out", "danger"),
          '</div>',
          '<div class="notice" id="actionState">As ações ficam registradas no histórico do lead.</div>',
        ].join("")),
        section("Tags", '<div class="tag-list">' + (tags || '<span class="muted">Sem tags</span>') + '</div>'),
        section("Eventos", '<div class="stack">' + (events || '<span class="muted">Sem eventos</span>') + '</div>'),
      ].join("");

      for (const button of elements.detail.querySelectorAll("[data-action]")) {
        button.addEventListener("click", () => performLeadAction(lead.id, button.dataset.action));
      }

      for (const button of elements.detail.querySelectorAll("[data-message-action]")) {
        button.addEventListener("click", () => performMessageAction(lead.id, button.dataset.messageAction));
      }

      const contactSave = elements.detail.querySelector("[data-contact-save]");
      if (contactSave) {
        contactSave.addEventListener("click", () => saveLeadContact(lead.id));
      }
    }

    function actionButton(action, label, variant) {
      return '<button class="action-button ' + escapeHtml(variant) + '" type="button" data-action="' + escapeHtml(action) + '">' + escapeHtml(label) + '</button>';
    }

    async function performLeadAction(leadId, action) {
      const note = document.getElementById("actionNote");
      const dueAt = document.getElementById("followUpDueAt");
      const actionState = document.getElementById("actionState");
      const buttons = Array.from(elements.detail.querySelectorAll("[data-action]"));

      if (action === "agendar_followup" && (!dueAt || !dueAt.value)) {
        actionState.textContent = "Informe data e hora para agendar o follow-up.";
        return;
      }

      actionState.textContent = "Registrando ação...";
      buttons.forEach((button) => button.disabled = true);

      try {
        const response = await fetch("/internal/leads/" + encodeURIComponent(leadId) + "/actions", {
          method: "POST",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            action,
            note: note && note.value ? note.value : undefined,
            dueAt: dueAt && dueAt.value ? dueAt.value : undefined,
          }),
        });

        if (!response.ok) throw new Error("Falha ao registrar ação.");

        const data = await response.json();
        await loadLeads();
        state.selectedId = leadId;
        renderDetail(data.lead);
      } catch (error) {
        actionState.textContent = error.message;
        buttons.forEach((button) => button.disabled = false);
      }
    }

    async function saveLeadContact(leadId) {
      const name = document.getElementById("contactName");
      const email = document.getElementById("contactEmail");
      const phone = document.getElementById("contactPhone");
      const contactState = document.getElementById("contactState");
      const button = elements.detail.querySelector("[data-contact-save]");

      contactState.textContent = "Salvando contato...";
      if (button) button.disabled = true;

      try {
        const response = await fetch("/internal/leads/" + encodeURIComponent(leadId) + "/contact", {
          method: "PATCH",
          credentials: "same-origin",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: name ? name.value : "",
            email: email ? email.value : "",
            phone: phone ? phone.value : "",
          }),
        });

        if (!response.ok) throw new Error(await readActionError(response, "Falha ao salvar contato."));

        const data = await response.json();
        await loadLeads();
        state.selectedId = leadId;
        renderDetail(data.lead);

        const updatedContactState = document.getElementById("contactState");
        if (updatedContactState) updatedContactState.textContent = "Contato salvo.";
      } catch (error) {
        contactState.textContent = error.message;
        if (button) button.disabled = false;
      }
    }

    async function performMessageAction(leadId, action) {
      const message = document.getElementById("messageText");
      const messageState = document.getElementById("messageState");
      const buttons = Array.from(elements.detail.querySelectorAll("[data-message-action]"));
      const value = message && message.value ? message.value.trim() : "";

      if (!value) {
        messageState.textContent = "Mensagem vazia.";
        return;
      }

      buttons.forEach((button) => button.disabled = true);

      try {
        let successMessage = "Ação registrada.";
        messageState.textContent = "Validando mensagem...";
        await checkMessageGuardrail(value);

        if (action === "copy") {
          await copyToClipboard(value);
          await registerLeadAction(leadId, {
            action: "mensagem_copiada",
            note: "Mensagem copiada para WhatsApp",
            message: value,
          });
          successMessage = "Mensagem copiada.";
        } else if (action === "send") {
          await sendWhatsAppMessage(leadId, value);
          successMessage = "WhatsApp enviado.";
        } else {
          await registerLeadAction(leadId, {
            action: "mensagem_enviada",
            note: "Mensagem registrada como enviada",
            message: value,
          });
          successMessage = "Envio registrado.";
        }

        await selectLead(leadId);
        const updatedMessageState = document.getElementById("messageState");
        if (updatedMessageState) updatedMessageState.textContent = successMessage;
      } catch (error) {
        messageState.textContent = error.message;
      } finally {
        buttons.forEach((button) => button.disabled = false);
      }
    }

    async function sendWhatsAppMessage(leadId, message) {
      const response = await fetch("/internal/leads/" + encodeURIComponent(leadId) + "/messages/whatsapp", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error(await readActionError(response, "Falha ao enviar WhatsApp."));

      await loadLeads();

      return response.json();
    }

    async function checkMessageGuardrail(message) {
      const response = await fetch("/internal/messages/guardrail-check", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (!response.ok) throw new Error(await readActionError(response, "Mensagem bloqueada pelo guardrail."));

      return response.json();
    }

    async function registerLeadAction(leadId, body) {
      const response = await fetch("/internal/leads/" + encodeURIComponent(leadId) + "/actions", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) throw new Error(await readActionError(response, "Falha ao registrar ação."));

      await loadLeads();

      return response.json();
    }

    async function readActionError(response, fallback) {
      try {
        const data = await response.json();

        if (data.guardrail && data.guardrail.reason) {
          return "Mensagem bloqueada: " + data.guardrail.reason;
        }

        if (data.issues && data.issues.length) {
          return data.issues.map((issue) => issue.message).join(" ");
        }

        return data.message || data.error || fallback;
      } catch {
        return fallback;
      }
    }

    async function copyToClipboard(value) {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
        return;
      }

      const textarea = document.createElement("textarea");
      textarea.value = value;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
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

    function formatDay(value) {
      if (!value) return "-";
      return new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "2-digit",
      }).format(new Date(value + "T00:00:00"));
    }

    function formatTime(value) {
      return new Intl.DateTimeFormat("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }).format(value);
    }

    function setRefreshState(label, disabled) {
      elements.refresh.textContent = label;
      elements.refresh.disabled = disabled;
    }

    function statusLabel(status) {
      const labels = {
        active: "Ativo",
        paused: "Pausado",
        optout: "Opt-out",
      };

      return labels[status] || "Sem status";
    }

    function isLeadInHandoffQueue(lead) {
      const latestRoute = lead.latestRoute && lead.latestRoute.route;
      const classification = lead.latestScore && lead.latestScore.classification;

      if (latestRoute === "rota:atendimento-iniciado") return false;
      if (latestRoute === "rota:handoff-resolvido") return false;

      return latestRoute === "rota:chamar-humano" || classification === "prioridade";
    }

    function isLeadInFollowUpQueue(lead) {
      return lead.status !== "optout" && lead.latestFollowUp && lead.latestFollowUp.status === "pending";
    }

    function getLatestFollowUpFromEvents(events) {
      const event = events.find((item) => ["crm_followup_agendado", "crm_followup_realizado"].includes(item.eventType));
      if (!event) return null;

      const payload = event.payload || {};

      if (event.eventType === "crm_followup_realizado") {
        return {
          status: "done",
          dueAt: payload.dueAt,
          note: payload.note,
        };
      }

      return {
        status: "pending",
        dueAt: payload.dueAt,
        note: payload.note,
      };
    }

    function followUpStatusLabel(followUp) {
      if (!followUp) return "Sem follow-up";
      if (followUp.status === "done") return "Realizado";

      return "Pendente";
    }

    function renderHandoffSummary(lead, quiz, score, route) {
      const events = lead.eventLogs || [];
      const intentEvent = events.find((event) => event.eventType === "whatsapp_intencao_comercial_detectada");
      const inboundEvent = events.find((event) => event.eventType === "whatsapp_mensagem_recebida");
      const startedEvent = events.find((event) => event.eventType === "crm_atendimento_iniciado");
      const manualHandoffEvent = events.find((event) => event.eventType === "crm_handoff_humano");
      const isPriority = score && score.classification === "prioridade";
      const isHandoff = route && route.route === "rota:chamar-humano";
      const isInProgress = route && route.route === "rota:atendimento-iniciado";
      const isResolved = route && route.route === "rota:handoff-resolvido";

      if (!intentEvent && !manualHandoffEvent && !startedEvent && !isPriority && !isHandoff && !isInProgress) {
        return "";
      }

      const intent = payloadText(intentEvent, "intent");
      const latestMessage = payloadText(intentEvent, "message") || payloadText(inboundEvent, "message");
      const reason =
        payloadText(intentEvent, "note") ||
        payloadText(startedEvent, "note") ||
        payloadText(manualHandoffEvent, "note") ||
        (isPriority ? "Lead classificado como prioridade." : "") ||
        route.reason ||
        "Lead encaminhado para atendimento humano.";
      const scoreLabel = [
        score && score.score !== undefined ? score.score : "-",
        score && score.classification ? score.classification : "-",
      ].join(" · ");

      return section("Resumo para atendimento", [
        kv("Status", handoffStatusLabel(isInProgress, isResolved)),
        kv("Motivo", reason),
        kv("Intenção", intent ? intentLabel(intent) : "-"),
        kv("Última mensagem", latestMessage ? '"' + truncate(latestMessage, 160) + '"' : "-"),
        kv("Gargalo", quiz.gargalo || "-"),
        kv("Score", scoreLabel),
        kv("Rota", route.route || "-"),
        '<div class="notice">' + escapeHtml(getHandoffApproach(intent, quiz.gargalo)) + '</div>',
      ].join(""));
    }

    function handoffStatusLabel(isInProgress, isResolved) {
      if (isResolved) return "Resolvido";
      if (isInProgress) return "Em atendimento";

      return "Novo handoff";
    }

    function intentLabel(intent) {
      const labels = {
        preco: "Preço ou investimento",
        call: "Conversa ou agendamento",
        compra: "Compra ou contratação",
        interesse: "Interesse comercial",
      };

      return labels[intent] || intent;
    }

    function getHandoffApproach(intent, gargalo) {
      const context = gargaloContext(gargalo || "diagnostico");
      const intentLine = {
        preco: "Reconheça o pedido de valor e entenda o contexto antes de falar de oferta.",
        call: "Confirme disponibilidade e conduza para uma conversa objetiva.",
        compra: "Valide encaixe e próximos passos antes de orientar pagamento ou contratação.",
        interesse: "Aprofunde a necessidade e conecte a conversa ao diagnóstico.",
      }[intent] || "Retome a conversa pelo contexto do diagnóstico.";

      return intentLine + " Evite promessa de resultado. Use como gancho: " + context + ".";
    }

    function generateMessageSuggestion(lead, quiz, route) {
      const name = firstName(lead.name);
      const gargalo = quiz.gargalo || "diagnostico";
      const context = gargaloContext(gargalo);
      const routeLine = route && route.route === "rota:chamar-humano"
        ? "Como esse caso pede atenção humana, eu vou olhar com mais cuidado antes de te orientar."
        : "O próximo passo é revisar essa parte com calma antes de mexer em outros pontos do funil.";

      return [
        "Oi, " + name + ". Vi seu diagnóstico do Raio X.",
        "",
        "O ponto que apareceu com mais força foi " + context + ".",
        routeLine,
        "",
        "Faz sentido para você hoje?",
      ].join("\\n");
    }

    function firstName(name) {
      const value = String(name || "").trim();
      if (!value) return "tudo bem";

      return value.split(/\\s+/)[0];
    }

    function gargaloContext(gargalo) {
      const contexts = {
        promessa: "a promessa, principalmente clareza de desejo, crença e mecanismo",
        criativo: "os criativos, principalmente hook, ângulo e variação",
        vsl: "a VSL, principalmente retenção, mecanismo e pitch",
        pagina: "a página, principalmente continuidade, clareza e chamada para ação",
        oferta: "a oferta, principalmente empacotamento, valor percebido e ancoragem",
        checkout: "o checkout, principalmente decisão de compra, pagamento e próximos passos",
        followup: "o follow-up, principalmente leads que entram e esfriam",
        politica: "a qualidade percebida, principalmente linguagem sensível e confiança",
        diagnostico: "o diagnóstico, principalmente clareza sobre onde está o gargalo",
      };

      return contexts[gargalo] || "o diagnóstico comercial";
    }

    function eventNote(event) {
      const note = event && event.payload && event.payload.note;
      const dueAt = event && event.payload && event.payload.dueAt;
      const message = event && event.payload && event.payload.message;
      const items = [];

      if (note) items.push(escapeHtml(note));
      if (dueAt) items.push("Follow-up: " + escapeHtml(formatDate(dueAt)));
      if (message) items.push("Mensagem: " + escapeHtml(truncate(message, 120)));

      return items.length ? '<div class="muted">' + items.join("<br>") + '</div>' : "";
    }

    function payloadText(event, key) {
      const value = event && event.payload && event.payload[key];

      return typeof value === "string" && value.trim() ? value.trim() : "";
    }

    function truncate(value, maxLength) {
      const text = String(value || "");
      return text.length > maxLength ? text.slice(0, maxLength - 1) + "..." : text;
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
