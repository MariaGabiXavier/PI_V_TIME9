const API_URL = "http://localhost:8080";

const lowStockTable = document.getElementById("lowStockTable");
const expirationTable = document.getElementById("expirationTable");
const forecastCards = document.getElementById("forecastCards");

function pegarImagemProduto(nomeProduto) {

    if (!nomeProduto) {
        return "../assets/file.png";
    }

    const nome = nomeProduto.toLowerCase();

    if (
        nome.includes("coca") ||
        nome.includes("guarana") ||
        nome.includes("fanta") ||
        nome.includes("beats") ||
        nome.includes("corote")
    ) {
        return "../assets/categorias_dos_produtos_sched/Bebida.png";
    }

    if (
        nome.includes("doritos") ||
        nome.includes("salgado")
    ) {
        return "../assets/categorias_dos_produtos_sched/Salgadinho.png";
    }

    if (
        nome.includes("brigadeiro") ||
        nome.includes("bolacha") ||
        nome.includes("chocolate") ||
        nome.includes("doce")
    ) {
        return "../assets/categorias_dos_produtos_sched/Doce.png";
    }

    if (
        nome.includes("carne") ||
        nome.includes("frango")
    ) {
        return "../assets/categorias_dos_produtos_sched/Carne.png";
    }

    if (
        nome.includes("alface") ||
        nome.includes("tomate")
    ) {
        return "../assets/categorias_dos_produtos_sched/Vegetal.png";
    }

    return "../assets/categorias_dos_produtos_sched/Outros.png";
}

async function carregarEstoqueBaixo() {

    try {

        const token = localStorage.getItem("token");

        const [alertResponse, stockResponse] = await Promise.all([

            fetch(`${API_URL}/alert/low-stock`, {
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

        const alertas = await alertResponse.json();
        const estoque = await stockResponse.json();

        console.log("ALERTAS:", alertas);
        console.log("ESTOQUE:", estoque);

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

            let estoqueRecomendado = estoqueAtual + 10;

            if (estoqueAtual <= 2) {

                estoqueRecomendado = estoqueAtual + 20;

            } else if (estoqueAtual <= 5) {

                estoqueRecomendado = estoqueAtual + 15;

            }

            const imagemProduto =
                pegarImagemProduto(nomeProduto);

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

            const imagemProduto =
                pegarImagemProduto(produto.nomeProduto);

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

        const [productResponse, stockResponse] = await Promise.all([

            fetch(`${API_URL}/product`, {
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

        if (!productResponse.ok || !stockResponse.ok) {

            console.log("Erro API");
            return;

        }

        const produtos = await productResponse.json();
        const estoque = await stockResponse.json();

        const listaProdutos = Array.isArray(produtos)
            ? produtos
            : produtos.content || [];

        forecastCards.innerHTML = "";

        if (!listaProdutos.length) {
            return;
        }

        const produtosAlta = listaProdutos
            .sort((a, b) => {

                const vendasA =
                    a.totalSold ||
                    a.totalSales ||
                    a.soldQuantity ||
                    0;

                const vendasB =
                    b.totalSold ||
                    b.totalSales ||
                    b.soldQuantity ||
                    0;

                return vendasB - vendasA;

            })
            .slice(0, 6);

        produtosAlta.forEach(produto => {

            const nomeProduto =
                produto.name ||
                produto.productName ||
                produto.nome ||
                produto.product?.name ||
                "Produto";

            const produtoEstoque = estoque.find(item =>
                item.productName === nomeProduto
            );

            const estoqueAtual =
                produtoEstoque?.availableQuantity || 0;

            const totalVendido =
                produto.totalSold ||
                produto.totalSales ||
                produto.soldQuantity ||
                produto.salesQuantity ||
                produto.vendido ||
                0;

            const previsaoIA = totalVendido;

            const sugestao =
                previsaoIA > estoqueAtual
                    ? previsaoIA - estoqueAtual
                    : 0;

            const imagemProduto =
                pegarImagemProduto(nomeProduto);

            forecastCards.innerHTML += `

                <div class="forecast-alert-card">

                    <div class="forecast-left">

                        <img
                            src="${imagemProduto}"
                            alt="${nomeProduto}"
                            onerror="this.src='../assets/file.png'"
                        >

                    </div>

                    <div class="forecast-info">

                        <h4>${nomeProduto}</h4>

                        <div class="forecast-data">

                            <div class="forecast-line">

                                <span>Estoque atual:</span>

                                <strong>${estoqueAtual}</strong>

                            </div>

                            <div class="forecast-previsao-row">

                                <span class="forecast-label">
                                    Previsão
                                </span>

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
                                    ${previsaoIA}
                                </strong>

                            </div>

                        </div>

                        <div class="forecast-suggestion">
                            +${sugestao} recomendadas
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

    const card =
        select.closest(".forecast-alert-card");

    const numero =
        card.querySelector(".forecast-previsao-number");

    let valor = 0;

    if (select.value == "7") {
        valor = 20;
    }

    else if (select.value == "15") {
        valor = 45;
    }

    else {
        valor = 90;
    }

    numero.innerText = valor;

}

carregarEstoqueBaixo();
carregarValidades();
carregarPrevisoes();
