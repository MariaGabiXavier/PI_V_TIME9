document.addEventListener("DOMContentLoaded", async () => {
    // 1. Carrega os produtos
    await loadProducts();

    // 2. Botão de Histórico
    const btnHistory = document.querySelector(".btn-history");
    if (btnHistory) {
        btnHistory.addEventListener("click", () => {
            window.location.href = "historico_vendas.html";
        });
    }

    // 3. Barra de Pesquisa
    document.querySelector(".search-input").addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();
        const produtosFiltrados = allProducts.filter(produto => {
            const nome = (produto.name || "").toLowerCase();
            const categoria = (produto.category || "").toLowerCase();
            return nome.includes(termoBusca) || categoria.includes(termoBusca);
        });
        renderListProducts(produtosFiltrados);
    });

    // 4. Lógica do Calendário (Mantenha dentro do DOMContentLoaded)
    const sellDateCustom = document.getElementById('sellDateCustom');
    if (sellDateCustom) {
        sellDateCustom.style.display = 'none';
        document.querySelectorAll('input[name="saleDate"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                sellDateCustom.style.display = e.target.value === 'custom' ? 'block' : 'none';
            });
        });
    }

    // 5. Eventos de fechar o Modal (Mantenha dentro do DOMContentLoaded)
    const btnClose = document.getElementById('closeSellModal');
    const btnCancel = document.getElementById('btnCancelSell');
    if (btnClose) btnClose.onclick = closeModal;
    if (btnCancel) btnCancel.onclick = closeModal;

    // 6. Lógica de Envio do Formulário de Venda
    const sellForm = document.getElementById('sellForm');
    if (sellForm) {
        sellForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const productId = sellForm.getAttribute('data-product-id');
            const quantity = document.getElementById('sellQuantity').value;

            const vendaData = {
                totalSold: parseInt(quantity),
            };

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
                    setTimeout(() => {
                        window.location.href = "historico_vendas.html";
                    }, 1500);
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

// --- VARIÁVEIS E FUNÇÕES GLOBAIS ---

let allProducts = [];
const sellModal = document.getElementById('sellModal');

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

function renderListProducts(productsList) {
    const tableBody = document.getElementById("productsTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    productsList.forEach(product => {
        const tr = document.createElement("tr");
        tr.style.cursor = "pointer";
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
        `;
        tr.addEventListener("click", () => openSellModal(product));
        tableBody.appendChild(tr);
    });
}

function openSellModal(product) {
    if (!sellModal) return;
    document.getElementById('sellForm').setAttribute('data-product-id', product.id);

    const previewContainer = document.getElementById('sellCardPreview');
    
    // Pegando as datas do seu objeto de produto (ajuste os nomes conforme seu banco)
    const validadeProxima = product.nextToExpireDate ? new Date(product.nextToExpireDate).toLocaleDateString() : '21/02/26';
    const validadeLote = product.latestExpirationDate ? new Date(product.latestExpirationDate).toLocaleDateString() : '30/03/27';

    previewContainer.innerHTML = `
        <div class="card-top" style="margin-bottom: 20px;">
            <div class="top-left" style="display:flex; align-items:center; gap:12px;">
                <img src="../assets/categorias_dos_produtos_sched/${product.category}.png" style="width:40px; height:40px; border-radius:10px;">
                <div>
                    <h3 style="font-size:16px; font-weight:700; margin:0;">${product.name}</h3>
                    <span class="badge ${product.isPerishable ? 'badge-orange' : 'badge-green'}" style="padding: 2px 10px; font-size:10px;">
                        ${product.isPerishable ? 'Perecível' : 'Não Perecível'}
                    </span>
                </div>
            </div>
        </div>
        
        <div class="card-content-figma">
            <div style="display:flex; align-items:center; gap:20px; margin-bottom:15px;">
                <div style="display:flex; align-items:baseline;">
                    <span class="big-number-figma">${product.amount || 0}</span>
                    <span style="font-size:12px; font-weight:700; color:#94a3b8; margin-left:5px; text-transform:uppercase;">Fardos</span>
                </div>
                
                <div style="flex:1; display:flex; flex-direction:column; gap:8px; border-left:1px solid #f1f5f9; padding-left:15px;">
                    <div>
                        <small class="label-muted">Categoria</small>
                        <strong class="value-dark">${product.category}</strong>
                    </div>
                    <div>
                        <small class="label-muted">Última estocagem</small>
                        <strong class="value-green">${validadeProxima} <span style="font-weight:400; font-size:10px;">(há 5 dias)</span></strong>
                    </div>
                </div>
            </div>

            <div style="border-top: 1px dashed #e2e8f0; padding-top:12px; display:flex; flex-direction:column; gap:4px;">
                <p style="margin:0; font-size:11px; color:#64748b; font-weight:600;">Lote mais perto da validade: <span style="color:#1e293b;">${validadeProxima}</span></p>
                <p style="margin:0; font-size:11px; color:#64748b; font-weight:600;">Data de validade do lote: <span style="color:#94a3b8; font-weight:400;">${validadeLote} • <span style="color:#22c55e; font-weight:700;">12 meses</span></span></p>
            </div>
        </div>
    `;

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