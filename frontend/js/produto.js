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

    document.getElementById("btnSaveEdit").addEventListener("click", updateProduct);
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
            // showAlert('success', 'SUCESSO!', 'usuario valido!!!');
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
                        <img src="../assets/categorias_dos_produtos_sched/${product.category}.png" class="thumb-prod">
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
        const isPerishable = document.getElementById("productType").value === "true";

        // transforma "25,50" → 25.50
        const price = parseFloat(priceRaw.replace(",", "."));

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

async function updateProduct() {
    const idParaEditar = window.idProdutoSendoEditado;

    if (!idParaEditar) {
        showAlert('error', 'ERRO', 'Nenhum produto selecionado para edição.');
        return;
    }

    try {
        const token = localStorage.getItem("token");

        const name = document.getElementById("edit-input-nome").value.trim();
        const priceRaw = document.getElementById("edit-input-preco").value.trim();
        const category = document.getElementById("edit-input-categoria").value;
        const statusText = document.getElementById("edit-input-status").value;

        if (!name || !priceRaw || !category) {
            showAlert('warning', 'CAMPOS OBRIGATÓRIOS', 'Preencha todos os campos.');
            return;
        }

        const price = parseFloat(
            priceRaw.replace(/[R$\s]/g, "").replace(",", ".")
        );

        if (isNaN(price)) {
            showAlert('error', 'VALOR INVÁLIDO', 'Digite um preço válido.');
            return;
        }

        const productData = {
            name: name,
            category: category,
            price: price,
            unitOfMeasure: "UNIDADES", 
            isPerishable: statusText === "Perecível"
        };

        const response = await fetch(`http://localhost:8080/product/${idParaEditar}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            showAlert('success', 'SUCESSO', 'Produto atualizado!');

            document.getElementById("modalEditOverlay").style.display = "none";

            await loadProducts();

        } else {
            const result = await response.json().catch(() => ({}));

            showAlert(
                'error',
                'ERRO',
                result.message || JSON.stringify(result)
            );

            console.log("ERRO BACKEND:", result); 
        }

    } catch (error) {
        console.error(error);
        showAlert('error', 'SEM CONEXÃO', 'Servidor não respondeu.');
    }
}