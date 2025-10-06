<template>
  <div id="app">
    <!-- Cabecera -->
    <header class="app-header">
      <div class="header-left">
        <h1>Lic. Valeria Cravero</h1>
      </div>

      <!-- Botón hamburguesa animado -->
      <button class="menu-toggle" @click="menuAbierto = !menuAbierto" :class="{ abierto: menuAbierto }">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <!-- Menú con transición -->
      <transition name="slide-fade">
        <nav v-if="menuAbierto || pantallaGrande" class="header-right">
          <router-link @click="cerrarMenu" to="/">Registrarse</router-link>
          <router-link @click="cerrarMenu" to="/turnos">Turnos</router-link>
          <router-link @click="cerrarMenu" to="/acerca">Acerca de mí</router-link>
          <router-link @click="cerrarMenu" to="/admin">Admin</router-link>
        </nav>
      </transition>
    </header>

    <!-- Contenido dinámico -->
    <main>
      <router-view />
    </main>
  </div>
</template>

<script>
export default {
  name: "App",
  data() {
    return {
      menuAbierto: false,
      pantallaGrande: window.innerWidth > 768,
    };
  },
  mounted() {
    window.addEventListener("resize", this.detectarPantalla);
  },
  beforeUnmount() {
    window.removeEventListener("resize", this.detectarPantalla);
  },
  methods: {
    cerrarMenu() {
      if (!this.pantallaGrande) {
        this.menuAbierto = false;
      }
    },
    detectarPantalla() {
      this.pantallaGrande = window.innerWidth > 768;
      if (this.pantallaGrande) {
        this.menuAbierto = false;
      }
    },
  },
};
</script>

<style>
/* Estilo general del header */
.app-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #f4b400;
  color: white;
  padding: 10px 20px;
  position: sticky;
  top: 0;
  z-index: 1000;
}

.header-left h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
}

/* ---------------- Botón hamburguesa animado ---------------- */
.menu-toggle {
  display: none;
  flex-direction: column;
  justify-content: space-between;
  width: 28px;
  height: 22px;
  background: none;
  border: none;
  cursor: pointer;
  z-index: 1100;
}

.menu-toggle span {
  display: block;
  height: 3px;
  width: 100%;
  background: white;
  border-radius: 2px;
  transition: all 0.3s ease;
}

/* Estado animado (X) */
.menu-toggle.abierto span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}
.menu-toggle.abierto span:nth-child(2) {
  opacity: 0;
}
.menu-toggle.abierto span:nth-child(3) {
  transform: rotate(-45deg) translate(5px, -5px);
}

/* Navegación escritorio */
.header-right {
  display: flex;
  gap: 20px;
}

.header-right a {
  text-decoration: none;
  color: white;
  font-weight: 500;
  transition: border-bottom 0.3s, color 0.3s;
}

.header-right a.router-link-exact-active {
  border-bottom: 2px solid white;
  padding-bottom: 2px;
  font-weight: bold;
}

/* ---------------- Responsividad ---------------- */
@media (max-width: 768px) {
  .menu-toggle {
    display: flex;
  }

  .header-right {
    flex-direction: column;
    align-items: flex-start;
    background-color: #f4b400;
    width: 200px;
    padding: 10px;
  }

  .header-right a {
    padding: 10px;
    width: 100%;
  }
}

/* ---------------- Animaciones menú ---------------- */
.slide-fade-enter-active,
.slide-fade-leave-active {
  transition: all 0.3s ease;
}
.slide-fade-enter-from,
.slide-fade-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}
</style>

