<template>
  <div class="turnos-container">
    <h1>Reserva de Turnos</h1>

    <!-- Login con contraseña -->
    <div v-if="!usuario">
      <label for="password">Ingrese su contraseña:</label>
      <input type="password" v-model="password" placeholder="********" />
      <button @click="verificarUsuario" class="btn-primary">Ingresar</button>
      <p v-if="mensaje" :style="{ color: error ? 'red' : 'green' }">{{ mensaje }}</p>
    </div>

    <!-- Bienvenida y formulario de turno -->
    <div v-else>
      <h2>Bienvenido/a, {{ usuario.Nombre }} {{ usuario.Apellido }}</h2>

      <!-- Formulario turno -->
      <div class="form-turno">
        <label for="fecha">Seleccione fecha:</label>
        <select v-model="fechaTurno">
          <option disabled value="">-- Seleccione una fecha --</option>
          <option v-for="f in fechasHabilitadas" :key="f" :value="f">{{ f }}</option>
        </select>

        <label for="hora">Seleccione hora:</label>
        <select v-model="horaTurno">
          <option disabled value="">-- Seleccione una hora --</option>
          <option v-for="hora in horasDisponibles" :key="hora" :value="hora">{{ hora }}</option>
        </select>

        <label for="obraSocial">Obra Social:</label>
        <input type="text" v-model="obraSocial" placeholder="Ingrese su obra social" />

        <label for="profesional">Profesional:</label>
        <select v-model="profesional">
          <option value="Lic. Valeria Cravero">Lic. Valeria Cravero</option>
        </select>

        <button @click="guardarTurno" :disabled="guardando" class="btn-primary">
          {{ guardando ? 'Guardando...' : 'Confirmar Turno' }}
        </button>

        <p v-if="mensaje" :style="{ color: error ? 'red' : 'green' }">{{ mensaje }}</p>
      </div>

      <!-- Lista de turnos del usuario -->
      <div class="lista-turnos" v-if="turnos.length > 0">
        <h3>Mis Turnos</h3>
        <ul>
          <li v-for="t in turnos" :key="t._id" class="turno-item">
            <div class="turno-info">
              📅 <strong>{{ t.fechaDisplay }}</strong> a las <strong>{{ t.hora }}</strong>
              con <strong>{{ t.profesional }}</strong>
              <div class="obra">Obra Social: {{ t.obraSocial }}</div>
            </div>
            <div class="turno-actions">
              <button @click="eliminarTurno(t._id)" class="btn-eliminar">❌ Eliminar</button>
            </div>
          </li>
        </ul>
      </div>
    </div>

    <!-- Alerta visual -->
    <div v-if="toast.visible" :class="['toast', toast.error ? 'error' : 'success']">
      {{ toast.message }}
    </div>
  </div>
</template>

<script>
import apiAxios from "@/api/apiAxios";

export default {
  name: "paginaTurnos",
  data() {
    return {
      password: "",
      usuario: null,
      mensaje: "",
      error: false,

      config: { rangosFechas: [], rangosHoras: [] },

      fechaTurno: "",
      horaTurno: "",
      obraSocial: "",
      profesional: "Lic. Valeria Cravero",

      turnos: [],
      turnosDia: [],
      guardando: false,

      toast: {
        visible: false,
        message: "",
        error: false,
      },
    };
  },
  async created() {
    await this.obtenerConfig();
  },
  watch: {
    fechaTurno(newDate) {
      if (newDate) {
        if (newDate >= this.hoyLocal) {
          this.obtenerTurnosPorFecha(newDate);
        } else {
          this.turnosDia = [];
        }
      } else {
        this.turnosDia = [];
      }
    },
  },
  computed: {
    // fecha local "YYYY-MM-DD"
    hoyLocal() {
      const d = new Date();
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    },

    // Fechas habilitadas (solo fechas >= hoyLocal) usando fechas en medianoche local
    fechasHabilitadas() {
      const fechas = [];
      (this.config.rangosFechas || []).forEach((r) => {
        if (!r.inicio || !r.fin) return;
        let inicio = this.parseDateLocal(r.inicio);
        const fin = this.parseDateLocal(r.fin);
        for (let d = new Date(inicio); d <= fin; d.setDate(d.getDate() + 1)) {
          const isoLocal = this.formatLocalDate(d);
          if (isoLocal >= this.hoyLocal) fechas.push(isoLocal);
        }
      });
      return fechas;
    },

    // Horas disponibles (quita las ocupadas del día)
    horasDisponibles() {
      if (!this.fechaTurno) return [];
      const horas = [];
      (this.config.rangosHoras || []).forEach((r) => {
        if (!r.inicio || !r.fin) return;
        const inicio = parseInt(r.inicio.split(":")[0], 10);
        const fin = parseInt(r.fin.split(":")[0], 10);
        for (let h = inicio; h <= fin; h++) {
          horas.push((h < 10 ? "0" : "") + h + ":00");
        }
      });
      const ocupadas = this.turnosDia.map((t) => t.horaNorm);
      return horas.filter((h) => !ocupadas.includes(h));
    },
  },
  methods: {
    // ---------- utilidades de fecha local ----------
    parseDateLocal(dateStr) {
      // dateStr esperado "YYYY-MM-DD"
      const parts = dateStr.split("-");
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      return new Date(y, m - 1, d); // medianoche local
    },
    formatLocalDate(date) {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, "0");
      const d = String(date.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    },

    mostrarToast(mensaje, error = false) {
      this.toast.message = mensaje;
      this.toast.error = error;
      this.toast.visible = true;
      setTimeout(() => {
        this.toast.visible = false;
      }, 3000);
    },

    async obtenerConfig() {
      try {
        const res = await apiAxios.get("/config");
        if (res.data && res.data.length > 0) {
          this.config = res.data[0];
        }
      } catch (err) {
        console.error("[ERR obtenerConfig]", err);
        this.mostrarToast("❌ Error al cargar configuración.", true);
      }
    },

    async verificarUsuario() {
      if (!this.password) {
        this.mostrarToast("⚠️ Ingrese su contraseña.", true);
        return;
      }
      try {
        const res = await apiAxios.get(`/usuarios?q=${encodeURIComponent(JSON.stringify({ password: this.password }))}`);
        if (!res.data || res.data.length === 0) {
          this.mostrarToast("❌ Contraseña incorrecta.", true);
          return;
        }
        this.usuario = res.data[0];
        await this.obtenerTurnos();
      } catch (err) {
        console.error("[ERR verificarUsuario]", err);
        this.mostrarToast("❌ Error al verificar usuario.", true);
      }
    },

    async guardarTurno() {
      if (!this.fechaTurno || !this.horaTurno || !this.obraSocial) {
        this.mostrarToast("⚠️ Complete todos los campos.", true);
        return;
      }

      // seguridad: bloquear fechas pasadas
      if (this.fechaTurno < this.hoyLocal) {
        this.mostrarToast("❌ No puede reservar en una fecha pasada.", true);
        return;
      }

      try {
        this.guardando = true;

        const horaNorm = this.horaTurno.length >= 5 ? this.horaTurno.slice(0, 5) : this.horaTurno;
        const fechaStr = this.fechaTurno;
        const turnoID = `${fechaStr}_${horaNorm}_${this.profesional}`;

        // Verificar turno único por turnoID en servidor
        const checkQuery = encodeURIComponent(JSON.stringify({ turnoID }));
        const checkRes = await apiAxios.get(`/turnos?q=${checkQuery}`);
        if (Array.isArray(checkRes.data) && checkRes.data.length > 0) {
          this.mostrarToast("❌ Ese turno ya fue reservado.", true);
          this.guardando = false;
          return;
        }

        // Verificar si el usuario ya tiene un turno en ese horario
        const desdeIso = this.parseDateLocal(fechaStr).toISOString();
        const hastaDate = this.parseDateLocal(fechaStr);
        hastaDate.setHours(23, 59, 59, 999);
        const hastaIso = hastaDate.toISOString();

        const userCheckQuery = encodeURIComponent(JSON.stringify({
          email: this.usuario.email,
          fecha: { $gte: { $date: desdeIso }, $lte: { $date: hastaIso } },
          hora: horaNorm
        }));
        const userCheckRes = await apiAxios.get(`/turnos?q=${userCheckQuery}`);
        if (Array.isArray(userCheckRes.data) && userCheckRes.data.length > 0) {
          this.mostrarToast("❌ Ya tienes un turno reservado en ese horario.", true);
          this.guardando = false;
          return;
        }

        // Guardar turno usando fecha en medianoche local convertida a ISO
        const fechaLocalDate = this.parseDateLocal(fechaStr);
        const payload = {
          nombre: this.usuario.Nombre,
          apellido: this.usuario.Apellido,
          email: this.usuario.email,
          fecha: fechaLocalDate.toISOString(),
          hora: horaNorm,
          obraSocial: this.obraSocial,
          profesional: this.profesional,
          turnoID: turnoID,
          createdAt: new Date().toISOString(),
        };

        await apiAxios.post("/turnos", payload);

        // Actualizar listas
        await this.obtenerTurnosPorFecha(fechaStr);
        await this.obtenerTurnos();

        this.mostrarToast("✅ Turno registrado correctamente.");
        this.fechaTurno = "";
        this.horaTurno = "";
        this.obraSocial = "";
      } catch (err) {
        console.error("[ERR guardarTurno]", err);
        this.mostrarToast("❌ Error al guardar el turno.", true);
      } finally {
        this.guardando = false;
      }
    },

    async eliminarTurno(idTurno) {
      if (!confirm("¿Estás seguro de que deseas eliminar este turno?")) return;
      try {
        await apiAxios.delete(`/turnos/${idTurno}`);
        this.mostrarToast("✅ Turno eliminado correctamente.");
        await this.obtenerTurnos();
      } catch (err) {
        console.error("[ERR eliminarTurno]", err);
        this.mostrarToast("❌ Error al eliminar el turno.", true);
      }
    },

    async obtenerTurnos() {
      try {
        if (!this.usuario?.email) return;
        const q = encodeURIComponent(JSON.stringify({ email: this.usuario.email }));
        const res = await apiAxios.get(`/turnos?q=${q}`);
        this.turnos = (res.data || []).map((t) => {
          const fechaNorm = t.fecha ? this.formatLocalDate(new Date(t.fecha)) : "";
          return { ...t, fechaDisplay: fechaNorm };
        });
      } catch (err) {
        console.error("[ERR obtenerTurnos]", err);
      }
    },

    async obtenerTurnosPorFecha(fecha) {
      try {
        // construir rango desde medianoche local hasta 23:59:59 local convertido a ISO
        const desdeIso = this.parseDateLocal(fecha).toISOString();
        const hastaDate = this.parseDateLocal(fecha);
        hastaDate.setHours(23, 59, 59, 999);
        const hastaIso = hastaDate.toISOString();

        const query = {
          fecha: {
            $gte: { $date: desdeIso },
            $lte: { $date: hastaIso },
          },
        };
        const q = encodeURIComponent(JSON.stringify(query));
        const res = await apiAxios.get(`/turnos?q=${q}`);
        this.turnosDia = (res.data || []).map((t) => {
          const horaRaw = (t.hora || "").toString();
          const horaNorm = horaRaw.length >= 5 ? horaRaw.slice(0, 5) : horaRaw;
          const fechaNorm = t.fecha ? this.formatLocalDate(new Date(t.fecha)) : "";
          return { ...t, horaNorm, fechaNorm };
        });
      } catch (err) {
        console.error("[ERR obtenerTurnosPorFecha]", err);
        this.turnosDia = [];
      }
    },
  },
};
</script>

<style scoped>
.turnos-container {
  max-width: 600px;
  margin: auto;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 6px;
  background: #fff;
}
h1 {
  text-align: center;
  margin-bottom: 10px;
}
label {
  display: block;
  margin-top: 10px;
  font-weight: 600;
}
input,
select {
  width: 100%;
  padding: 8px;
  margin-top: 4px;
  border: 1px solid #ccc;
  border-radius: 4px;
  box-sizing: border-box;
}
button {
  margin-top: 12px;
  padding: 10px 14px;
  cursor: pointer;
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
}
.btn-primary {
  background: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 14px;
}
button[disabled],
.btn-primary[disabled],
.btn-primary:disabled {
  background: #ccc;
  cursor: not-allowed;
}
.form-turno {
  margin-top: 20px;
  padding: 15px;
  border: 1px solid #eee;
  border-radius: 6px;
  background: #fafafa;
}
.lista-turnos {
  margin-top: 20px;
}
.lista-turnos ul {
  list-style: none;
  padding: 0;
}
.turno-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px;
  border: 1px solid #eee;
  border-radius: 6px;
  margin-bottom: 8px;
  background: #fff;
}
.turno-info {
  max-width: 78%;
}
.turno-info .obra {
  font-size: 0.9em;
  color: #555;
  margin-top: 4px;
}
.turno-actions {
  display: flex;
  gap: 8px;
  align-items: center;
}
.btn-eliminar {
  background-color: #f44336;
  color: white;
  border: none;
  padding: 6px 8px;
  border-radius: 4px;
  cursor: pointer;
}
.btn-eliminar:hover {
  background-color: #d32f2f;
}

/* Toast */
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
  .turno-item { flex-direction: column; align-items: flex-start; }
  .turno-info { max-width: 100%; }
  .turno-actions { margin-top: 8px; }
}
</style>
