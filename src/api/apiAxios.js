import axios from "axios";

const apiAxios = axios.create({
  baseURL: "/api", // ahora pasa por el proxy configurado en vue.config.js
  headers: {
    "Content-Type": "application/json"
  }
});

export default apiAxios;
