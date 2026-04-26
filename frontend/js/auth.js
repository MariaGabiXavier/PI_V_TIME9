document.addEventListener("DOMContentLoaded", async () => {
    const valid = await validateToken();

    if (!valid) {
        logout();
    }
});

async function validateToken() {
    const token = localStorage.getItem("token");

    if (!token) return false;

    try {
        const response = await fetch("http://localhost:8080/user/me", {
            headers: {
                "Authorization": "Bearer " + token
            }
        });

        return response.ok;

    } catch (error) {
        return false;
    }
}

function logout() {
    localStorage.removeItem("token");
    localStorage.removeItem("userEmail");
    window.location.href = "login.html";
}