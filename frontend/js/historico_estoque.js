document.addEventListener("DOMContentLoaded", () => {
    loadHistory();

    document.querySelector(".search-input").addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();

        const produtosFiltrados = allHistory.filter(produto => {
            const nome = produto.productName.toLowerCase();
            const categoria = produto.productCategory.toLowerCase();
            return nome.includes(termoBusca) || categoria.includes(termoBusca);
        });

        renderTable(produtosFiltrados);
    });
});

// Variável global para busca eficiente
let allHistory = [];

async function loadHistory() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/stock", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });
        const data = await response.json();

        if (response.ok) {
            allHistory = data.filter(item => item.quantity > 0);

            renderTable(allHistory);
            updateStats(allHistory.length);
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar o historico de estoque.');
    }
}

function formatarDataISO(dataISO) {
    if (!dataISO || dataISO.startsWith("1970")) return '--/--/--';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR') + ' ' + data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
}

function formatarSomenteData(dataISO) {
    if (!dataISO || dataISO.startsWith("1970")) return '--/--/--';
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

function renderTable(items) {
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    items.forEach(item => {
        const tr = document.createElement("tr");

        // Mapeamento das chaves do seu JSON
        const productName = item.productName;
        const category = item.productCategory;
        const employee = item.createdBy;
        const quantity = item.quantity;
        const uom = item.unitOfMeasure;
        const createdAt = formatarDataISO(item.createdAt); // Data e Hora da estocagem
        const expiration = formatarSomenteData(item.expirationDate); // Validade

        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="../assets/categorias_dos_produtos_sched/${category}.png" onerror="this.src='../assets/file.png'">
                    <span>${productName}</span>
                </div>
            </td>
            <td>${employee}</td>
            <td class="qty-bold">${quantity} <small>${uom}</small></td>
            <td>${createdAt}</td>
            <td>${expiration}</td>
        `;
        tbody.appendChild(tr);
    });
}

function updateStats(total) {
    const statsText = document.querySelector(".bold-stats");
    if (statsText) {
        statsText.innerText = `${total} lotes estocados`;
    }
}