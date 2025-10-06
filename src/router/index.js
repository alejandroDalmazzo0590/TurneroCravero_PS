import { createRouter, createWebHistory } from 'vue-router'
import PaginaRegistro from '@/views/paginaRegistro.vue' 
import PaginaTurnos from '@/views/paginaTurnos.vue'
import paginaAcerca from "@/views/paginaAcerca.vue"
import paginaAdmin from "@/views/paginaAdmin.vue"


const routes = [
  {
    path: "/",
    name: "Registro",
    component: PaginaRegistro,
  },
  {
    path: "/turnos",
    name: "turnos",
    component: PaginaTurnos,
  },
  {
    path: "/acerca",
    name: "Acerca",
    component: paginaAcerca,
  },
  {
    path: "/admin",
    name: "Admin",
    component: paginaAdmin,
  },
]

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes
})

export default router
