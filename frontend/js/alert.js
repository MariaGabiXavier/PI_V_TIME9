function showAlert(tipo, titulo, mensagem) {
    const container = document.getElementById("alert-container");
    if (!container) return; 

    const alertDiv = document.createElement("div");
    alertDiv.className = `alert alert--${tipo}`;

    alertDiv.innerHTML = `
        <div class="alert__icon">
            ${getIcon(tipo)}
        </div>
        <div class="alert__content">
            <span class="alert__title">${titulo}</span>
            <span class="alert__message">${mensagem}</span>
        </div>
        <button class="alert__close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(alertDiv);

    // Remove automaticamente após 4 segundos
    setTimeout(() => {
        alertDiv.style.opacity = "0";
        alertDiv.style.transition = "opacity 0.5s";
        setTimeout(() => alertDiv.remove(), 500);
    }, 4000);
}

// Função auxiliar para pegar o ícone certo
function getIcon(tipo) {
    const path = "../assets/ic_alerts/";
    
    const icons = {
        success: `<img src="${path}ic_success.svg" alt="Sucesso" width="24">`,
        warning: `<img src="${path}ic_warning.svg" alt="Aviso" width="24">`,
        error:   `<img src="${path}ic_error.svg" alt="Erro" width="24">`,
        info:    `<img src="${path}ic_info.svg" alt="Info" width="24">`
    };

    return icons[tipo] || '';
}