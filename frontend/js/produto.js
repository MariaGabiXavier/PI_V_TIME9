document.addEventListener("DOMContentLoaded", () => {
    loadProducts();
});

async function loadProducts() {
    try {
        const token = localStorage.getItem("token");

        const response = await fetch("http://localhost:8080/product", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        if (!response.ok) {
            throw new Error("Erro ao buscar produtos");
        }

        const products = await response.json();

        const tableBody = document.getElementById("productsTableBody");
        tableBody.innerHTML = "";

        products.forEach(product => {
            const tr = document.createElement("tr");

            tr.innerHTML = `
                <td class="product-cell">
                    <img src="../assets/default.png" class="thumb-prod">
                    ${product.name}
                </td>
                <td class="price-cell">R$${formatPrice(product.price)}</td>
                <td>
                    <span class="badge ${getBadgeClass(product.isPerishable)}">
                        ${formatType(product.isPerishable)}
                    </span>
                </td>
                <td>${product.category}</td>
                <td>
                    <a href="#" class="edit-link" data-id="${product.id}">
                        Editar
                    </a>
                </td>
            `;

            tableBody.appendChild(tr);
        });

    } catch (error) {
        console.error("Erro:", error);
    }
}

function formatPrice(price) {
    return price.toFixed(2).replace(".", ",");
}

function formatType(isPerishable) {
    return isPerishable ? "Perecível" : "Não Perecível";
}

function getBadgeClass(isPerishable) {
    return isPerishable ? "badge-orange" : "badge-green";
}