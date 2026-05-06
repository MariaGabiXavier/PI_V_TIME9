document.addEventListener("DOMContentLoaded", async () => {
    await loadStockProducts();

    const btnHistory = document.querySelector(".btn-history");
    if (btnHistory) {
        btnHistory.addEventListener("click", () => {
            window.location.href = "historico_estoque.html";
        });
    }

    document.querySelectorAll(".close-modal").forEach(button => {
        button.onclick = () => {
            document.getElementById("stockModal").style.display = "none";
        };
    });

    document.getElementById("stockForm").addEventListener("submit", async (e) => {
        e.preventDefault();
        const productId = e.target.dataset.productId;
        const quantity = document.getElementById("stockQuantity").value;
        const expirationDate = document.getElementById("stockExpiry").value;
        await registerStockEntry(productId, quantity, expirationDate);
    });

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
let allStock = [];
let currentPage = 1;
let ITEMS_PER_PAGE = 12; // múltiplo de 6 pra não quebrar o grid
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

    let filtered = allStock.filter(produto => {
        const nome = normalizar(produto.productName);
        const categoria = normalizar(produto.productCategory);
        const matchBusca = nome.includes(termoBusca) || categoria.includes(termoBusca);
        const matchCategoria = categoryValue === "" || produto.productCategory === categoryValue;
        return matchBusca && matchCategoria;
    });

    if (sortValue === "qtd_asc")    filtered.sort((a, b) => a.availableQuantity - b.availableQuantity);
    if (sortValue === "qtd_desc")   filtered.sort((a, b) => b.availableQuantity - a.availableQuantity);
    if (sortValue === "nome_asc")   filtered.sort((a, b) => a.productName.localeCompare(b.productName));
    if (sortValue === "nome_desc")  filtered.sort((a, b) => b.productName.localeCompare(a.productName));

    renderStockGrid(filtered);
}

function buildCategoryOptions() {
    const select = document.getElementById("filterCategory");
    const categorias = [...new Set(allStock.map(p => p.productCategory))].sort();
    select.innerHTML = `<option value="">Todas as categorias</option>`;
    categorias.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function renderStockGrid(stockList) {
    const stockGrid = document.querySelector(".stock-grid");
    stockGrid.innerHTML = "";

    // Fatia só os cards da página atual
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = stockList.slice(start, start + ITEMS_PER_PAGE);

    if (paginated.length === 0) {
        stockGrid.innerHTML = `
            <div style="grid-column: 1/-1; text-align:center; padding: 48px; color: #94a3b8; font-size: 14px;">
                Nenhum produto encontrado.
            </div>
        `;
    } else {
        paginated.forEach(product => {
            const card = document.createElement("div");
            card.classList.add("stock-card");

            const name = product.productName;
            const category = product.productCategory;
            const isPerishable = product.productIsPerishable;
            const quantity = product.availableQuantity;
            const uom = product.unitOfMeasure;

            const lastEntry  = quantity > 0 ? formatarDataISO(product.lastStockEntry) : '--/--/--';
            const nextExpiry = quantity > 0 ? formatarDataISO(product.nextToExpireDate) : '--/--/--';
            const latestExpiry = quantity > 0 ? formatarDataISO(product.latestExpirationDate) : '--/--/--';

            const badgeClass = isPerishable ? "badge-orange" : "badge-green";
            const badgeText  = isPerishable ? "Perecível" : "Não Perecível";
            const displayQuantity = quantity != null ? String(quantity).padStart(2, '0') : "00";

            card.innerHTML = `
                <div class="card-top">
                    <div class="top-left">
                        <img src="../assets/categorias_dos_produtos_sched/${category}.png"
                            class="prod-thumb" onerror="this.src='../assets/file.png'">
                        <h3>${name}</h3>
                    </div>
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>
                <div class="card-center">
                    <div class="quantity-box">
                        <span class="big-number">${displayQuantity}</span>
                        <span class="unit-text">${uom || "Unidades"}</span>
                    </div>
                    <div class="right-info">
                        <div class="info-item">
                            <small>Categoria</small>
                            <strong>${category}</strong>
                        </div>
                        <div class="info-item">
                            <small>Última estocagem</small>
                            <strong class="date-highlight">${lastEntry}</strong>
                        </div>
                    </div>
                </div>
                <div class="card-footer">
                    <div class="expiry-info">
                        <p>Validade mais próxima: <span>${nextExpiry}</span></p>
                        <p>Validade mais distante: <span>${latestExpiry}</span></p>
                    </div>
                </div>
            `;

            card.onclick = () => {
                if (typeof openStockModal === "function") {
                    openStockModal(product);
                }
            };

            stockGrid.appendChild(card);
        });
    }

    renderPagination(stockList);
}

function renderPagination(stockList) {
    const totalPages = Math.ceil(stockList.length / ITEMS_PER_PAGE);

    let pagination = document.getElementById("pagination");
    if (!pagination) {
        pagination = document.createElement("div");
        pagination.id = "pagination";
        document.querySelector(".stock-grid").after(pagination);
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

    const inicio = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, stockList.length);
    const fim    = Math.min(currentPage * ITEMS_PER_PAGE, stockList.length);

    pagination.innerHTML = `
        <div class="pagination-info">
            Mostrando ${inicio}–${fim} de ${stockList.length} produtos
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
            renderStockGrid(stockList);
        });
    });

    document.getElementById("btnPrev")?.addEventListener("click", () => {
        if (currentPage > 1) { currentPage--; renderStockGrid(stockList); }
    });
    document.getElementById("btnNext")?.addEventListener("click", () => {
        if (currentPage < totalPages) { currentPage++; renderStockGrid(stockList); }
    });
}

async function loadStockProducts() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/stock/filterProduct", {
            method: "GET",
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" }
        });

        const stock = await response.json();

        if (response.ok) {
            allStock = stock;
            currentPage = 1;
            buildCategoryOptions();
            applyFiltersAndRender();

            let total = 0;
            stock.forEach(item => { total += item.availableQuantity || 0; });
            const totalEl = document.getElementById("totalEstoque");
            if (totalEl) totalEl.innerText = total;
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar o estoque.');
    }
}

async function registerStockEntry(productId, quantity, expirationDate) {
    try {
        const token = localStorage.getItem("token");
        const payload = {
            quantity: parseInt(quantity),
            expirationDate: `${expirationDate}T23:59:59`
        };

        const response = await fetch(`http://localhost:8080/stock/${productId}`, {
            method: "POST",
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert("success", "ESTOQUE ATUALIZADO", "O lote foi registrado com sucesso!");
            document.getElementById("stockModal").style.display = "none";
            await loadStockProducts();
        } else {
            showAlert("error", "ERRO AO SALVAR", result.message);
        }
    } catch (error) {
        showAlert("error", "SEM CONEXÃO", "O servidor parece estar desligado.");
    }
}

function formatarDataISO(dataISO) {
    if (!dataISO || dataISO.startsWith("1970") || dataISO === "") return '--/--/--';
    const data = new Date(dataISO);
    return isNaN(data.getTime()) ? '--/--/--' : data.toLocaleDateString('pt-BR');
}

function openStockModal(product) {
    const modal = document.getElementById("stockModal");
    const form = document.getElementById("stockForm");
    const inputQuantity = document.getElementById("stockQuantity");

    form.reset();
    form.dataset.productId = product.productId;
    inputQuantity.placeholder = `nº de ${product.unitOfMeasure || 'Unidades'}`;
    document.getElementById("modalHeaderTitle").innerText = `Entrada de Estoque: ${product.productName}`;

    const cardPreview = document.getElementById("cardPreview");
    const badgeClass = product.productIsPerishable ? "badge-orange" : "badge-green";
    const badgeText  = product.productIsPerishable ? "Perecível" : "Não Perecível";
    const quantity   = product.availableQuantity;
    const nextExpiry   = quantity > 0 ? formatarDataISO(product.nextToExpireDate) : '--/--/--';
    const latestExpiry = quantity > 0 ? formatarDataISO(product.latestExpirationDate) : '--/--/--';

    cardPreview.innerHTML = `
        <div class="card-top">
            <div class="top-left">
                <img src="../assets/categorias_dos_produtos_sched/${product.productCategory}.png" class="prod-thumb">
                <h3>${product.productName}</h3>
            </div>
            <span class="badge ${badgeClass}">${badgeText}</span>
        </div>
        <div class="card-center">
            <div class="quantity-box">
                <span class="big-number">${String(product.availableQuantity).padStart(2, '0')}</span>
                <div class="info-item"><small>${product.unitOfMeasure}</small></div>
            </div>
            <div class="right-info">
                <div class="info-item"><small>Categoria</small><strong>${product.productCategory}</strong></div>
                <div class="info-item"><small>Unidade</small><strong>${product.unitOfMeasure}</strong></div>
            </div>
        </div>
        <div class="card-footer">
            <div class="expiry-info">
                <p>Lote mais perto da validade: <span>${nextExpiry}</span></p>
                <p>Data de validade do lote: <span>${latestExpiry}</span></p>
            </div>
        </div>
    `;

    const perishableFields = document.getElementById("perishableFields");
    const inputExpiry = document.getElementById("stockExpiry");
    const hoje = new Date().toISOString().split("T")[0];
    inputExpiry.setAttribute("min", hoje);
    perishableFields.style.display = "block";
    inputExpiry.required = true;

    modal.style.display = "flex";
}