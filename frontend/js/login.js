document.addEventListener("DOMContentLoaded", () => {
    const btnLogin = document.getElementById("btn-login-submit");

    if (btnLogin) {
        btnLogin.addEventListener("click", async (e) => {
            e.preventDefault(); // Prevenir envío tradicional si fuera un form submit

            // Nota: En tu HTML el input de usuario tiene id="email" aunque se usa para username.
            // Lo ideal es que en el HTML cambies id="email" por id="username" para evitar confusión,
            // pero aquí mantengo tu ID actual para que funcione con tu HTML existente.
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
                    // Login exitoso, redirigir a perfil
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