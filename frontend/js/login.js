document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btn-login-submit");

    if (btnLogin) {
        btnLogin.addEventListener("click", async (e) => {
            e.preventDefault();
            const emailInput = document.getElementById("email");
            const passwordInput = document.getElementById("password");

            const username = emailInput.value.trim();
            const password = passwordInput.value.trim();

            if (!username || !password) {
                alert("Por favor completa todos los campos");
                return;
            }

            try {
                const res = await fetch("/api/auth/login", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ username, password })
                });

                const data = await res.json();

                if (res.ok) {
                    window.location.href = "perfil.html";
                } else {
                    alert("Error: " + (data.error || "Credenciales incorrectas"));
                }
            } catch (error) {
                console.error("Error de conexión:", error);
                alert("Error de conexión con el servidor");
            }
        });
    }
});