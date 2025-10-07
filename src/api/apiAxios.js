// src/api/apiAxios.js
import axios from "axios";

const apiAxios = axios.create({
  baseURL: "/api",
  headers: {
    "Content-Type": "application/json",
    "x-apikey": "9bcb8157f9e319253d13016c32a3273b2cb40"
  }
});

export default apiAxios;
