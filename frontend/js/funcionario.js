document.addEventListener("DOMContentLoaded", async () => {
    await loadEmployees();

    document.querySelector(".search-input").addEventListener("input", function (e) {
        const termoBusca = e.target.value.toLowerCase();

        const funcionariosFiltrados = allEmployees.filter(user => {
            const nome = user.name.toLowerCase();
            const email = user.email.toLowerCase();

            return nome.includes(termoBusca) || email.includes(termoBusca);
        });

        renderEmployees(funcionariosFiltrados);
    });
});

let allEmployees = [];

async function loadEmployees() {
    const token = localStorage.getItem("token");

    try {
        const response = await fetch("http://localhost:8080/user", {
            method: "GET",
            headers: {
                "Authorization": "Bearer " + token,
                "Content-Type": "application/json"
            }
        });

        const data = await response.json();

        if (response.ok) {
            allEmployees = data;
            renderEmployees(allEmployees);
        }
    } catch (error) {
        showAlert('error', 'ERRO', 'Não foi possível carregar o funcionarios.');
    }
}

function renderEmployees(employees) {
    const table = document.querySelector(".table");

    table.innerHTML = `
        <div class="table-header">
            <span>NOME</span>
            <span>EMAIL</span>
            <span>TIPO DO FUNCIONÁRIO</span>
            <span>AÇÕES</span>
        </div>
    `;

    employees.forEach((user, index) => {
        table.innerHTML += `
            <div class="table-row">
                <div class="user">
                    <img src="https://i.pravatar.cc/40?img=${index + 1}">
                    <span>${user.name}</span>
                </div>

                <span>${user.email}</span>

                <span class="badge ${user.role === 'ADMIN' ? 'admin' : 'employee'}">
                    ${user.role}
                </span>

                <div class="actions">
                    <button class="edit">
                        <img src="../assets/icon_lapis.png" alt="Editar">
                        <span>Editar</span>
                    </button>

                    <button class="delete">
                        <img src="../assets/icon_lixeira.png" alt="Excluir">
                        <span>Excluir</span>
                    </button>
                </div>
            </div>
        `;
    });
}