document.addEventListener("DOMContentLoaded", async () => {

    const token = localStorage.getItem("token");

    if (!token) {
        window.location.href = "login.html";
        return;
    }

    const user = await isValidUser(token);

    if (user) {
        await loadProducts();
    }


    // SE A VALIDACAO ACIMA NAO ESTIVER DANDO CERTO
    // COMENTA ELA TODA -> LINHA 3-14
    // E DEIXA SÓ ESSA LINHA AQUI DE BAIXO -> LINHA 21

    // await loadProducts();
});

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
}

async function isValidUser(token) {
    try {
        const response = await fetch("http://localhost:8080/user/me", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        const result = await response.json();

        if (response.ok) {
            showAlert('success', 'SUCESSO!', 'usuario valido!!!');
            return result;
        } else {
            logout();
            showAlert('error', 'ERRO DE USUARIO', result.message);
            return null;
        }
    } catch (error) {
        showAlert('error', 'SEM CONEXÃO', 'O servidor parece estar desligado.');
        return null;
    }
}

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

        const result = await response.json();

        if (!response.ok) {
            showAlert('error', 'ERRO AO CARREGAR PRODUTOS', result.message);
        } else {
            const products = result;

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
        }
    } catch (error) {
        showAlert('error', 'SEM CONEXÃO', 'O servidor parece estar desligado.');
    }
}

async function saveProduct() {
    try {
        const token = localStorage.getItem("token");

        const name = document.getElementById("productName").value;
        const category = document.getElementById("productCategory").value;
        const priceRaw = document.getElementById("productPrice").value;
        const unitOfMeasure = document.getElementById("unitOfMeasure").value;
        const type = document.getElementById("productType").value;

        // transforma "25,50" → 25.50
        const price = parseFloat(priceRaw.replace(",", "."));

        const isPerishable = type === "perecivel";

        const productData = {
            name,
            category,
            price,
            unitOfMeasure,
            isPerishable
        };

        const response = await fetch("http://localhost:8080/product", {
            method: "POST",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productData)
        });

        const result = await response.json();

        if (!response.ok) {
            showAlert('error', 'ERRO AO CADASTRAR PRODUTO', result.message);
        } else {
            showAlert('success', 'SUCESSO!', 'Produto cadastrado com sucesso!');

            document.getElementById("modalOverlay").style.display = "none";

            clearForm();

            await loadProducts();
        }

    } catch (error) {
        showAlert('error', 'SEM CONEXÃO', 'O servidor parece estar desligado.');
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

document.getElementById("btnSaveProduct").addEventListener("click", saveProduct);

function clearForm() {
    document.getElementById("productName").value = "";
    document.getElementById("productPrice").value = "";
    document.getElementById("unitOfMeasure").selectedIndex = 0;
    document.getElementById("productType").selectedIndex = 0;
    document.getElementById("productCategory").selectedIndex = 0;
}
