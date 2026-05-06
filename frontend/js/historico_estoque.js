document.addEventListener("DOMContentLoaded", async () => {
    await loadHistory();

    // Busca
    document.querySelector(".search-input").addEventListener("input", () => {
        currentPage = 1;
        applyFiltersAndRender();
    });

    // Ordenação
    document.getElementById("filterSort").addEventListener("change", () => {
        currentPage = 1;
        applyFiltersAndRender();
    });

    // Filtro por categoria
    document.getElementById("filterCategory").addEventListener("change", () => {
        currentPage = 1;
        applyFiltersAndRender();
    });

    // Qtd por página
    document.getElementById("itemsPerPageSelect").addEventListener("change", (e) => {
        ITEMS_PER_PAGE = parseInt(e.target.value);
        currentPage = 1;
        applyFiltersAndRender();
    });
});

// ─── Estado global ────────────────────────────────────────
let allHistory = [];
let currentPage = 1;
let ITEMS_PER_PAGE = 10;
// ─────────────────────────────────────────────────────────

function normalizar(texto) {
    return texto
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function applyFiltersAndRender() {
    const termoBusca = normalizar(document.querySelector(".search-input").value);
    const sortValue = document.getElementById("filterSort").value;
    const categoryValue = document.getElementById("filterCategory").value;

    let filtered = allHistory.filter(item => {
        const nome = normalizar(item.productName);
        const categoria = normalizar(item.productCategory);
        const matchBusca = nome.includes(termoBusca) || categoria.includes(termoBusca);
        const matchCategoria = categoryValue === "" || item.productCategory === categoryValue;
        return matchBusca && matchCategoria;
    });

    if (sortValue === "data_desc") filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    if (sortValue === "data_asc")  filtered.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    if (sortValue === "qtd_desc")  filtered.sort((a, b) => b.quantity - a.quantity);
    if (sortValue === "qtd_asc")   filtered.sort((a, b) => a.quantity - b.quantity);

    renderTable(filtered);
}

function buildCategoryOptions() {
    const select = document.getElementById("filterCategory");
    const categorias = [...new Set(allHistory.map(p => p.productCategory))].sort();
    select.innerHTML = `<option value="">Todas as categorias</option>`;
    categorias.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function renderTable(items) {
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = items.slice(start, start + ITEMS_PER_PAGE);

    if (paginated.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 32px; color: #94a3b8; font-size: 14px;">
                    Nenhum registro encontrado.
                </td>
            </tr>
        `;
    } else {
        paginated.forEach(item => {
            const tr = document.createElement("tr");

            const productName = item.productName;
            const category    = item.productCategory;
            const employee    = item.createdBy;
            const quantity    = item.quantity;
            const uom         = item.unitOfMeasure;
            const createdAt   = formatarDataISO(item.createdAt);
            const expiration  = formatarSomenteData(item.expirationDate);

            tr.innerHTML = `
                <td>
                    <div class="product-cell">
                        <img src="../assets/categorias_dos_produtos_sched/${category}.png" onerror="this.src='../assets/file.png'">
                        <span>${productName}</span>
                    </div>
                </td>
                <td>${employee}</td>
                <td class="qty-bold">${quantity} <small>${uom}</small></td>
                <td>${createdAt}</td>
                <td>${expiration}</td>
            `;
            tbody.appendChild(tr);
        });
    }

    renderPagination(items);
}

function renderPagination(items) {
    const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);

    let pagination = document.getElementById("pagination");
    if (!pagination) {
        pagination = document.createElement("div");
        pagination.id = "pagination";
        document.getElementById("historyTableBody").closest("table").after(pagination);
    }

    if (totalPages <= 1) {
        pagination.innerHTML = "";
        return;
    }

    const delta = 2;
    const range = [];
    for (let i = Math.max(1, currentPage - delta); i <= Math.min(totalPages, currentPage + delta); i++) {
        range.push(i);
    }

    const firstBtn  = range[0] > 1
        ? `<button class="page-btn" data-page="1">1</button><span class="page-dots">...</span>`
        : "";
    const lastBtn   = range[range.length - 1] < totalPages
        ? `<span class="page-dots">...</span><button class="page-btn" data-page="${totalPages}">${totalPages}</button>`
        : "";
    const pageButtons = range.map(p =>
        `<button class="page-btn ${p === currentPage ? "page-btn-active" : ""}" data-page="${p}">${p}</button>`
    ).join("");

    const inicio = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, items.length);
    const fim    = Math.min(currentPage * ITEMS_PER_PAGE, items.length);

    pagination.innerHTML = `
        <div class="pagination-info">
            Mostrando ${inicio}–${fim} de ${items.length} registros
        </div>
        <div class="pagination-controls">
            <button class="page-btn" id="btnPrev" ${currentPage === 1 ? "disabled" : ""}>←</button>
            ${firstBtn}
            ${pageButtons}
            ${lastBtn}
            <button class="page-btn" id="btnNext" ${currentPage === totalPages ? "disabled" : ""}>→</button>
        </div>
    `;

    pagination.querySelectorAll(".page-btn[data-page]").forEach(btn => {
        btn.addEventListener("click", () => {
            currentPage = parseInt(btn.dataset.page);
            renderTable(items);
        });
    });

    document.getElementById("btnPrev")?.addEventListener("click", () => {
        if (currentPage > 1) { currentPage--; renderTable(items); }
    });
    document.getElementById("btnNext")?.addEventListener("click", () => {
        if (currentPage < totalPages) { currentPage++; renderTable(items); }
    });
}

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
            currentPage = 1;
            buildCategoryOptions();
            applyFiltersAndRender();
            updateStats(allHistory.length);
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar o histórico de estoque.');
    }
}

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

function updateStats(total) {
    const statsText = document.querySelector(".bold-stats");
    if (statsText) statsText.innerText = `${total} lotes estocados`;
}