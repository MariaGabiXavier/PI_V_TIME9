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
    
    const searchInput = document.querySelector(".search-input");
    if (searchInput) {
        searchInput.addEventListener("input", function (e) {
            const termoBusca = e.target.value.toLowerCase().trim();
            const produtosFiltrados = allProducts.filter(produto => {
                const nome = (produto.productName || "").toLowerCase();
                const categoria = (produto.productCategory || "").toLowerCase();
                
                return nome.includes(termoBusca) || categoria.includes(termoBusca);
            });

            renderListProducts(produtosFiltrados);
        });
}
    // 4. Lógica do Calendário 
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
        const headers = {
            "Authorization": "Bearer " + token,
            "Content-Type": "application/json"
        };

        // Faz as duas chamadas ao mesmo tempo 
        const [resStock, resProduct] = await Promise.all([
            fetch("http://localhost:8080/stock/filterProduct", { headers }),
            fetch("http://localhost:8080/product", { headers })
        ]);

        const stockData = await resStock.json();
        const productData = await resProduct.json();

        if (resStock.ok && resProduct.ok) {
            const priceMap = {};
            productData.forEach(p => {
                priceMap[p.id] = p.price;
            });

            
            allProducts = stockData.map(item => ({
                ...item,
                productPrice: priceMap[item.productId] || 0 
            }));

            renderListProducts(allProducts);
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Erro ao cruzar dados de estoque e preço.');
    }
}
function renderListProducts(productsList) {
    const tableBody = document.getElementById("productsTableBody");
    if (!tableBody) return;

    if (productsList.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5" style="text-align: center; padding: 40px; color: #94a3b8;">
                    Nenhum produto encontrado com esse nome.
                </td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = "";

    productsList.forEach(product => {
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
    if (labelQuantidade) {
        labelQuantidade.innerText = `Quantidade (${unidadeMedida})`;
    }

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
