let currentProduct = null;

document.addEventListener("DOMContentLoaded", async () => {
    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const btnHistory = document.querySelector(".btn-history");
    if (btnHistory) {
        btnHistory.addEventListener("click", () => {
            window.location.href = "historico_estoque.html";
        });
    }

    await loadStockProducts();
    
    setupModalEvents();
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
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar o estoque.');
    }
}

function formatarDataISO(dataISO) {
    if (!dataISO || dataISO.startsWith("1970")) return '--/--/--';
    if (!dataISO || dataISO === "") return '--/--/--';
    const data = new Date(dataISO);
    // Verifica se a data é válida antes de formatar
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

        // Agora o footerHTML é gerado para TODOS os produtos
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
    currentProduct = product;
    const modal = document.getElementById("stockModal");
    const modalHeaderTitle = document.getElementById("modalHeaderTitle");
    const cardPreview = document.getElementById("cardPreview");
    const perishableFields = document.getElementById("perishableFields");
    const fieldsSection = document.querySelector(".modal-fields-section");
    const inputQuantity = document.getElementById("stockQuantity");

    modalHeaderTitle.innerText = `Entrada de Estoque - ${product.name}`;
    inputQuantity.placeholder = `nº de ${product.unitOfMeasure || 'Unidades'}`;

    const lastStockDateText = product.lastStockDate ? new Date(product.lastStockDate).toLocaleDateString('pt-BR') : '--';
    cardPreview.innerHTML = `
        <div class="card-top">
            <div class="top-left">
                <img src="../assets/categorias_dos_produtos_sched/${product.category}.png" class="prod-thumb">
                <h3>${product.name}</h3>
            </div>
            <span class="badge ${product.isPerishable ? 'badge-orange' : 'badge-green'}">${product.isPerishable ? 'Perecível' : 'Não Perecível'}</span>
        </div>
        <div class="card-center">
            <div class="quantity-box">
                <span class="big-number">${product.currentStock || '00'}</span>
                <span class="unit-text">${product.unitOfMeasure || 'Unidades'}</span>
            </div>
            <div class="right-info">
                <div class="info-item"><small>Categoria</small><strong>${product.category}</strong></div>
                <div class="info-item"><small>Última estocagem</small><strong>${lastStockDateText}</strong></div>
            </div>
        </div>
    `;

    if (product.isPerishable) {
        perishableFields.style.display = "block";
        fieldsSection.classList.add("non-perishable-border"); 
    } else {
        perishableFields.style.display = "none";
        fieldsSection.classList.add("non-perishable-border"); 
    }

    document.getElementById("stockForm").reset();
    modal.style.display = "flex";
}

function setupModalEvents() {
    const modal = document.getElementById("stockModal");
    const stockForm = document.getElementById("stockForm");

    document.querySelectorAll(".close-modal").forEach(btn => {
        btn.onclick = () => modal.style.display = "none";
    });

    window.onclick = (e) => { if (e.target == modal) modal.style.display = "none"; };

    stockForm.onsubmit = async (e) => {
        e.preventDefault();
        const token = localStorage.getItem("token");
        
        const payload = {
            productId: currentProduct.id,
            quantity: parseFloat(document.getElementById("stockQuantity").value),
            expiryDate: currentProduct.isPerishable ? document.getElementById("stockExpiry").value : null
        };

        try {
            const response = await fetch("http://localhost:8080/stock/entry", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                modal.style.display = "none";
                await loadStockProducts(); 
                alert("Estoque registrado com sucesso!");
            }
        } catch (error) {
            alert("Erro ao salvar entrada.");
        }
    };
}