document.addEventListener("DOMContentLoaded", async () => {
   await loadProducts();

    const btnHistory = document.querySelector(".btn-history");
    if (btnHistory) {
        btnHistory.addEventListener("click", () => {
            window.location.href = "historico_vendas.html";
        });
    }

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
        `;
        tableBody.appendChild(tr);
    });
}