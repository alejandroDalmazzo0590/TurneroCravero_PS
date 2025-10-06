<template>
  <div class="acerca-container">
    <h1>Acerca de mí</h1>

    <section class="acerca-texto">
      <p>
        Hola 👋 Soy <strong>Valeria Cravero</strong>, profesional dedicada a brindar atención personalizada a cada paciente.
        Mi objetivo es acompañarte en tu proceso de salud y bienestar, ofreciendo un espacio de escucha, cuidado y confianza.
      </p>

      <p>
        Cuento con experiencia en el ámbito clínico y me especializo en ofrecer turnos organizados y accesibles,
        para que puedas agendar tus consultas de manera fácil y rápida a través de esta plataforma.
      </p>
      
      <p>
        Agrego además que soy Egresada de la Universidad Nacional De Córdoba (U.N.C) con el título de Lic. En Psicología. 
        Mis áreas de trabajo y especialización comprenden terapia cognitiva conductual, Psicología Clínica y del Trabajo. 
      </p>

      <p>
        Gracias por confiar en mí, estaré encantada de acompañarte en tu camino hacia una mejor calidad de vida. 🌿
      </p>
    </section>

    <!-- Botón de contacto -->
    <div class="contacto">
      <a :href="mailtoLink" class="btn-contacto">
        📧 Contactarme por Email
      </a>
    </div>
  </div>
</template>

<script>
export default {
  name: "paginaAcerca",
  computed: {
    mailtoLink() {
      return `mailto:valeriacravero@hotmail.com?subject=Consulta%20de%20Turno&body=Hola%20Valeria,%20quisiera%20consultar%20sobre%20los%20turnos.`;
    },
  },
};
</script>

<style scoped>
.acerca-container {
  max-width: 800px;
  margin: 40px auto;
  padding: 20px;
  line-height: 1.6;
  color: #333;
  text-align: left;
}

h1 {
  text-align: center;
  color: #f4b400;
  margin-bottom: 20px;
}

.acerca-texto p {
  margin-bottom: 16px;
  font-size: 1.1rem;
}

.contacto {
  text-align: center;
  margin-top: 30px;
}

.btn-contacto {
  display: inline-block;
  padding: 12px 20px;
  background-color: #f4b400;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: bold;
  transition: background 0.3s ease, transform 0.2s ease;
}

.btn-contacto:hover {
  background-color: #e09b00;
  transform: scale(1.05);
}
</style>

