const API_URL = "http://localhost:8080";

const lowStockTable = document.getElementById("lowStockTable");
const expirationTable = document.getElementById("expirationTable");
const forecastCards = document.getElementById("forecastCards");

function pegarImagemProduto(categoria) {

    if (!categoria) {
        return "../assets/categorias_dos_produtos_sched/Outros.png";
    }

    return `../assets/categorias_dos_produtos_sched/${categoria}.png`;
}

async function carregarEstoqueBaixo() {

    try {

        const token = localStorage.getItem("token");

        const [alertResponse, stockResponse, predictionResponse] = await Promise.all([

            fetch(`${API_URL}/alert/low-stock`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),

            fetch(`${API_URL}/stock/filterProduct`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),

            fetch(`${API_URL}/ai/predictions`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

        ]);

        const alertas = await alertResponse.json();
        const estoque = await stockResponse.json();
        const previsoes = await predictionResponse.json();

        console.log("ALERTAS:", alertas);
        console.log("ESTOQUE:", estoque);
        console.log("PREVISÕES:", previsoes);

        lowStockTable.innerHTML = "";

        if (!alertas.length) {

            lowStockTable.innerHTML = `
                <tr>
                    <td colspan="3">
                        Nenhum produto com estoque baixo.
                    </td>
                </tr>
            `;

            return;
        }

        alertas.forEach(alerta => {

            const nomeProduto =
                alerta.productName ||
                alerta.name ||
                alerta.nome ||
                alerta.product?.name;

            const produtoEstoque = estoque.find(item =>
                item.productName === nomeProduto
            );

            if (!produtoEstoque) return;

            const estoqueAtual =
                produtoEstoque.availableQuantity || 0;

            const unidadeMedida =
                produtoEstoque.unitOfMeasure || "Unidades";

            // Procura a previsão da IA para o mesmo produto
            const previsaoProduto = previsoes.find(p =>
                (p.productName || "").trim().toLowerCase() ===
                (nomeProduto || "").trim().toLowerCase()
            );

            // Usa o mesmo valor mostrado no card de previsão
            const estoqueRecomendado =
                previsaoProduto?.recommendedRestock || 0;

            const imagemProduto =
                pegarImagemProduto(
                    produtoEstoque.productCategory
                );

            lowStockTable.innerHTML += `
                <tr>

                    <td>
                        <div class="product-cell">

                            <img
                                src="${imagemProduto}"
                                alt="${nomeProduto}"
                                onerror="this.src='../assets/file.png'"
                            >

                            <span>${nomeProduto}</span>

                        </div>
                    </td>

                    <td class="low-stock">
                        ${estoqueAtual} ${unidadeMedida}
                    </td>

                    <td>
                        ${estoqueRecomendado} ${unidadeMedida}
                    </td>

                </tr>
            `;

        });

    } catch(error) {

        console.log("Erro estoque baixo:", error);

    }

}

async function carregarValidades() {

    try {

        const token = localStorage.getItem("token");

        const [validadeResponse, estoqueResponse] = await Promise.all([

            fetch(`${API_URL}/alert/expiring`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),

            fetch(`${API_URL}/stock/filterProduct`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

        ]);

        const produtos = await validadeResponse.json();
        const estoque = await estoqueResponse.json();

        console.log("API VALIDADES:", produtos);
        console.log("API ESTOQUE:", estoque);

        expirationTable.innerHTML = "";

        if (!produtos.length) {

            expirationTable.innerHTML = `
                <tr>
                    <td colspan="4">
                        Nenhum produto próximo da validade.
                    </td>
                </tr>
            `;

            return;
        }

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const produtosAgrupados = [];

        produtos.forEach(produto => {

            const nomeProduto =
                produto.productName ||
                produto.name ||
                produto.nome ||
                produto.product?.name ||
                "Produto";

            const dataValidade =
                produto.expirationDate ||
                produto.validade;

            if (!dataValidade) return;

            const quantidade =
                produto.quantity ||
                produto.quantidade ||
                produto.quantidadeLote ||
                0;

            if (quantidade <= 0) return;

            const produtoEstoque = estoque.find(item =>
                item.productName === nomeProduto
            );

            const unidadeMedida =
                produtoEstoque?.unitOfMeasure ||
                "Unidades";

            const chave = `${nomeProduto}_${dataValidade}`;

            const existente = produtosAgrupados.find(
                p => p.chave === chave
            );

            if (existente) {

                existente.quantidade += quantidade;

            } else {

                produtosAgrupados.push({
                    chave,
                    nomeProduto,
                    dataValidade,
                    quantidade,
                    unidadeMedida
                });

            }

        });

        produtosAgrupados.sort((a, b) => {

            const validadeA = new Date(a.dataValidade);
            const validadeB = new Date(b.dataValidade);

            validadeA.setHours(0, 0, 0, 0);
            validadeB.setHours(0, 0, 0, 0);

            const diferencaA = Math.ceil(
                (validadeA - hoje) / (1000 * 60 * 60 * 24)
            );

            const diferencaB = Math.ceil(
                (validadeB - hoje) / (1000 * 60 * 60 * 24)
            );

            function prioridade(diferenca) {

                if (diferenca <= 0) return 1;

                if (diferenca <= 3) return 2;

                return 3;

            }

            const prioridadeA = prioridade(diferencaA);
            const prioridadeB = prioridade(diferencaB);

            if (prioridadeA !== prioridadeB) {

                return prioridadeA - prioridadeB;

            }

            return validadeA - validadeB;

        });

        produtosAgrupados.forEach(produto => {

            const validade = new Date(produto.dataValidade);

            validade.setHours(0, 0, 0, 0);

            const diferenca = Math.ceil(
                (validade - hoje) / (1000 * 60 * 60 * 24)
            );

            let status = "Atenção";
            let statusClass = "yellow";

            if (diferenca <= 0) {

                status = "Vencido";
                statusClass = "red";

            } else if (diferenca <= 3) {

                status = "A vencer";
                statusClass = "orange";

            }

            const produtoEstoque = estoque.find(item =>
                item.productName === produto.nomeProduto
            );

            const imagemProduto =
                pegarImagemProduto(
                    produtoEstoque?.productCategory
                );

            expirationTable.innerHTML += `

                <tr>

                    <td>
                        <div class="product-cell">

                            <img 
                                src="${imagemProduto}" 
                                alt="${produto.nomeProduto}"
                                onerror="this.src='../assets/file.png'"
                            >

                            <span>${produto.nomeProduto}</span>

                        </div>
                    </td>

                    <td>
                        ${validade.toLocaleDateString("pt-BR")}
                    </td>

                    <td>
                        ${produto.quantidade} ${produto.unidadeMedida}
                    </td>

                    <td>
                        <div class="status ${statusClass}">
                            ${status}
                        </div>
                    </td>

                </tr>

            `;

        });

    } catch(error) {

        console.log("Erro validade:", error);

    }

}


async function carregarPrevisoes() {

    try {

        const token = localStorage.getItem("token");

        const [response, estoqueResponse] = await Promise.all([

            fetch(`${API_URL}/ai/predictions`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            }),

            fetch(`${API_URL}/stock/filterProduct`, {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            })

        ]);

        if (!response.ok) {
            console.log("Erro ao buscar previsões da IA");
            return;
        }

        const previsoes = await response.json();
        const estoque = await estoqueResponse.json();

        console.log("PREVISÕES IA:", previsoes);

        forecastCards.innerHTML = "";

        // filtra o alerta do produto
        const comAlerta = previsoes.filter(p =>
            p.alert === "ATENCAO" || p.alert === "URGENTE"
        );

        if (!comAlerta.length) {
            forecastCards.innerHTML = `
                <p style="color:#9ca3af; font-size:13px;">
                    Nenhum produto com alerta de demanda no momento.
                </p>
            `;
            return;
        }

        comAlerta.forEach(produto => {

            const produtoEstoque = estoque.find(item =>
                item.productName === produto.productName
            );

            const imagemProduto =
                pegarImagemProduto(
                    produtoEstoque?.productCategory
                );

            const corAlerta = produto.alert === "URGENTE" ? "#ef4444" : "#f59e0b";
            const labelAlerta = produto.alert === "URGENTE" ? "Urgente" : "Atenção";

            forecastCards.innerHTML += `

                <div class="forecast-alert-card"
                     data-p7="${produto.prediction7Days}"
                     data-p15="${produto.prediction15Days}"
                     data-p30="${produto.prediction30Days}"
                     data-restock="${produto.recommendedRestock}">

                    <div class="forecast-left">
                        <img
                            src="${imagemProduto}"
                            alt="${produto.productName}"
                            onerror="this.src='../assets/file.png'"
                        >
                    </div>

                    <div class="forecast-info">

                        <div style="display:flex; align-items:center; gap:8px;">
                            <h4>${produto.productName}</h4>
                            <span style="
                                background:${corAlerta};
                                color:white;
                                font-size:10px;
                                font-weight:700;
                                padding:2px 8px;
                                border-radius:999px;
                            ">${labelAlerta}</span>
                        </div>

                        <div class="forecast-data">

                            <div class="forecast-line">
                                <span>Estoque atual:</span>
                                <strong>${produto.stockQuantity}</strong>
                            </div>

                            <div class="forecast-previsao-row">

                                <span class="forecast-label">Previsão</span>

                                <select
                                    class="forecast-select"
                                    onchange="alterarPeriodoSelect(this)"
                                >
                                    <option value="7">7 dias</option>
                                    <option value="15">15 dias</option>
                                    <option value="30" selected>30 dias</option>
                                </select>

                                <span class="forecast-separator">:</span>

                                <strong class="forecast-previsao-number">
                                    ${produto.prediction30Days}
                                </strong>

                            </div>

                        </div>

                        <div class="forecast-suggestion">
                            +${produto.recommendedRestock} recomendadas
                        </div>

                        <button
                            class="forecast-stock-btn"
                            onclick="window.location.href='estoque.html'"
                        >
                            Ver estoque
                        </button>

                    </div>

                </div>

            `;

        });

    } catch(error) {

        console.log("Erro previsões:", error);

    }
}

function alterarPeriodoSelect(select) {

    const card = select.closest(".forecast-alert-card");
    const numero = card.querySelector(".forecast-previsao-number");

    if (select.value == "7") {
        numero.innerText = card.dataset.p7;
    } else if (select.value == "15") {
        numero.innerText = card.dataset.p15;
    } else {
        numero.innerText = card.dataset.p30;
    }

}

// ==============================
// BUSCA DE ALERTAS
// ==============================

function normalizar(texto) {
    return (texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
}

function filtrarAlertas() {

    const termo = normalizar(
        document.querySelector(".search-input-alert").value
    );

    // Cards de previsão
    document.querySelectorAll(".forecast-alert-card").forEach(card => {

        const nome = normalizar(
            card.querySelector("h4")?.textContent
        );

        card.style.display =
            nome.includes(termo) ? "flex" : "none";
    });

    // Tabela estoque baixo
    document.querySelectorAll("#lowStockTable tr").forEach(row => {

        const texto = normalizar(row.innerText);

        row.style.display =
            texto.includes(termo) ? "" : "none";
    });

    // Tabela validade
    document.querySelectorAll("#expirationTable tr").forEach(row => {

        const texto = normalizar(row.innerText);

        row.style.display =
            texto.includes(termo) ? "" : "none";
    });
}

document.addEventListener("DOMContentLoaded", () => {

    const campoBusca =
        document.querySelector(".search-input-alert");

    if (campoBusca) {

        campoBusca.addEventListener(
            "input",
            filtrarAlertas
        );
    }
});

carregarEstoqueBaixo();
carregarValidades();
carregarPrevisoes();
