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

    const modal = document.getElementById("employeeModal");

    document.getElementById("btnOpen").addEventListener("click", () => {
        modal.style.display = "flex";
    });

    document.getElementById("btnCancelModal").addEventListener("click", () => {
        modal.style.display = "none";
    });

    window.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";
        }
    });

    document.getElementById("employeeForm").addEventListener("submit", async (e) => {
        e.preventDefault();

        const name = document.getElementById("empName").value.trim();
        const email = document.getElementById("empEmail").value.trim();
        const password = document.getElementById("empPassword").value.trim();

        if (!name || !email || !password) {
            showAlert('warning', 'CAMPOS OBRIGATÓRIOS', 'Preencha todos os campos!');
            return;
        }

        try {
            const token = localStorage.getItem("token");

            const response = await fetch("http://localhost:8080/user", {
                method: "POST",
                headers: {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    name,
                    email,
                    password,
                    role: "EMPLOYEE" 
                })
            });

            if (response.ok) {
                showAlert('success', 'SUCESSO', 'Funcionário cadastrado!');

                modal.style.display = "none";
                e.target.reset();

                await loadEmployees(); 
            } else {
                const err = await response.json();
                showAlert('error', 'ERRO', err.message);
            }

        } catch (error) {
            showAlert('error', 'ERRO', 'Falha na conexão com servidor');
        }
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
        showAlert('error', 'ERRO', 'Não foi possível carregar os funcionários.');
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

                <span class="badge ${user.role === 'ADMIN' ? 'admin' : 'user'}">
                    ${user.role === 'ADMIN' ? 'ADMIN' : 'FUNCIONÁRIO'}
                </span>

                <div class="actions">
                    <button class="edit">
                        <img src="../assets/ic_ui/ic_pencil.svg">
                        <span>Editar</span>
                    </button>

                    <button class="delete">
                        <img src="../assets/ic_ui/ic_trash.svg">
                        <span>Excluir</span>
                    </button>
                </div>
            </div>
        `;
    });
}