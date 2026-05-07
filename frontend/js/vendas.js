document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();

    const btnHistory = document.querySelector(".btn-history");
    if (btnHistory) {
        btnHistory.addEventListener("click", () => {
            window.location.href = "historico_vendas.html";
        });
    }

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

    // Calendário
    const sellDateCustom = document.getElementById('sellDateCustom');
    if (sellDateCustom) {
        sellDateCustom.style.display = 'none';
        document.querySelectorAll('input[name="saleDate"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                sellDateCustom.style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        });
    }

    // Fechar modal
    const btnClose = document.getElementById('closeSellModal');
    const btnCancel = document.getElementById('btnCancelSell');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    // Submit venda
    const sellForm = document.getElementById('sellForm');
    if (sellForm) {
        sellForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const productId = sellForm.getAttribute('data-product-id');
            const quantity = document.getElementById('sellQuantity').value;
            const vendaData = { totalSold: parseInt(quantity) };

            try {
                const token = localStorage.getItem("token");
                const response = await fetch(`http://localhost:8080/sale/${productId}`, {
                    method: "POST",
                    headers: {
                        "Authorization": "Bearer " + token,
                        "Content-Type": "application/json"
                    },
                    body: JSON.stringify(vendaData)
                });

                if (response.ok) {
                    showAlert('success', 'SUCESSO', 'Venda registrada com sucesso!');
                    setTimeout(() => { window.location.href = "historico_vendas.html"; }, 1500);
                } else {
                    const error = await response.json();
                    showAlert('error', 'ERRO', error.message || 'Falha ao registrar venda.');
                }
            } catch (error) {
                showAlert('error', 'ERRO', 'Erro de conexão com o servidor.');
            }
        });
    }
});

// ─── Estado global ────────────────────────────────────────
let allProducts = [];
let currentPage = 1;
let ITEMS_PER_PAGE = 10;
const sellModal = document.getElementById('sellModal');
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

    let filtered = allProducts.filter(produto => {
        const nome = normalizar(produto.productName || "");
        const categoria = normalizar(produto.productCategory || "");
        const matchBusca = nome.includes(termoBusca) || categoria.includes(termoBusca);
        const matchCategoria = categoryValue === "" || produto.productCategory === categoryValue;
        return matchBusca && matchCategoria;
    });

    if (sortValue === "preco_asc")  filtered.sort((a, b) => a.productPrice - b.productPrice);
    if (sortValue === "preco_desc") filtered.sort((a, b) => b.productPrice - a.productPrice);
    if (sortValue === "nome_asc")   filtered.sort((a, b) => a.productName.localeCompare(b.productName));
    if (sortValue === "nome_desc")  filtered.sort((a, b) => b.productName.localeCompare(a.productName));
    if (sortValue === "qtd_asc")    filtered.sort((a, b) => a.availableQuantity - b.availableQuantity);
    if (sortValue === "qtd_desc")   filtered.sort((a, b) => b.availableQuantity - a.availableQuantity);

    renderListProducts(filtered);
}

function buildCategoryOptions() {
    const select = document.getElementById("filterCategory");
    const categorias = [...new Set(allProducts.map(p => p.productCategory))].sort();
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

function renderListProducts(productsList) {
    const tableBody = document.getElementById("productsTableBody");
    if (!tableBody) return;

    tableBody.innerHTML = "";

    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginated = productsList.slice(start, start + ITEMS_PER_PAGE);

    if (paginated.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align:center; padding: 32px; color: #94a3b8; font-size: 14px;">
                    Nenhum produto encontrado.
                </td>
            </tr>
        `;
    } else {
        paginated.forEach(product => {
            const tr = document.createElement("tr");
            const price = product.productPrice || 0;

            tr.innerHTML = `
                <td class="product-cell">
                    <img src="../assets/categorias_dos_produtos_sched/${product.productCategory}.png" class="thumb-prod">
                    ${product.productName}
                </td>
                <td class="price-cell">
                    R$ ${price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </td>
                <td>
                    <span class="badge ${product.productIsPerishable ? "badge-orange" : "badge-green"}">
                        ${product.productIsPerishable ? "Perecível" : "Não Perecível"}
                    </span>
                </td>
                <td>${product.productCategory}</td>
            `;

            tr.addEventListener("click", () => openSellModal(product));
            tableBody.appendChild(tr);
        });
    }

    renderPagination(productsList);
}

function renderPagination(productsList) {
    const totalPages = Math.ceil(productsList.length / ITEMS_PER_PAGE);

    let pagination = document.getElementById("pagination");
    if (!pagination) {
        pagination = document.createElement("div");
        pagination.id = "pagination";
        document.getElementById("productsTableBody").closest("table").after(pagination);
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

    const inicio = Math.min((currentPage - 1) * ITEMS_PER_PAGE + 1, productsList.length);
    const fim    = Math.min(currentPage * ITEMS_PER_PAGE, productsList.length);

    pagination.innerHTML = `
        <div class="pagination-info">
            Mostrando ${inicio}–${fim} de ${productsList.length} produtos
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
            renderListProducts(productsList);
        });
    });

    document.getElementById("btnPrev")?.addEventListener("click", () => {
        if (currentPage > 1) { currentPage--; renderListProducts(productsList); }
    });
    document.getElementById("btnNext")?.addEventListener("click", () => {
        if (currentPage < totalPages) { currentPage++; renderListProducts(productsList); }
    });
}

async function loadProducts() {
    try {
        const token = localStorage.getItem("token");
        const headers = {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        };

        const [resStock, resProduct] = await Promise.all([
            fetch("http://localhost:8080/stock/filterProduct", { headers }),
            fetch("http://localhost:8080/product", { headers })
        ]);

        const stockData  = await resStock.json();
        const productData = await resProduct.json();

        if (resStock.ok && resProduct.ok) {
            const priceMap = {};
            productData.forEach(p => { priceMap[p.id] = p.price; });

            allProducts = stockData.map(item => ({
                ...item,
                productPrice: priceMap[item.productId] || 0
            }));

            currentPage = 1;
            buildCategoryOptions();
            applyFiltersAndRender();

            // Ajusta largura dos selects dinamicamente
            document.querySelectorAll(".filters-bar select").forEach(select => {
                ajustarLarguraSelect(select);
                select.addEventListener("change", () => ajustarLarguraSelect(select));
            });
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Erro ao cruzar dados de estoque e preço.');
    }
}

function openSellModal(product) {
    if (!sellModal) return;

    document.getElementById('sellForm').setAttribute('data-product-id', product.productId);
    const previewContainer = document.getElementById('sellCardPreview');

    const formatar = (data) => {
        if (!data || data.startsWith("1970")) return '--/--/--';
        return new Date(data).toLocaleDateString('pt-BR');
    };

    const unidadeMedida = product.unitOfMeasure || "Unid.";

    previewContainer.innerHTML = `
        <div class="card-top" style="margin-bottom: 20px;">
            <div class="top-left" style="display:flex; align-items:center; gap:12px;">
                <img src="../assets/categorias_dos_produtos_sched/${product.productCategory}.png" style="width:40px; height:40px; border-radius:10px;">
                <div>
                    <h3 style="font-size:16px; font-weight:700; margin:0;">${product.productName}</h3>
                    <span class="badge ${product.productIsPerishable ? 'badge-orange' : 'badge-green'}" style="padding: 2px 10px; font-size:10px;">
                        ${product.productIsPerishable ? 'Perecível' : 'Não Perecível'}
                    </span>
                </div>
            </div>
        </div>
        <div class="card-content">
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:15px;">
                <div style="display:flex; align-items:baseline;">
                    <span class="big-number">${String(product.availableQuantity || 0).padStart(2, '0')}</span>
                    <span style="font-size:12px; font-weight:700; color:#94a3b8; margin-left:5px; text-transform:uppercase;">${unidadeMedida}</span>
                </div>
                <div style="flex:1; display:flex; flex-direction:column; gap:8px; border-left:1px solid #f1f5f9; padding-left:15px;">
                    <div>
                        <small class="label-muted">Categoria</small>
                        <strong class="value-dark">${product.productCategory}</strong>
                    </div>
                    <div>
                        <small class="label-muted">Última estocagem</small>
                        <strong class="value-green">${formatar(product.lastStockEntry)}</strong>
                    </div>
                </div>
            </div>
            <div style="border-top: 1px dashed #e2e8f0; padding-top:12px; display:flex; flex-direction:column; gap:4px;">
                <p style="margin:0; font-size:11px; color:#64748b; font-weight:600;">Lote mais perto da validade: <span style="color:#1e293b;">${formatar(product.nextToExpireDate)}</span></p>
                <p style="margin:0; font-size:11px; color:#64748b; font-weight:600;">Data de validade do lote: <span style="color:#94a3b8; font-weight:400;">${formatar(product.latestExpirationDate)}</span></p>
            </div>
        </div>
    `;

    const labelQuantidade = document.querySelector('label[for="sellQuantity"]');
    if (labelQuantidade) labelQuantidade.innerText = `Quantidade (${unidadeMedida})`;

    sellModal.style.display = 'flex';
}

function closeModal() {
    if (!sellModal) return;
    sellModal.style.display = 'none';
    document.getElementById('sellForm').reset();
    const sellDateCustom = document.getElementById('sellDateCustom');
    if (sellDateCustom) sellDateCustom.style.display = 'none';
}

window.onclick = (event) => {
    if (event.target == sellModal) closeModal();
};