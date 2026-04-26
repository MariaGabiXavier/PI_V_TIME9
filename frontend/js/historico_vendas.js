document.addEventListener("DOMContentLoaded", () => {
    loadHistory();

    document.querySelector(".search-input").addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();

        const produtosFiltrados = allProducts.filter(produto => {
            const nome = produto.productName.toLowerCase();
            const categoria = produto.productCategory.toLowerCase();
            return nome.includes(termoBusca) || categoria.includes(termoBusca);
        });

        renderTable(produtosFiltrados);
    });
});

let allProducts = [];

function loadHistory() {
    const mockData = [
        { productName: "Filé Mignon",       soldBy: "Jhenifer Lais",    totalSold: 12, saleDate: "12/04/2026",  productCategory: "carne" },
        { productName: "Cerveja Original", soldBy: "Jhenifer Lais",    totalSold: 14, saleDate: "12/04/2026",  productCategory: "bebida" },
        { productName: "Campari",           soldBy: "Jhenifer Lais",    totalSold: 2,  saleDate: "11/04/2026",  productCategory: "bebida" },
        { productName: "Tomate",          soldBy: "Jhenifer Lais",    totalSold: 21, saleDate: "11/04/2026",  productCategory: "vegetal" },
        { productName: "Coca Cola",        soldBy: "Jean yuki Kimura", totalSold: 9,  saleDate: "11/04/2026",  productCategory: "bebida" }
    ];
    allProducts.push(mockData);

    renderTable(mockData);
}

function renderTable(items) {
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    items.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="../assets/categorias_dos_produtos_sched/${item.productCategory}.png" onerror="this.src='../assets/file.png'">
                    <span>${item.productName}</span>
                </div>
            </td>
            <td>${item.soldBy}</td>
            <td class="qty-bold">${item.totalSold}</td>
            <td>${item.saleDate}</td>
        `;
        tbody.appendChild(tr);
    });
}

document.getElementById("historySearch").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll("#historyTableBody tr");
    rows.forEach(row => {
        row.style.display = row.innerText.toLowerCase().includes(term) ? "" : "none";
    });
});