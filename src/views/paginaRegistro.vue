<template>
  <div class="login-container">
    <h1>Registro de Usuario</h1>

    <!-- Campo Nombre -->
    <label for="nombre">Nombre:</label>
    <input
      id="nombre"
      v-model="nombre"
      type="text"
      placeholder="Ingrese su nombre"
      @input="soloLetras('nombre')"
    />

    <!-- Campo Apellido -->
    <label for="apellido">Apellido:</label>
    <input
      id="apellido"
      v-model="apellido"
      type="text"
      placeholder="Ingrese su apellido"
      @input="soloLetras('apellido')"
    />

    <!-- Campo Email -->
    <label for="email">Correo electrónico:</label>
    <input
      id="email"
      v-model="email"
      type="email"
      placeholder="Ingrese su correo"
    />

    <!-- Contraseña generada -->
    <label for="password">Contraseña generada:</label>
    <input id="password" type="text" v-model="password" readonly />

    <!-- Botón para generar -->
    <button
      @click="generarPassword"
      :disabled="!nombre || !apellido || !email"
      class="btn-primary"
    >
      Generar Contraseña
    </button>

    <!-- Botón para registrar -->
    <button
      @click="registrarUsuario"
      :disabled="cargando || !password"
      class="btn-primary"
    >
      {{ cargando ? "Registrando..." : "Registrarse" }}
    </button>

    <!-- Botón para recuperar contraseña -->
    <button @click="mostrarModal = true" class="btn-link">Olvidé mi contraseña</button>

    <!-- Mensaje de estado inline (por compatibilidad) -->
    <p v-if="mensaje" :style="{ color: error ? 'red' : 'green' }">{{ mensaje }}</p>

    <!-- Modal Recuperación -->
    <div v-if="mostrarModal" class="modal-overlay">
      <div class="modal">
        <h2>Recuperar Contraseña</h2>
        <label for="recuperoEmail">Ingrese su correo:</label>
        <input
          id="recuperoEmail"
          type="email"
          v-model="recuperoEmail"
          placeholder="ejemplo@correo.com"
        />
        <div class="modal-actions">
          <button @click="recuperarPassword" class="btn-primary">Enviar</button>
          <button @click="cerrarModal" class="btn-secondary">Cancelar</button>
        </div>
        <p v-if="mensajeRecupero" :style="{ color: errorRecupero ? 'red' : 'green' }">
          {{ mensajeRecupero }}
        </p>
      </div>
    </div>

    <!-- Alerta visual tipo toast -->
    <div v-if="toast.visible" :class="['toast', toast.error ? 'error' : 'success']">
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import apiAxios from "@/api/apiAxios";
import emailjs from "emailjs-com";

export default {
  name: "paginaRegistro",
  data() {
    return {
      nombre: "",
      apellido: "",
      email: "",
      password: "",
      mensaje: "",
      cargando: false,
      error: false,

      // Recuperación
      mostrarModal: false,
      recuperoEmail: "",
      mensajeRecupero: "",
      errorRecupero: false,

      // Toast
      toast: {
        visible: false,
        message: "",
        error: false,
      },
    };
  },
  methods: {
    mostrarToast(mensaje, error = false) {
      this.toast.message = mensaje;
      this.toast.error = error;
      this.toast.visible = true;
      setTimeout(() => {
        this.toast.visible = false;
      }, 3000);
    },

    soloLetras(campo) {
      this[campo] = this[campo].replace(/[^a-zA-ZÁÉÍÓÚáéíóúñÑ\s]/g, "");
    },
    generarPassword() {
      this.password = Math.random().toString(36).slice(-8);
      this.mostrarToast("🔐 Contraseña generada", false);
    },

    async registrarUsuario() {
      if (!this.nombre || !this.apellido || !this.email || !this.password) {
        this.mensaje = "⚠️ Complete todos los campos y genere la contraseña.";
        this.error = true;
        this.mostrarToast(this.mensaje, true);
        return;
      }

      this.cargando = true;
      this.mensaje = "";

      try {
        // 1️⃣ Verificar si el email ya existe
        const resCheck = await apiAxios.get(`/usuarios?q={"email":"${this.email}"}`);
        if (resCheck.data && resCheck.data.length > 0) {
          this.mensaje = "❌ Este correo ya está registrado.";
          this.error = true;
          this.mostrarToast(this.mensaje, true);
          return;
        }

        // 2️⃣ Registrar si no existe
        const payload = {
          Nombre: this.nombre,
          Apellido: this.apellido,
          email: this.email,
          password: this.password,
          createdAt: new Date().toISOString(),
        };

        await apiAxios.post("/usuarios", payload);

        this.mensaje = "✅ Usuario registrado con éxito.";
        this.error = false;
        this.mostrarToast(this.mensaje, false);

        // Limpiar
        this.nombre = "";
        this.apellido = "";
        this.email = "";
        this.password = "";
      } catch (err) {
        console.error("[ERR registrarUsuario]", err);
        this.mensaje = "❌ Error al registrar el usuario.";
        this.error = true;
        this.mostrarToast(this.mensaje, true);
      } finally {
        this.cargando = false;
      }
    },

    // 👉 Recuperar contraseña
    async recuperarPassword() {
      if (!this.recuperoEmail) {
        this.mensajeRecupero = "⚠️ Ingrese un correo válido.";
        this.errorRecupero = true;
        this.mostrarToast(this.mensajeRecupero, true);
        return;
      }

      try {
        // Buscar usuario por email
        const res = await apiAxios.get(`/usuarios?q={"email":"${this.recuperoEmail}"}`);
        const usuarios = res.data;

        if (!usuarios || usuarios.length === 0) {
          this.mensajeRecupero = "❌ No se encontró un usuario con ese correo.";
          this.errorRecupero = true;
          this.mostrarToast(this.mensajeRecupero, true);
          return;
        }

        const user = usuarios[0];

        // Enviar por EmailJS (asegurate de tener los IDs y public key correctos)
        const templateParams = {
          to_name: `${user.Nombre} ${user.Apellido}`,
          to_email: user.email,
          password: user.password,
        };

        await emailjs.send(
          "gmail_service", // SERVICE_ID (reemplazar si corresponde)
          "template_vptbh09", // TEMPLATE_ID (reemplazar si corresponde)
          templateParams,
          "loP4A_-R3dHLI_Mjr" // PUBLIC_KEY (reemplazar si corresponde)
        );

        this.mensajeRecupero = "✅ Se envió la contraseña a su correo.";
        this.errorRecupero = false;
        this.mostrarToast(this.mensajeRecupero, false);
        this.recuperoEmail = "";
        this.mostrarModal = false;
      } catch (err) {
        console.error("Error en recuperación:", err);
        this.mensajeRecupero = "❌ Error al recuperar la contraseña.";
        this.errorRecupero = true;
        this.mostrarToast(this.mensajeRecupero, true);
      }
    },

    cerrarModal() {
      this.mostrarModal = false;
      this.recuperoEmail = "";
      this.mensajeRecupero = "";
      this.errorRecupero = false;
    },
  },
};
</script>

<style scoped>
.login-container {
  max-width: 400px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
}
h1 {
  text-align: center;
  margin-bottom: 8px;
}
label {
  display: block;
  margin-top: 10px;
  font-weight: 600;
}
input {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

/* Botones: mismos estilos que paginaTurnos */
.btn-primary {
  display: inline-block;
  margin-top: 12px;
  padding: 10px 14px;
  cursor: pointer;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
}
.btn-primary[disabled],
.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.btn-primary:hover:not([disabled]) {
  background: #155fa0;
}

.btn-secondary {
  display: inline-block;
  margin-top: 12px;
  padding: 10px 14px;
  cursor: pointer;
  background: #777;
  color: white;
  border: none;
  border-radius: 4px;
}
.btn-secondary:hover {
  background: #5e5e5e;
}

/* Link estilo igual que antes */
.btn-link {
  background: none;
  border: none;
  color: #1976d2;
  text-decoration: underline;
  cursor: pointer;
  margin-top: 10px;
  padding: 0;
}

/* Mensajes */
p {
  margin-top: 10px;
  font-weight: bold;
}

/* Modal */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;
}
.modal {
  background: white;
  padding: 20px;
  border-radius: 6px;
  width: 350px;
  text-align: center;
}
.modal-actions {
  margin-top: 15px;
  display: flex;
  justify-content: space-around;
}

/* Toast (mismo estilo que paginaTurnos) */
.toast {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  padding: 12px 18px;
  border-radius: 8px;
  color: #fff;
  font-weight: 600;
  z-index: 9999;
  box-shadow: 0 4px 12px rgba(0,0,0,0.12);
  animation: toastInOut 3s ease-in-out;
}
.toast.success {
  background-color: #4caf50;
}
.toast.error {
  background-color: #f44336;
}
@keyframes toastInOut {
  0% { opacity: 0; transform: translateX(-50%) translateY(20px); }
  10% { opacity: 1; transform: translateX(-50%) translateY(0); }
  90% { opacity: 1; transform: translateX(-50%) translateY(0); }
  100% { opacity: 0; transform: translateX(-50%) translateY(20px); }
}

/* Responsive */
@media (max-width: 480px) {
  .login-container { padding: 14px; }
  .modal { width: 90%; }
}
</style>
