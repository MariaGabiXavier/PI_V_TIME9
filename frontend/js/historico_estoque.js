document.addEventListener("DOMContentLoaded", () => {
    loadHistory();
});

function loadHistory() {
    const mockData = [
        { name: "Filé Mignon (kg)", user: "Jhenifer Lhais", qty: 12, date: "12/04/2026", valid: "12/05/2026", category: "carne" },
        { name: "Cerveja Original 600ml", user: "Jhenifer Lhais", qty: 14, date: "12/04/2026", valid: "17/05/2026", category: "bebida" },
        { name: "Campari 1,5L", user: "Jhenifer Lhais", qty: 2, date: "11/04/2026", valid: "29/08/2026", category: "bebida" },
        { name: "Tomate (saco)", user: "Jhenifer Lhais", qty: 21, date: "11/04/2026", valid: "09/03/2027", category: "vegetal" },
        { name: "Coca Cola 360ml", user: "Jean yuki Kimura", qty: 9, date: "11/04/2026", valid: "10/01/2028", category: "bebida" }
    ];

    renderTable(mockData);

    // QUANDO FOR CONECTAR O BACK-END, USE ESTA PARTE:
    /*
    const token = localStorage.getItem("token");
    fetch("http://localhost:8080/stock/history", {
        headers: { "Authorization": "Bearer " + token }
    })
    .then(res => res.json())
    .then(data => renderTable(data))
    .catch(err => console.error("Erro ao carregar:", err));
    */
}

function renderTable(items) {
    const tbody = document.getElementById("historyTableBody");
    tbody.innerHTML = "";

    items.forEach(item => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>
                <div class="product-cell">
                    <img src="../assets/categorias_dos_produtos_sched/${item.category || 'file'}.png" onerror="this.src='../assets/file.png'">
                    <span>${item.name}</span>
                </div>
            </td>
            <td>${item.user}</td>
            <td class="qty-bold">${item.qty}</td>
            <td>${item.date}</td>
            <td>${item.valid}</td>
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