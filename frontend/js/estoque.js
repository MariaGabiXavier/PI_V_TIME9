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

    document.querySelector(".search-input").addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();

        const produtosFiltrados = allStock.filter(produto => {
            const nome = produto.productName.toLowerCase();
            const categoria = produto.productCategory.toLowerCase();
            return nome.includes(termoBusca) || categoria.includes(termoBusca);
        });

        renderStockGrid(produtosFiltrados);
    });
});

let allStock = [];

async function loadStockProducts() {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:8080/stock/filterProduct", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        const stock = await response.json();

        if (response.ok) {
            allStock = stock;
            renderStockGrid(stock);

            let total = 0;

            stock.forEach(item => {
                total += item.availableQuantity || 0;
            });
            
            const totalEl = document.getElementById("totalEstoque");
            if (totalEl) {
                totalEl.innerText = total;
            }

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
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
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
    if (!dataISO || dataISO.startsWith("1970")) return '--/--/--';
    if (!dataISO || dataISO === "") return '--/--/--';
    const data = new Date(dataISO);

    return isNaN(data.getTime()) ? '--/--/--' : data.toLocaleDateString('pt-BR');
}

function renderStockGrid(stockList) {
    const stockGrid = document.querySelector(".stock-grid");
    stockGrid.innerHTML = "";

    stockList.forEach(product => {
        const card = document.createElement("div");
        card.classList.add("stock-card");

        // Mapeamento baseado no seu JSON
        const name = product.productName;
        const category = product.productCategory;
        const isPerishable = product.productIsPerishable;
        const quantity = product.availableQuantity;
        const uom = product.unitOfMeasure;

        // Datas formatadas
        const lastEntry = (quantity > 0) ? formatarDataISO(product.lastStockEntry) : '--/--/--';
        const nextExpiry = (quantity > 0) ? formatarDataISO(product.nextToExpireDate) : '--/--/--';
        const latestExpiry = (quantity > 0) ? formatarDataISO(product.latestExpirationDate) : '--/--/--';

        const badgeClass = isPerishable ? "badge-orange" : "badge-green";
        const badgeText = isPerishable ? "Perecível" : "Não Perecível";

        const displayQuantity = quantity != null ? String(quantity).padStart(2, '0') : "00";

        const footerHTML = `
            <div class="card-footer">
                <div class="expiry-info">
                    <p>Validade mais próxima: <span>${nextExpiry}</span></p>
                    <p>Validade mais distante: <span>${latestExpiry}</span></p>
                </div>
            </div>`;

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
            ${footerHTML}
        `;

        card.onclick = () => {
            if (typeof openStockModal === "function") {
                openStockModal(product);
            }
        };

        stockGrid.appendChild(card);
    });
}

function openStockModal(product) {
    const modal = document.getElementById("stockModal");
    const form = document.getElementById("stockForm");

    form.reset();

    // Armazena o ID para o submit
    form.dataset.productId = product.productId;

    document.getElementById("modalHeaderTitle").innerText = `Entrada de Estoque: ${product.productName}`;

    // Atualiza o Preview do Card
    const cardPreview = document.getElementById("cardPreview");
    const badgeClass = product.productIsPerishable ? "badge-orange" : "badge-green";
    const badgeText = product.productIsPerishable ? "Perecível" : "Não Perecível";

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
                <small>Atual</small>
            </div>
            <div class="right-info">
                <div class="info-item"><small>Categoria</small><strong>${product.productCategory}</strong></div>
                <div class="info-item"><small>Unidade</small><strong>${product.unitOfMeasure}</strong></div>
            </div>
        </div>
    `;

    // AJUSTE: O campo de validade agora fica SEMPRE visível e é obrigatório
    const perishableFields = document.getElementById("perishableFields");
    const inputExpiry = document.getElementById("stockExpiry");

    const hoje = new Date().toISOString().split("T")[0];
    inputExpiry.setAttribute("min", hoje);

    perishableFields.style.display = "block";
    inputExpiry.required = true;

    modal.style.display = "flex";
}