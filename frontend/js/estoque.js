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

function formatLastStock(dateString) {
    if (!dateString) return "Nunca estocado";

    const stockDate = new Date(dateString);
    const now = new Date();
    
    const formattedDate = stockDate.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
    });

    const d1 = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const d2 = new Date(stockDate.getFullYear(), stockDate.getMonth(), stockDate.getDate());
    const diffTime = Math.abs(d1 - d2);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    let timeLabel = "";
    if (diffDays === 0) timeLabel = "hoje";
    else if (diffDays === 1) timeLabel = "há 1 dia";
    else timeLabel = `há ${diffDays} dias`;

    return `${formattedDate} <span class="days-ago">${timeLabel}</span>`;
}

async function loadStockProducts() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/product", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) throw new Error("Erro ao buscar produtos");

        const products = await response.json();
        const stockGrid = document.querySelector(".stock-grid");
        stockGrid.innerHTML = "";

        products.forEach(product => {
            const card = document.createElement("div");
            card.classList.add("stock-card");

            const isPerishable = product.isPerishable;
            const badgeClass = isPerishable ? "badge-orange" : "badge-green";
            const badgeText = isPerishable ? "Perecível" : "Não Perecível";
            
            const displayQuantity = product.currentStock != null ? String(product.currentStock).padStart(2, '0') : "00";
            const lastStockHTML = formatLastStock(product.lastStockDate);

            let footerHTML = "";
            if (isPerishable) {
                footerHTML = `
                    <div class="card-footer">
                        <div class="expiry-info">
                            <p>Lote mais perto da validade: <span>${product.nearestExpiry || '--/--/--'}</span></p>
                            <p>Data de validade do lote: <span>${product.batchExpiry || '--/--/--'}</span></p>
                        </div>
                    </div>`;
            }

            card.innerHTML = `
                <div class="card-top">
                    <div class="top-left">
                        <img src="../assets/categorias_dos_produtos_sched/${product.category}.png" 
                            class="prod-thumb" onerror="this.src='../assets/file.png'">
                        <h3>${product.name}</h3>
                    </div>
                    <span class="badge ${badgeClass}">${badgeText}</span>
                </div>

                <div class="card-center">
                    <div class="quantity-box">
                        <span class="big-number">${displayQuantity}</span>
                        <span class="unit-text">${product.unitOfMeasure || "Unidades"}</span>
                    </div>

                    <div class="right-info">
                        <div class="info-item">
                            <small>Categoria</small>
                            <strong>${product.category}</strong>
                        </div>
                        <div class="info-item">
                            <small>Última estocagem</small>
                            <strong class="date-highlight">${lastStockHTML}</strong>
                        </div>
                    </div>
                </div>
                ${footerHTML}
            `;

            card.onclick = () => openStockModal(product);
            stockGrid.appendChild(card);
        });
    } catch (error) {
        console.error("Erro ao carregar:", error);
    }
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