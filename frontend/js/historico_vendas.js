document.addEventListener("DOMContentLoaded", async () => {
   await loadHistorySale();

    document.querySelector(".search-input").addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();

        const produtosFiltrados = allHistorySale.filter(produto => {
            const nome = produto.productName.toLowerCase();
            const categoria = produto.productCategory.toLowerCase();
            return nome.includes(termoBusca) || categoria.includes(termoBusca);
        });

        renderTable(produtosFiltrados);
    });
});

let allHistorySale = [];

async function loadHistorySale() {
    try {
        const token = localStorage.getItem("token");
        const response = await fetch("http://localhost:8080/sale", {
            headers: { "Authorization": "Bearer " + token }
        });
        const historySale = await response.json();

        if (response.ok) {
            // Invertemos a lista aqui para que o último item do banco (mais novo)
            // se torne o primeiro da lista na tela.
            allHistorySale = historySale.reverse();

            renderTable(allHistorySale);
            updateWeekSalesInfo();
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar o histórico de vendas.');
    }
}

function renderTable(items) {
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";
    
    items.forEach(item => {
        const tr = document.createElement("tr");

        // Formata o preço para o padrão brasileiro (R$ 00,00)
        const precoFormatado = Number(item.totalPrice || 0).toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        });

        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="../assets/categorias_dos_produtos_sched/${item.productCategory}.png" onerror="this.src='../assets/file.png'">
                    <span>${item.productName}</span>
                </div>
            </td>
            <td>${item.soldBy}</td>
            <td>${item.totalSold}</td>
            <td class="price-cell-bold">${precoFormatado}</td> 
            <td>${formatarSomenteData(item.saleDate)}</td>
        `;
        tbody.appendChild(tr);
    });
}

function formatarSomenteData(dataISO) {
    const data = new Date(dataISO);
    return data.toLocaleDateString('pt-BR');
}

function updateWeekSalesInfo() {
    const total = getWeekSalesQuantity();

    document.getElementById("weekSalesText").textContent =
        `${total} vendas registradas`;
}

function getWeekSalesQuantity() {
    const hoje = new Date();

    const diaSemana = hoje.getDay();
    const diff = diaSemana === 0 ? 6 : diaSemana - 1;

    const inicioSemana = new Date(hoje);
    inicioSemana.setDate(hoje.getDate() - diff);
    inicioSemana.setHours(0, 0, 0, 0);

    const fimSemana = new Date(inicioSemana);
    fimSemana.setDate(inicioSemana.getDate() + 7);

    const vendasDaSemana = allHistorySale.filter(item => {
        const dataVenda = new Date(item.saleDate);

        return dataVenda >= inicioSemana && dataVenda < fimSemana;
    });

    return vendasDaSemana.length;
}
