document.addEventListener("DOMContentLoaded", async () => {
    await loadHistory();

    // Busca
    document.querySelector(".search-input").addEventListener("input", () => {
        currentMonthIndex = 0;
        applyFiltersAndRender();
    });

    // Ordenação
    document.getElementById("filterSort").addEventListener("change", () => {
        currentMonthIndex = 0;
        applyFiltersAndRender();
    });

    // Filtro por categoria
    document.getElementById("filterCategory").addEventListener("change", () => {
        currentMonthIndex = 0;
        applyFiltersAndRender();
    });
});

// ─── Estado global ────────────────────────────────────────
let allHistory = [];
let currentMonthIndex = 0;
let monthGroups = [];
// ─────────────────────────────────────────────────────────

function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

// ─── Agrupa estocagens por mês/ano ────────────────────────
function buildMonthGroups(items) {
    const map = new Map();

    items.forEach(item => {
        const date  = new Date(item.createdAt);
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
const MESES_PT = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

function monthLabel(year, month) {
    const hoje    = new Date();
    const mesHoje = hoje.getMonth();
    const anoHoje = hoje.getFullYear();
    const nomeMes = MESES_PT[month];

    if (year === anoHoje && month === mesHoje)
        return `Este Mês (${nomeMes})`;

    const mesPassado = new Date(anoHoje, mesHoje - 1);
    if (year === mesPassado.getFullYear() && month === mesPassado.getMonth())
        return `Mês Passado (${nomeMes})`;

    return year === anoHoje ? nomeMes : `${nomeMes} de ${year}`;
}

// ─── Aplica filtros e re-renderiza ────────────────────────
function applyFiltersAndRender() {
    const termoBusca    = normalizar(document.querySelector(".search-input").value);
    const sortValue     = document.getElementById("filterSort").value;
    const categoryValue = document.getElementById("filterCategory").value;

    let filtered = allHistory.filter(item => {
        const nome      = normalizar(item.productName || "");
        const categoria = normalizar(item.productCategory || "");
        const matchBusca    = nome.includes(termoBusca) || categoria.includes(termoBusca);
        const matchCategoria= categoryValue === "" || item.productCategory === categoryValue;
        return matchBusca && matchCategoria;
    });

    monthGroups = buildMonthGroups(filtered);

    if (currentMonthIndex >= monthGroups.length) currentMonthIndex = 0;

    if (monthGroups.length === 0) {
        renderEmptyState();
        renderMonthPagination();
        return;
    }

    let monthItems = [...monthGroups[currentMonthIndex].items];

    if (sortValue === "data_desc") monthItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortValue === "data_asc")  monthItems.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortValue === "qtd_desc")  monthItems.sort((a, b) => b.quantity - a.quantity);
    if (sortValue === "qtd_asc")   monthItems.sort((a, b) => a.quantity - b.quantity);

    if (!sortValue) monthItems.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    renderTable(monthItems);
    renderMonthPagination();
}

// ─── Atualiza o título do card ────────────────────────────
function updateCardHeader() {
    const h2 = document.querySelector(".history-header-info h2");
    if (!monthGroups.length) {
        h2.textContent = "Histórico de Estocagem";
        return;
    }
    const { year, month } = monthGroups[currentMonthIndex];
    h2.textContent = monthLabel(year, month);
}

// ─── Renderiza a tabela ───────────────────────────────────
function renderTable(items) {
    updateCardHeader();

    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    if (items.length === 0) {
        renderEmptyState();
        return;
    }

    items.forEach(item => {
        const tr = document.createElement("tr");

        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="../assets/categorias_dos_produtos_sched/${item.productCategory}.png"
                         onerror="this.src='../assets/file.png'">
                    <span>${item.productName}</span>
                </div>
            </td>
            <td>${item.createdBy}</td>
            <td class="qty-bold">${item.quantity} <small>${item.unitOfMeasure}</small></td>
            <td>${formatarDataISO(item.createdAt)}</td>
            <td>${formatarSomenteData(item.expirationDate)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function renderEmptyState() {
    updateCardHeader();
    document.getElementById("historyTableBody").innerHTML = `
        <tr>
            <td colspan="5" style="text-align:center; padding: 32px; color: #94a3b8; font-size: 14px;">
                Nenhum registro encontrado.
            </td>
        </tr>
    `;
}

// ─── Paginação por mês ────────────────────────────────────
function renderMonthPagination() {
    const totalMonths = monthGroups.length;

    let pagination = document.getElementById("pagination");
    if (!pagination) {
        pagination = document.createElement("div");
        pagination.id = "pagination";
        document.getElementById("historyTableBody").closest("table").after(pagination);
    }

    if (totalMonths <= 1) {
        pagination.innerHTML = "";
        return;
    }

    const delta = 2;
    const range = [];
    for (let i = Math.max(0, currentMonthIndex - delta); i <= Math.min(totalMonths - 1, currentMonthIndex + delta); i++) {
        range.push(i);
    }

    const firstBtn = range[0] > 0
        ? `<button class="page-btn" data-idx="0">1</button><span class="page-dots">...</span>`
        : "";
    const lastBtn  = range[range.length - 1] < totalMonths - 1
        ? `<span class="page-dots">...</span><button class="page-btn" data-idx="${totalMonths - 1}">${totalMonths}</button>`
        : "";

    const pageButtons = range.map(i => {
        const { year, month } = monthGroups[i];
        const nomeMes = MESES_PT[month].substring(0, 3);
        const label   = `${nomeMes}/${String(year).slice(-2)}`;
        return `<button class="page-btn month-btn ${i === currentMonthIndex ? "page-btn-active" : ""}"
                        data-idx="${i}"
                        title="${monthLabel(year, month)}">${label}</button>`;
    }).join("");

    const { year, month } = monthGroups[currentMonthIndex];
    const totalItens = monthGroups[currentMonthIndex].items.length;

    pagination.innerHTML = `
        <div class="pagination-info">
            ${monthLabel(year, month)} — ${totalItens} ${totalItens === 1 ? 'registro' : 'registros'}
        </div>
        <div class="pagination-controls">
            <button class="page-btn" id="btnPrev" ${currentMonthIndex === 0 ? "disabled" : ""}>←</button>
            ${firstBtn}
            ${pageButtons}
            ${lastBtn}
            <button class="page-btn" id="btnNext" ${currentMonthIndex === totalMonths - 1 ? "disabled" : ""}>→</button>
        </div>
    `;

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

// ─── Popula categorias no select ─────────────────────────
function buildCategoryOptions() {
    const select = document.getElementById("filterCategory");
    const categorias = [...new Set(allHistory.map(p => p.productCategory))].sort();
    select.innerHTML = `<option value="">Todas as categorias</option>`;
    categorias.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function ajustarLarguraSelect(select) {
    const opcaoSelecionada = select.options[select.selectedIndex].text;
    const temp = document.createElement("span");
    temp.style.cssText = "font-size:13px; font-family:Inter,sans-serif; visibility:hidden; position:absolute; white-space:nowrap;";
    temp.textContent = opcaoSelecionada;
    document.body.appendChild(temp);
    select.style.width = (temp.offsetWidth + 52) + "px";
    document.body.removeChild(temp);
}

// ─── Carrega dados da API ─────────────────────────────────
async function loadHistory() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/stock", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" }
        });
        const data = await response.json();

        if (response.ok) {
            allHistory = data.filter(item => item.quantity > 0);
            currentMonthIndex = 0;
            buildCategoryOptions();
            applyFiltersAndRender();
            updateStats();

            document.querySelectorAll(".filters-bar select").forEach(select => {
                ajustarLarguraSelect(select);
                select.addEventListener("change", () => ajustarLarguraSelect(select));
            });
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar o histórico de estoque.');
    }
}

// ─── Utilitários ──────────────────────────────────────────
function formatarDataISO(dataISO) {
    if (!dataISO || dataISO.startsWith("1970")) return '--/--/--';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarSomenteData(dataISO) {
    if (!dataISO || dataISO.startsWith("1970")) return '--/--/--';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

function updateStats() {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diff = diaSemana === 0 ? 6 : diaSemana - 1;

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diff);
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 7);

    const totalSemana = allHistory.filter(item => {
        const d = new Date(item.createdAt);
        return d >= inicioSemana && d < fimSemana;
    }).length;

    const statsText = document.querySelector(".bold-stats");
    if (statsText) statsText.innerText = `${totalSemana} lotes estocados`;
}