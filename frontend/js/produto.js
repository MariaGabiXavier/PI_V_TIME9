document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const user = await isValidUser(token);

    if (user) {
        await loadProducts();
    } else {
        window.location.href = "login.html";
    }

    // Eventos de Clique
    document.getElementById("btnSaveProduct").addEventListener("click", saveProduct);
    document.getElementById("btnSaveEdit").addEventListener("click", updateProduct);
    document.getElementById("btnOpen").onclick = () => {
        document.getElementById('modalOverlay').style.display = 'flex';
    };

    // Fechar modais
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

        // Lógica de abrir edição via Delegação de Evento
        const btnEditar = e.target.closest('.edit-link');
        if (btnEditar) {
            e.preventDefault();
            openPopUpEdit(btnEditar);
        }
    });

    document.querySelector(".search-input").addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();

        const produtosFiltrados = allProducts.filter(produto => {
            const nome = produto.name.toLowerCase();
            const categoria = produto.category.toLowerCase();
            return nome.includes(termoBusca) || categoria.includes(termoBusca);
        });

        renderListProducts(produtosFiltrados);
    });
});

let allProducts = [];

async function isValidUser(token) {
    try {
        const response = await fetch("http://localhost:8080/user/me", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });
        const result = await response.json();
        if (response.ok) return result;

        logout();
        return null;
    } catch (error) {
        showAlert('error', 'SEM CONEXÃO', 'O servidor parece estar desligado.');
        return null;
    }
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
            renderListProducts(allProducts);
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

    if(!name || !category || !priceRaw || !unitOfMeasure || document.getElementById("productType").value === "") {
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
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
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

    const productData = {
        name: name,
        category: category,
        price: price,
        isPerishable: isPerishable,
        unitOfMeasure: window.dadosOriginais.unitOfMeasure
    };

    try {
        const token = localStorage.getItem("token");
        const response = await fetch(`http://localhost:8080/product/${idParaEditar}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            showAlert('success', 'SUCESSO', 'Produto atualizado com sucesso!');
            document.getElementById("modalEditOverlay").style.display = "none";
            clearFormUpdate();
            await loadProducts();
        } else {
            const result = await response.json();
            showAlert('error', 'ERRO AO SALVAR', result.message);
        }
    } catch (error) {
        showAlert('error', 'SEM CONEXÃO', 'O servidor parece estar desligado.');
    }
}

function renderListProducts(productsList) {
    const tableBody = document.getElementById("productsTableBody");
    tableBody.innerHTML = "";

    productsList.forEach(product => {
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

    // Salva dados originais para comparação
    window.idProdutoSendoEditado = id;
    window.dadosOriginais = {
        nome: nome,
        preco: precoTexto,
        status: perishable,
        categoria: categoria,
        unitOfMeasure: uom
    };

    // ATUALIZAÇÃO: Define a imagem inicial no modal baseada na categoria
    const imgPreview = document.getElementById('edit-preview-img');
    imgPreview.src = `../assets/categorias_dos_produtos_sched/${categoria}.png`;

    document.getElementById('edit-header-titulo').innerText = `Editar Produto - ${nome}`;
    document.getElementById('edit-preview-nome').innerText = nome;
    document.getElementById('edit-preview-preco').innerText = `R$ ${precoTexto}`;
    document.getElementById('edit-preview-categoria').innerText = categoria;

    const badgePreview = document.getElementById('edit-preview-status');
    badgePreview.innerText = statusText;
    badgePreview.className = perishable ? 'badge-status-orange' : 'badge-status-green';

    // Preenche Inputs
    document.getElementById('edit-input-nome').value = nome;
    document.getElementById('edit-input-preco').value = precoTexto;
    document.getElementById('edit-input-status').value = perishable.toString();
    document.getElementById('edit-input-categoria').value = categoria;

    modalEditar.style.display = 'flex';
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
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