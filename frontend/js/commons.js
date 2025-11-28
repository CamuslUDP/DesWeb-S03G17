document.addEventListener("DOMContentLoaded", () => {
    // === Lógica de navegación en index.html ===

    // 1. Botón para Iniciar Sesión (de index.html a login.html)
    const btnLoginIndex = document.querySelector(".btn-iniciar-sesion");
    if (btnLoginIndex) {
        btnLoginIndex.addEventListener("click", () => {
            // Usamos location.href para navegar
            location.href = 'login.html';
        });
    }

    // 2. Botón para Registrarse (de index.html a registro.html)
    const btnRegisterIndex = document.querySelector(".btn-registrarse");
    if (btnRegisterIndex) {
        btnRegisterIndex.addEventListener("click", () => {
            location.href = 'registro.html';
        });
    }

    // === Lógica de navegación en login.html ===
    
    // 3. Botón de Iniciar Sesión (de login.html a perfil.html)
    // Usamos el ID que le pusimos arriba: #btn-login-submit
    const btnLoginSubmit = document.getElementById("btn-login-submit");
    if (btnLoginSubmit) {
        btnLoginSubmit.addEventListener("click", () => {
            // NOTA: Esta es una SIMULACIÓN.
            // En la Entrega 3 REAL, aquí iría la llamada a la API POST /api/auth/login.
            location.href = 'perfil.html';
        });
    }
});