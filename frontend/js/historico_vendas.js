document.addEventListener("DOMContentLoaded", async () => {
    await loadHistorySale();

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
let allHistorySale = [];
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

    let filtered = allHistorySale.filter(item => {
        const nome = normalizar(item.productName || "");
        const categoria = normalizar(item.productCategory || "");
        const matchBusca = nome.includes(termoBusca) || categoria.includes(termoBusca);
        const matchCategoria = categoryValue === "" || item.productCategory === categoryValue;
        return matchBusca && matchCategoria;
    });

    if (sortValue === "data_desc") filtered.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
    if (sortValue === "data_asc")  filtered.sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate));
    if (sortValue === "qtd_desc")  filtered.sort((a, b) => b.totalSold - a.totalSold);
    if (sortValue === "qtd_asc")   filtered.sort((a, b) => a.totalSold - b.totalSold);
    if (sortValue === "valor_desc") filtered.sort((a, b) => b.totalPrice - a.totalPrice);
    if (sortValue === "valor_asc")  filtered.sort((a, b) => a.totalPrice - b.totalPrice);

    renderTable(filtered);
}

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
    temp.style.cssText = "font-size:13px; font-family:Inter,sans-serif; visibility:hidden; position:absolute; white-space:nowrap;";
    temp.textContent = opcaoSelecionada;
    document.body.appendChild(temp);
    select.style.width = (temp.offsetWidth + 52) + "px";
    document.body.removeChild(temp);
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

            const precoFormatado = Number(item.totalPrice || 0).toLocaleString('pt-BR', {
                style: 'currency',
                currency: 'BRL'
            });

            tr.innerHTML = `
                <td>
                    <div class="product-cell">
                        <img src="../assets/categorias_dos_produtos_sched/${item.productCategory}.png" onerror="this.src='../assets/file.png'">
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

async function loadHistorySale() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/sale", {
            headers: { "Authorization": "Bearer " + token }
        });
        const historySale = await response.json();

        if (response.ok) {
            allHistorySale = historySale.reverse();
            currentPage = 1;
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

function formatarSomenteData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

function updateWeekSalesInfo() {
    const total = getWeekSalesQuantity();
    document.getElementById("weekSalesText").textContent = `${total} vendas registradas`;
}

function getWeekSalesQuantity() {
    const hoje = new Date();
    const diaSemana = hoje.getDay();
    const diff = diaSemana === 0 ? 6 : diaSemana - 1;

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diff);
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 7);

    return allHistorySale.filter(item => {
        const dataVenda = new Date(item.saleDate);
        return dataVenda >= inicioSemana && dataVenda < fimSemana;
    }).length;
}