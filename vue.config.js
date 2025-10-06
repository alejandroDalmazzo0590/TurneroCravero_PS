module.exports = {
  devServer: {
    proxy: {
      "/api": {
        target: "https://turnoscravero-7d0e.restdb.io/rest", // tu base en RestDB
        changeOrigin: true, // cambia el origen del host
        pathRewrite: { "^/api": "" }, // elimina "/api" al redirigir
        headers: {
          "x-apikey": "9bcb8157f9e319253d13016c32a3273b2cb40", // tu API key
          "Content-Type": "application/json"
        }
      }
    }
  }
};
