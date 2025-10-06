<template>
  <div class="admin-container">
    <h1>Panel de Administración</h1>

    <!-- LOGIN -->
    <div v-if="!admin" class="login-admin">
      <h2>Acceso Administrador</h2>
      <label>Email:</label>
      <input v-model="email" type="email" placeholder="Ingrese email" />

      <label>Contraseña:</label>
      <input v-model="password" type="password" placeholder="Ingrese contraseña" />

      <button @click="loginAdmin" class="btn-primary">Ingresar</button>
      <p v-if="mensaje" :style="{ color: error ? 'red' : 'green' }">{{ mensaje }}</p>
    </div>

    <!-- PANEL ADMIN -->
    <div v-else>
      <h2>Bienvenido/a, {{ admin.Nombre }} {{ admin.Apellido }}</h2>

      <!-- BOTONES PRINCIPALES -->
      <div class="acciones">
        <button @click="mostrarConfig = !mostrarConfig" class="btn-primary">
          ⚙️ Configurar Turnero
        </button>
        <button @click="mostrarReportes = !mostrarReportes" class="btn-primary">
          📊 Ver Reportes
        </button>
        <button class="logout-btn btn-secondary" @click="logout">Cerrar Sesión</button>
      </div>

      <!-- FORM CONFIGURACIÓN -->
      <div v-if="mostrarConfig" class="panel">
        <h3>Configuración del Turnero</h3>

        <!-- RANGOS DE FECHAS -->
        <h4>Rangos de Fechas</h4>
        <div v-for="(r, index) in rangosFechas" :key="index" class="rango">
          <label>Desde:</label>
          <input type="date" v-model="r.inicio" />
          <label>Hasta:</label>
          <input type="date" v-model="r.fin" />
          <button @click="eliminarRangoFecha(index)" class="btn-eliminar-small">❌</button>
        </div>
        <button @click="agregarRangoFecha" class="btn-primary small">+ Agregar rango de fechas</button>

        <!-- RANGOS DE HORAS -->
        <h4>Rangos de Horarios</h4>
        <div v-for="(r, index) in rangosHoras" :key="index" class="rango">
          <label>Desde:</label>
          <input type="time" v-model="r.inicio" />
          <label>Hasta:</label>
          <input type="time" v-model="r.fin" />
          <button @click="eliminarRangoHora(index)" class="btn-eliminar-small">❌</button>
        </div>
        <button @click="agregarRangoHora" class="btn-primary small">+ Agregar rango de horas</button>

        <!-- BOTÓN GUARDAR -->
        <div style="margin-top:12px;">
          <button @click="guardarConfig" class="btn-primary">💾 Guardar Configuración</button>
        </div>
        <p v-if="mensaje" :style="{ color: error ? 'red' : 'green' }" class="status-msg">{{ mensaje }}</p>
      </div>

      <!-- PANEL REPORTES -->
      <div v-if="mostrarReportes" class="panel">
        <h3>Reportes de Turnos</h3>

        <!-- FILTROS -->
        <div class="filtros">
          <div class="filtro-item">
            <label>Desde:</label>
            <input type="date" v-model="filtroInicio" />
          </div>
          <div class="filtro-item">
            <label>Hasta:</label>
            <input type="date" v-model="filtroFin" />
          </div>
          <div class="filtro-item">
            <label>Paciente (email):</label>
            <input type="text" v-model="filtroPaciente" placeholder="ej: paciente@mail.com" />
          </div>
        </div>

        <div class="acciones-reportes">
          <button @click="obtenerReportes" class="btn-primary">🔍 Buscar</button>
          <button @click="exportarPDF" class="btn-secondary">🖨️ Exportar PDF</button>
        </div>

        <!-- LISTA DE RESULTADOS -->
        <div v-if="reportes.length > 0" class="lista-reportes">
          <h4>Resultados</h4>
          <ul>
            <li v-for="(t, index) in reportes" :key="index" class="reporte-item">
              📅 <strong>{{ formatFecha(t.fecha) }}</strong> - {{ t.hora }} |
              👤 <strong>{{ t.nombre }} {{ t.apellido }}</strong> ({{ t.email }}) con {{ t.profesional }}
            </li>
          </ul>
        </div>
        <p v-else-if="buscado" class="status-msg">⚠️ No se encontraron resultados.</p>
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
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default {
  name: "paginaAdmin",
  data() {
    return {
      // Login
      email: "",
      password: "",
      admin: null,

      // Configuración
      rangosFechas: [{ inicio: "", fin: "" }],
      rangosHoras: [{ inicio: "08:00", fin: "12:00" }],
      idConfig: null,

      // Reportes
      filtroInicio: "",
      filtroFin: "",
      filtroPaciente: "",
      reportes: [],
      buscado: false,

      // Estado UI
      mostrarConfig: false,
      mostrarReportes: false,

      mensaje: "",
      error: false,

      // Toast
      toast: {
        visible: false,
        message: "",
        error: false,
      },
    };
  },
  async created() {
    const admin = localStorage.getItem("admin");
    if (admin) {
      this.admin = JSON.parse(admin);
      await this.cargarConfig();
    }
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

    // --- LOGIN ---
    async loginAdmin() {
      if (!this.email || !this.password) {
        this.mensaje = "⚠️ Complete todos los campos.";
        this.error = true;
        this.mostrarToast(this.mensaje, true);
        return;
      }
      try {
        const res = await apiAxios.get(
          `/usuarios?q=${encodeURIComponent(JSON.stringify({ email: this.email, password: this.password, rol: "admin" }))}`
        );
        if (!res.data || res.data.length === 0) {
          this.mensaje = "❌ Credenciales inválidas.";
          this.error = true;
          this.mostrarToast(this.mensaje, true);
          return;
        }
        this.admin = res.data[0];
        localStorage.setItem("admin", JSON.stringify(this.admin));
        this.mensaje = "✅ Acceso correcto.";
        this.error = false;
        this.mostrarToast(this.mensaje, false);
        await this.cargarConfig();
      } catch (err) {
        console.error("[ERR loginAdmin]", err);
        this.mensaje = "❌ Error en el login.";
        this.error = true;
        this.mostrarToast(this.mensaje, true);
      }
    },
    logout() {
      localStorage.removeItem("admin");
      this.admin = null;
      this.email = "";
      this.password = "";
      this.mensaje = "✅ Sesión cerrada.";
      this.error = false;
      this.mostrarToast(this.mensaje, false);
    },

    // --- CONFIGURACIÓN ---
    async cargarConfig() {
      try {
        const res = await apiAxios.get("/config");
        if (res.data && res.data.length > 0) {
          const cfg = res.data[0];
          this.rangosFechas = cfg.rangosFechas || [{ inicio: "", fin: "" }];
          this.rangosHoras = cfg.rangosHoras || [{ inicio: "08:00", fin: "12:00" }];
          this.idConfig = cfg._id;
        }
      } catch (err) {
        console.error("[ERR cargarConfig]", err);
        this.mostrarToast("❌ Error al cargar configuración.", true);
      }
    },
    agregarRangoFecha() {
      this.rangosFechas.push({ inicio: "", fin: "" });
    },
    eliminarRangoFecha(index) {
      this.rangosFechas.splice(index, 1);
    },
    agregarRangoHora() {
      this.rangosHoras.push({ inicio: "00:00", fin: "00:00" });
    },
    eliminarRangoHora(index) {
      this.rangosHoras.splice(index, 1);
    },
    async guardarConfig() {
      try {
        const payload = {
          rangosFechas: this.rangosFechas,
          rangosHoras: this.rangosHoras,
        };
        if (this.idConfig) {
          await apiAxios.put(`/config/${this.idConfig}`, payload);
        } else {
          const res = await apiAxios.post("/config", payload);
          this.idConfig = res.data._id;
        }
        this.mensaje = "✅ Configuración guardada correctamente.";
        this.error = false;
        this.mostrarToast(this.mensaje, false);
      } catch (err) {
        console.error("[ERR guardarConfig]", err);
        this.mensaje = "❌ Error al guardar configuración.";
        this.error = true;
        this.mostrarToast(this.mensaje, true);
      }
    },

    // --- REPORTES ---
    async obtenerReportes() {
      try {
        const queryObj = {};

        // Helper para construir objeto {$date: "..."}
        const toDateQuery = (dateStr, endOfDay = false) => {
          if (!dateStr) return null;
          const iso = endOfDay ? `${dateStr}T23:59:59.999Z` : `${dateStr}T00:00:00.000Z`;
          return { $date: iso };
        };

        // Fechas
        if (this.filtroInicio || this.filtroFin) {
          queryObj.fecha = {};
          const gte = toDateQuery(this.filtroInicio, false);
          const lte = toDateQuery(this.filtroFin, true);
          if (gte) queryObj.fecha.$gte = gte;
          if (lte) queryObj.fecha.$lte = lte;
        }

        // Email (paciente)
        if (this.filtroPaciente && this.filtroPaciente.trim() !== "") {
          queryObj.email = this.filtroPaciente.trim();
        }

        const url = `/turnos?q=${encodeURIComponent(JSON.stringify(queryObj))}`;
        const res = await apiAxios.get(url);

        this.reportes = res.data || [];
        this.buscado = true;
        this.mensaje = this.reportes.length > 0 ? `✅ Se encontraron ${this.reportes.length} turnos.` : "⚠️ No se encontraron resultados.";
        this.error = this.reportes.length === 0;
        this.mostrarToast(this.mensaje, this.error);
      } catch (err) {
        console.error("[ERR obtenerReportes]", err);
        this.reportes = [];
        this.buscado = true;
        this.mensaje = "❌ Error al buscar reportes.";
        this.error = true;
        this.mostrarToast(this.mensaje, true);
      }
    },

    exportarPDF() {
      if (!this.reportes || this.reportes.length === 0) {
        this.mostrarToast("⚠️ No hay datos para exportar.", true);
        return;
      }
      const doc = new jsPDF();
      doc.text("Reporte de Turnos", 14, 20);
      const rows = this.reportes.map((t) => [
        t.fecha || "",
        t.hora || "",
        `${t.nombre || ""} ${t.apellido || ""}`,
        t.email || "",
        t.profesional || "",
        t.obraSocial || "",
      ]);
      autoTable(doc, {
        head: [["Fecha", "Hora", "Paciente", "Email", "Profesional", "Obra Social"]],
        body: rows,
        startY: 30,
      });
      doc.save("reporte_turnos.pdf");
      this.mostrarToast("✅ PDF descargado.", false);
    },

    formatFecha(fecha) {
      try {
        return fecha ? new Date(fecha).toISOString().split("T")[0] : "";
      } catch {
        return fecha || "";
      }
    },
  },
};
</script>

<style scoped>
.admin-container {
  max-width: 700px;
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
.login-admin {
  max-width: 400px;
  margin: 0 auto;
}
label {
  display: block;
  margin-top: 10px;
  font-weight: 600;
}
input[type="email"],
input[type="password"],
input[type="date"],
input[type="time"],
input[type="text"] {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}

/* Botones: mismos estilos que en las otras páginas */
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
.btn-primary.small {
  padding: 6px 10px;
  font-size: 0.95em;
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

/* Logout button variant */
.logout-btn {
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 14px;
}
.logout-btn:hover {
  background: #d32f2f;
}

/* Small delete button inside ranges */
.btn-eliminar-small {
  background: #f44336;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 6px 8px;
  cursor: pointer;
}
.btn-eliminar-small:hover {
  background: #d32f2f;
}

/* Layouts */
.acciones {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}
.panel {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}
.rango {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.filtros {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 12px;
}
.filtro-item {
  flex: 1 1 200px;
  min-width: 150px;
}

.acciones-reportes {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-bottom: 12px;
}

.lista-reportes {
  margin-top: 12px;
}
.lista-reportes ul {
  list-style: none;
  padding: 0;
}
.reporte-item {
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fff;
}

/* Status message */
.status-msg {
  margin-top: 10px;
  font-weight: 700;
}

/* Toast (mismo estilo que las otras páginas) */
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
@media (max-width: 800px) {
  .acciones {
    flex-direction: column;
    gap: 8px;
  }
  .filtros {
    flex-direction: column;
  }
}
@media (max-width: 480px) {
  .admin-container {
    padding: 14px;
  }
  .login-admin {
    max-width: 100%;
  }
  .rango {
    flex-direction: column;
    align-items: flex-start;
  }
}
</style>