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

    const btnHistory = document.querySelector(".btn-history");
    if (btnHistory) {
        btnHistory.addEventListener("click", () => {
            window.location.href = "historico_vendas.html";
        });
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

function formatPrice(price) {
    return price.toFixed(2).replace(".", ",");
}

function formatType(isPerishable) {
    return isPerishable ? "Perecível" : "Não Perecível";
}

function getBadgeClass(isPerishable) {
    return isPerishable ? "badge-orange" : "badge-green";
}

async function updateProduct() {
    const idParaEditar = window.idProdutoSendoEditado;

    if (!idParaEditar) {
        showAlert('error', 'ERRO', 'Nenhum produto selecionado para edição.');
        return;
    }

    const name = document.getElementById("edit-input-nome").value.trim();
    const priceRaw = document.getElementById("edit-input-preco").value.trim();
    const category = document.getElementById("edit-input-categoria").value;
    const statusText = document.getElementById("edit-input-status").value;

    if (!name || !priceRaw || !category) {
        showAlert('warning', 'CAMPOS OBRIGATÓRIOS', 'Preencha todos os campos antes de salvar.');
        return;
    }

    const price = parseFloat(priceRaw.replace(/[R$\s]/g, "").replace(",", "."));

    if (isNaN(price)) {
        showAlert('error', 'VALOR INVÁLIDO', 'Digite um preço válido.');
        return;
    }

    const precoOriginal = parseFloat(window.dadosOriginais.preco.replace(",", "."));
    
    if (
        name === window.dadosOriginais.nome &&
        price === precoOriginal &&
        category === window.dadosOriginais.categoria &&
        statusText === window.dadosOriginais.status
    ) {
        showAlert('warning', 'SEM ALTERAÇÕES', 'Você não modificou nenhum dado deste produto.');
        return; 
    }

    const productData = {
        name: name,
        category: category,
        price: price,
        unitOfMeasure: "UNIDADES", 
        isPerishable: statusText === "Perecível"
    };

    try {
        const token = localStorage.getItem("token");

        const response = await fetch(`http://localhost:8080/product/${idParaEditar}`, {
            method: "PUT",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            },
            body: JSON.stringify(productData)
        });

        if (response.ok) {
            showAlert('success', 'SUCESSO', 'Produto atualizado com sucesso!');

            document.getElementById("modalEditOverlay").style.display = "none";

            await loadProducts();

        } else {
            const result = await response.json().catch(() => ({}));
            showAlert('error', 'ERRO AO SALVAR', result.message || 'Verifique os dados e tente novamente.');
            console.log("ERRO BACKEND:", result); 
        }

    } catch (error) {
        console.error(error);
        showAlert('error', 'SEM CONEXÃO', 'O servidor não respondeu.');
    }
}