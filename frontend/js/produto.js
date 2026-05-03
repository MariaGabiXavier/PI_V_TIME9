document.addEventListener("DOMContentLoaded", async () => {
    await loadProducts();

    document.getElementById("btnSaveProduct").addEventListener("click", saveProduct);
    document.getElementById("btnSaveEdit").addEventListener("click", updateProduct);
    document.getElementById("btnOpen").onclick = () => {
        document.getElementById('modalOverlay').style.display = 'flex';
    };

    document.addEventListener('click', (e) => {
        const modalNovo = document.getElementById('modalOverlay');
        const modalEditar = document.getElementById('modalEditOverlay');

        if (e.target.id === 'btnClose' || e.target.id === 'btnEditClose' || e.target.id === 'btnCancel') {
            modalNovo.style.display = 'none';
            modalEditar.style.display = 'none';
        }

        if (e.target === modalNovo || e.target === modalEditar) {
            modalNovo.style.display = 'none';
            modalEditar.style.display = 'none';
        }

        const btnEditar = e.target.closest('.edit-link');
        if (btnEditar) {
            e.preventDefault();
            openPopUpEdit(btnEditar);
        }
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
let allProducts = [];
let currentPage = 1;
let ITEMS_PER_PAGE = 10;
// ─────────────────────────────────────────────────────────

function applyFiltersAndRender() {
    const termoBusca = document.querySelector(".search-input").value.toLowerCase();
    const sortValue = document.getElementById("filterSort").value;
    const categoryValue = document.getElementById("filterCategory").value;

    let filtered = allProducts.filter(produto => {
        const nome = produto.name.toLowerCase();
        const categoria = produto.category.toLowerCase();
        const matchBusca = nome.includes(termoBusca) || categoria.includes(termoBusca);
        const matchCategoria = categoryValue === "" || produto.category === categoryValue;
        return matchBusca && matchCategoria;
    });

    if (sortValue === "preco_asc")  filtered.sort((a, b) => a.price - b.price);
    if (sortValue === "preco_desc") filtered.sort((a, b) => b.price - a.price);
    if (sortValue === "nome_asc")   filtered.sort((a, b) => a.name.localeCompare(b.name));
    if (sortValue === "nome_desc")  filtered.sort((a, b) => b.name.localeCompare(a.name));

    renderListProducts(filtered);
}

function buildCategoryOptions() {
    const select = document.getElementById("filterCategory");
    const categorias = [...new Set(allProducts.map(p => p.category))].sort();
    select.innerHTML = `<option value="">Todas as categorias</option>`;
    categorias.forEach(cat => {
        select.innerHTML += `<option value="${cat}">${cat}</option>`;
    });
}

function renderListProducts(productsList) {
    const tableBody = document.getElementById("productsTableBody");
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
            tr.innerHTML = `
                <td class="product-cell">
                    <img src="../assets/categorias_dos_produtos_sched/${product.category}.png" class="thumb-prod" alt="">
                    ${product.name}
                </td>
                <td class="price-cell">R$ ${product.price.toFixed(2).replace(".", ",")}</td>
                <td>
                    <span class="badge ${product.isPerishable ? "badge-orange" : "badge-green"}">
                        ${product.isPerishable ? "Perecível" : "Não Perecível"}
                    </span>
                </td>
                <td>${product.category}</td>
                <td>
                    <a href="#" class="edit-link"
                       data-id="${product.id}"
                       data-uom="${product.unitOfMeasure}"
                       data-perishable="${product.isPerishable}">
                        Editar
                    </a>
                </td>
            `;
            tableBody.appendChild(tr);
        });
    }

    const totalEl = document.getElementById("totalProdutos");
    if (totalEl) totalEl.innerText = productsList.length;

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
        const response = await fetch("http://localhost:8080/product", {
            headers: { "Authorization": "Bearer " + token }
        });
        const products = await response.json();

        if (response.ok) {
            allProducts = products;
            currentPage = 1;
            buildCategoryOptions();
            applyFiltersAndRender();
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar os produtos.');
    }
}

async function saveProduct() {
    const name = document.getElementById("productName").value.trim();
    const category = document.getElementById("productCategory").value;
    const priceRaw = document.getElementById("productPrice").value;
    const unitOfMeasure = document.getElementById("unitOfMeasure").value;
    const isPerishable = document.getElementById("productType").value === "true";
    const price = parseFloat(priceRaw.replace(",", "."));

    if (!name || !category || !priceRaw || !unitOfMeasure || document.getElementById("productType").value === "") {
        showAlert('warning', 'CAMPOS OBRIGATÓRIOS', 'Preencha todos os campos!');
        return;
    }

    if (isNaN(price)) {
        showAlert('error', 'VALOR INVÁLIDO', 'Digite um preço válido.');
        return;
    }

    const productData = { name, category, price, isPerishable, unitOfMeasure };

    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/product", {
            method: "POST",
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            showAlert('success', 'SUCESSO!', 'Produto cadastrado com sucesso!');
            document.getElementById("modalOverlay").style.display = "none";
            clearFormCreate();
            await loadProducts();
        } else {
            const result = await response.json();
            showAlert('error', 'ERRO', result.message);
        }
    } catch (error) {
        showAlert('error', 'SEM CONEXÃO', 'Erro ao conectar com o servidor.');
    }
}

async function updateProduct() {
    const idParaEditar = window.idProdutoSendoEditado;
    const name = document.getElementById("edit-input-nome").value.trim();
    const priceRaw = document.getElementById("edit-input-preco").value.trim();
    const category = document.getElementById("edit-input-categoria").value;
    const isPerishable = document.getElementById("edit-input-status").value === "true";
    const price = parseFloat(priceRaw.replace(",", "."));

    if (!name || !priceRaw || !category) {
        showAlert('warning', 'CAMPOS OBRIGATÓRIOS', 'Preencha todos os campos!');
        return;
    }

    if (isNaN(price)) {
        showAlert('error', 'VALOR INVÁLIDO', 'Digite um preço válido.');
        return;
    }

    if (
        name === window.dadosOriginais.nome &&
        price === parseFloat(window.dadosOriginais.preco.replace(",", ".")) &&
        category === window.dadosOriginais.categoria &&
        isPerishable === window.dadosOriginais.status
    ) {
        showAlert('warning', 'SEM ALTERAÇÕES', 'Você não modificou nenhum dado.');
        return;
    }

    const productData = { name, category, price, isPerishable, unitOfMeasure: window.dadosOriginais.unitOfMeasure };

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8080/product/${idParaEditar}`, {
            method: "PUT",
            headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('success', 'SUCESSO', 'Produto atualizado com sucesso!');
            document.getElementById("modalEditOverlay").style.display = "none";
            clearFormUpdate();
            await loadProducts();
        } else {
            showAlert('error', 'ERRO AO SALVAR', result.message);
        }
    } catch (error) {
        showAlert('error', 'SEM CONEXÃO', 'O servidor parece estar desligado.');
    }
}

function openPopUpEdit(elemento) {
    const modalEditar = document.getElementById('modalEditOverlay');
    const id = elemento.getAttribute('data-id');
    const uom = elemento.getAttribute('data-uom');
    const perishable = elemento.getAttribute('data-perishable') === 'true';

    const linha = elemento.closest('tr');
    const nome = linha.cells[0].innerText.trim();
    const precoTexto = linha.cells[1].innerText.replace('R$', '').trim();
    const statusText = linha.cells[2].innerText.trim();
    const categoria = linha.cells[3].innerText.trim();

    window.idProdutoSendoEditado = id;
    window.dadosOriginais = { nome, preco: precoTexto, status: perishable, categoria, unitOfMeasure: uom };

    document.getElementById('edit-preview-img').src = `../assets/categorias_dos_produtos_sched/${categoria}.png`;
    document.getElementById('edit-header-titulo').innerText = `Editar Produto - ${nome}`;
    document.getElementById('edit-preview-nome').innerText = nome;
    document.getElementById('edit-preview-preco').innerText = `R$ ${precoTexto}`;
    document.getElementById('edit-preview-categoria').innerText = categoria;

    const badgePreview = document.getElementById('edit-preview-status');
    badgePreview.innerText = statusText;
    badgePreview.className = perishable ? 'badge-status-orange' : 'badge-status-green';

    document.getElementById('edit-input-nome').value = nome;
    document.getElementById('edit-input-preco').value = precoTexto;
    document.getElementById('edit-input-status').value = perishable.toString();
    document.getElementById('edit-input-categoria').value = categoria;

    modalEditar.style.display = 'flex';
}

function clearFormCreate() {
    document.getElementById("productName").value = "";
    document.getElementById("productCategory").selectedIndex = 0;
    document.getElementById("productPrice").value = "";
    document.getElementById("unitOfMeasure").selectedIndex = 0;
    document.getElementById("productType").selectedIndex = 0;
}

function clearFormUpdate() {
    document.getElementById("edit-input-nome").value = "";
    document.getElementById("edit-input-preco").value = "";
    window.idProdutoSendoEditado = null;
    window.dadosOriginais = null;
}