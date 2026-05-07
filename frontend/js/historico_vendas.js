document.addEventListener("DOMContentLoaded", async () => {
    await loadHistorySale();

    document.querySelector(".search-input").addEventListener("input", () => {
        currentMonthIndex = 0;
        applyFiltersAndRender();
    });

    document.getElementById("filterSort").addEventListener("change", () => {
        currentMonthIndex = 0;
        applyFiltersAndRender();
    });

    document.getElementById("filterCategory").addEventListener("change", () => {
        currentMonthIndex = 0;
        applyFiltersAndRender();
    });
});

// ─── Estado global ────────────────────────────────────────
let allHistorySale  = [];
let currentMonthIndex = 0;
let monthGroups     = [];
let chartInstance   = null;
// ─────────────────────────────────────────────────────────

function normalizar(texto) {
    return texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

// ─── Agrupa vendas por mês/ano ────────────────────────────
function buildMonthGroups(items) {
    const map = new Map();
    items.forEach(item => {
        const date  = new Date(item.saleDate);
        const year  = date.getFullYear();
        const month = date.getMonth();
        const key   = `${year}-${String(month).padStart(2, '0')}`;
        if (!map.has(key)) map.set(key, { year, month, items: [] });
        map.get(key).items.push(item);
    });
    return Array.from(map.entries())
        .sort((a, b) => b[0].localeCompare(a[0]))
        .map(([, v]) => v);
}

// ─── Rótulo amigável do mês ───────────────────────────────
const MESES_PT = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho',
    'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function monthLabel(year, month) {
    const hoje    = new Date();
    const mesHoje = hoje.getMonth();
    const anoHoje = hoje.getFullYear();
    const nomeMes = MESES_PT[month];

    if (year === anoHoje && month === mesHoje) return `Este Mês (${nomeMes})`;

    const mesPassado = new Date(anoHoje, mesHoje - 1);
    if (year === mesPassado.getFullYear() && month === mesPassado.getMonth())
        return `Mês Passado (${nomeMes})`;

    return year === anoHoje ? nomeMes : `${nomeMes} de ${year}`;
}

// ─── Aplica filtros e re-renderiza tudo ───────────────────
function applyFiltersAndRender() {
    const termoBusca    = normalizar(document.querySelector(".search-input").value);
    const sortValue     = document.getElementById("filterSort").value;
    const categoryValue = document.getElementById("filterCategory").value;

    let filtered = allHistorySale.filter(item => {
        const nome       = normalizar(item.productName || "");
        const categoria  = normalizar(item.productCategory || "");
        const matchBusca     = nome.includes(termoBusca) || categoria.includes(termoBusca);
        const matchCategoria = categoryValue === "" || item.productCategory === categoryValue;
        return matchBusca && matchCategoria;
    });

    monthGroups = buildMonthGroups(filtered);
    if (currentMonthIndex >= monthGroups.length) currentMonthIndex = 0;

    if (monthGroups.length === 0) {
        renderEmptyState();
        renderMonthPagination();
        renderMonthSummary([]);
        return;
    }

    let monthItems = [...monthGroups[currentMonthIndex].items];

    if (sortValue === "data_desc")  monthItems.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    if (sortValue === "data_asc")   monthItems.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));
    if (sortValue === "qtd_desc")   monthItems.sort((a, b) => b.totalSold - a.totalSold);
    if (sortValue === "qtd_asc")    monthItems.sort((a, b) => a.totalSold - b.totalSold);
    if (sortValue === "valor_desc") monthItems.sort((a, b) => b.totalPrice - a.totalPrice);
    if (sortValue === "valor_asc")  monthItems.sort((a, b) => a.totalPrice - b.totalPrice);
    if (!sortValue) monthItems.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));

    renderTable(monthItems);
    renderMonthPagination();
    renderMonthSummary(monthItems);
}

// ─── Cabeçalho do card ────────────────────────────────────
function updateCardHeader() {
    const h2 = document.querySelector(".history-header-info h2");
    if (!monthGroups.length) { h2.textContent = "Histórico de Vendas"; return; }
    const { year, month } = monthGroups[currentMonthIndex];
    h2.textContent = monthLabel(year, month);
}

// ─── Tabela ───────────────────────────────────────────────
function renderTable(items) {
    updateCardHeader();
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    if (items.length === 0) { renderEmptyState(); return; }

    items.forEach(item => {
        const tr = document.createElement("tr");
        const precoFormatado = Number(item.totalPrice || 0).toLocaleString('pt-BR', {
            style: 'currency', currency: 'BRL'
        });
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="../assets/categorias_dos_produtos_sched/${item.productCategory}.png"
                         onerror="this.src='../assets/file.png'">
                    <span>${item.productName}</span>
                </div>
            </td>
            <td>${item.soldBy}</td>
            <td>${item.totalSold}</td>
            <td class="price-cell-bold">${precoFormatado}</td>
            <td>${formatarSomenteData(item.saleDate)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEmptyState() {
    updateCardHeader();
    document.getElementById("historyTableBody").innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center;padding:32px;color:#94a3b8;font-size:14px;">
                Nenhum registro encontrado.
            </td>
        </tr>`;
}

// ─── Paginação por mês ────────────────────────────────────
function renderMonthPagination() {
    const totalMonths = monthGroups.length;

    let pagination = document.getElementById("pagination");
    if (!pagination) {
        pagination = document.createElement("div");
        pagination.id = "pagination";
        document.querySelector(".history-card").prepend(pagination);
    }

    if (totalMonths <= 1) { pagination.innerHTML = ""; return; }

    const delta = 2;
    const range = [];
    for (let i = Math.max(0, currentMonthIndex - delta); i <= Math.min(totalMonths - 1, currentMonthIndex + delta); i++) {
        range.push(i);
    }

    const firstBtn = range[0] > 0
        ? `<button class="page-btn" data-idx="0">1</button><span class="page-dots">...</span>` : "";
    const lastBtn  = range[range.length - 1] < totalMonths - 1
        ? `<span class="page-dots">...</span><button class="page-btn" data-idx="${totalMonths - 1}">${totalMonths}</button>` : "";

    const pageButtons = range.map(i => {
        const { year, month } = monthGroups[i];
        const label = `${MESES_PT[month].substring(0, 3)}/${String(year).slice(-2)}`;
        return `<button class="page-btn month-btn ${i === currentMonthIndex ? "page-btn-active" : ""}"
                        data-idx="${i}" title="${monthLabel(year, month)}">${label}</button>`;
    }).join("");

    const { year, month } = monthGroups[currentMonthIndex];
    const totalItens = monthGroups[currentMonthIndex].items.length;

    pagination.innerHTML = `
        <div class="pagination-info">
            ${monthLabel(year, month)} — ${totalItens} ${totalItens === 1 ? 'registro' : 'registros'}
        </div>
        <div class="pagination-controls">
            <button class="page-btn" id="btnPrev" ${currentMonthIndex === 0 ? "disabled" : ""}>←</button>
            ${firstBtn}${pageButtons}${lastBtn}
            <button class="page-btn" id="btnNext" ${currentMonthIndex === totalMonths - 1 ? "disabled" : ""}>→</button>
        </div>`;

    pagination.querySelectorAll(".page-btn[data-idx]").forEach(btn => {
        btn.addEventListener("click", () => {
            currentMonthIndex = parseInt(btn.dataset.idx);
            applyFiltersAndRender();
        });
    });
    document.getElementById("btnPrev")?.addEventListener("click", () => {
        if (currentMonthIndex > 0) { currentMonthIndex--; applyFiltersAndRender(); }
    });
    document.getElementById("btnNext")?.addEventListener("click", () => {
        if (currentMonthIndex < totalMonths - 1) { currentMonthIndex++; applyFiltersAndRender(); }
    });
}

// ─── Resumo do mês + gráfico ──────────────────────────────
function renderMonthSummary(items) {
    let summary = document.getElementById("monthSummary");
    if (!summary) {
        summary = document.createElement("div");
        summary.id = "monthSummary";
        document.querySelector(".history-card").after(summary);
    }

    if (!items.length) { summary.innerHTML = ""; return; }

    // ── Métricas ─────────────────────────────────────────
    const totalVendas   = items.length;
    const totalReceita  = items.reduce((s, i) => s + Number(i.totalPrice || 0), 0);
    const totalUnidades = items.reduce((s, i) => s + Number(i.totalSold   || 0), 0);
    const ticketMedio   = totalVendas > 0 ? totalReceita / totalVendas : 0;

    const receitaFmt = totalReceita.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const ticketFmt  = ticketMedio.toLocaleString('pt-BR',  { style: 'currency', currency: 'BRL' });

    // ── Dados do gráfico: vendas por dia ─────────────────
    const byDay = {};
    items.forEach(item => {
        const dia = new Date(item.saleDate).getDate();
        byDay[dia] = (byDay[dia] || 0) + 1;
    });

    const { year, month } = monthGroups[currentMonthIndex];
    const diasNoMes = new Date(year, month + 1, 0).getDate();
    const labels    = Array.from({ length: diasNoMes }, (_, i) => i + 1);
    const dataChart = labels.map(d => byDay[d] || 0);

    // ── HTML ─────────────────────────────────────────────
    summary.innerHTML = `
        <div class="summary-cards">
            <div class="summary-card">
                <div class="summary-card-icon" style="background:#EFF6FF;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#499BFF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
                </div>
                <div class="summary-card-info">
                    <span class="summary-card-label">Vendas no mês</span>
                    <span class="summary-card-value">${totalVendas}</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-card-icon" style="background:#F0FDF4;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
                </div>
                <div class="summary-card-info">
                    <span class="summary-card-label">Receita total</span>
                    <span class="summary-card-value">${receitaFmt}</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-card-icon" style="background:#FFF7ED;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f97316" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 0 1-8 0"/></svg>
                </div>
                <div class="summary-card-info">
                    <span class="summary-card-label">Unidades vendidas</span>
                    <span class="summary-card-value">${totalUnidades}</span>
                </div>
            </div>
            <div class="summary-card">
                <div class="summary-card-icon" style="background:#FDF4FF;">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#a855f7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                </div>
                <div class="summary-card-info">
                    <span class="summary-card-label">Ticket médio</span>
                    <span class="summary-card-value">${ticketFmt}</span>
                </div>
            </div>
        </div>

        <div class="summary-chart-card">
            <div class="summary-chart-header">
                <h3>Vendas por dia — <span class="chart-month-label">${monthLabel(year, month)}</span></h3>
            </div>
            <div class="summary-chart-wrapper">
                <canvas id="salesChart"></canvas>
            </div>
        </div>
    `;

    // ── Chart.js ─────────────────────────────────────────
    if (chartInstance) { chartInstance.destroy(); chartInstance = null; }

    const ctx  = document.getElementById("salesChart").getContext("2d");
    const grad = ctx.createLinearGradient(0, 0, 0, 220);
    grad.addColorStop(0, "rgba(73,155,255,0.25)");
    grad.addColorStop(1, "rgba(73,155,255,0)");

    chartInstance = new Chart(ctx, {
        type: "line",
        data: {
            labels,
            datasets: [{
                label: "Vendas",
                data: dataChart,
                borderColor: "#499BFF",
                borderWidth: 2.5,
                pointBackgroundColor: "#499BFF",
                pointRadius: 3,
                pointHoverRadius: 6,
                fill: true,
                backgroundColor: grad,
                tension: 0.4,
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: { mode: "index", intersect: false },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: "#1e293b",
                    titleColor: "#94a3b8",
                    bodyColor: "#f1f5f9",
                    padding: 10,
                    callbacks: {
                        title: ctx => `Dia ${ctx[0].label}`,
                        label: ctx => ` ${ctx.raw} venda${ctx.raw !== 1 ? 's' : ''}`,
                    }
                }
            },
            scales: {
                x: {
                    grid: { display: false },
                    ticks: { color: "#94a3b8", font: { size: 11 }, maxTicksLimit: 15 }
                },
                y: {
                    beginAtZero: true,
                    grid: { color: "#f1f5f9" },
                    ticks: { color: "#94a3b8", font: { size: 11 }, stepSize: 1, precision: 0 }
                }
            }
        }
    });
}

// ─── Popula categorias no select ─────────────────────────
function buildCategoryOptions() {
    const select = document.getElementById("filterCategory");
    const categorias = [...new Set(allHistorySale.map(p => p.productCategory))].sort();
    select.innerHTML = `<option value="">Todas as categorias</option>`;
    categorias.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function ajustarLarguraSelect(select) {
    const opcaoSelecionada = select.options[select.selectedIndex].text;
    const temp = document.createElement("span");
    temp.style.cssText = "font-size:13px;font-family:Inter,sans-serif;visibility:hidden;position:absolute;white-space:nowrap;";
    temp.textContent = opcaoSelecionada;
    document.body.appendChild(temp);
    select.style.width = (temp.offsetWidth + 52) + "px";
    document.body.removeChild(temp);
}

// ─── Carrega dados da API ─────────────────────────────────
async function loadHistorySale() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/sale", {
            headers: { "Authorization": "Bearer " + token }
        });
        const historySale = await response.json();

        if (response.ok) {
            allHistorySale = historySale;
            currentMonthIndex = 0;
            buildCategoryOptions();
            applyFiltersAndRender();
            updateWeekSalesInfo();

            document.querySelectorAll(".filters-bar select").forEach(select => {
                ajustarLarguraSelect(select);
                select.addEventListener("change", () => ajustarLarguraSelect(select));
            });
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar o histórico de vendas.');
    }
}

// ─── Utilitários ──────────────────────────────────────────
function formatarSomenteData(dataISO) {
    return new Date(dataISO).toLocaleDateString('pt-BR');
}

function updateWeekSalesInfo() {
    const total = getWeekSalesQuantity();
    document.getElementById("weekSalesText").textContent = `${total} vendas registradas`;
}

function getWeekSalesQuantity() {
    const hoje = new Date();
    const diff = hoje.getDay() === 0 ? 6 : hoje.getDay() - 1;
    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diff);
    inicioSemana.setHours(0, 0, 0, 0);
    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 7);

    return allHistorySale.filter(item => {
        const d = new Date(item.saleDate);
        return d >= inicioSemana && d < fimSemana;
    }).length;
}