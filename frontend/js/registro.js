document.addEventListener("DOMContentLoaded", () => {
    const btnRegister = document.getElementById("btn-create-account"); // Asegúrate de que tu botón tenga este ID o usa la clase
    // En tu HTML actual usas una clase .btn-create dentro de un <a>. 
    // Vamos a asumir que cambiaste el <a> por un <button id="btn-register-submit"> como recomendé antes.
    const submitBtn = document.getElementById("btn-register-submit") || document.querySelector(".btn-create");

    if (submitBtn) {
        submitBtn.addEventListener("click", async (e) => {
            e.preventDefault();

            // Obtener valores
            const fullName = document.getElementById("name").value.trim();
            const username = document.getElementById("username").value.trim();
            const email = document.getElementById("email").value.trim();
            const password = document.getElementById("password").value;
            const confirmPass = document.getElementById("confirm-password").value;
            
            // Fecha
            const day = document.getElementById("dob-day").value;
            const month = document.getElementById("dob-month").value;
            const year = document.getElementById("dob-year").value;

            // Checkbox
            const terms = document.getElementById("responsibility-consent").checked;

            // Validaciones Frontend
            if (!fullName || !username || !email || !password) return alert("Completa los campos obligatorios");
            if (!terms) return alert("Debes aceptar las condiciones de uso");
            if (password !== confirmPass) return alert("Las contraseñas no coinciden");
            if (!day || !month || !year) return alert("Fecha de nacimiento incompleta");

            const birthDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

            try {
                const res = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        fullName,
                        username,
                        email,
                        password,
                        birthDate
                    })
                });

                const data = await res.json();

                if (res.ok) {
                    alert("¡Cuenta creada exitosamente! Ahora puedes iniciar sesión.");
                    window.location.href = "login.html";
                } else {
                    alert("Error: " + (data.error || "No se pudo registrar"));
                }
            } catch (error) {
                console.error(error);
                alert("Error de conexión");
            }
        });
    }
});