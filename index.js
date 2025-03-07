const express = require("express");
const fetch = require("node-fetch");
const app = express();

const JSON_URL =
  "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json";

app.get("/action", async (req, res) => {
  const { model, action } = req.query;
  console.log(`[INFO] Recibido: model=${model}, action=${action}`);

  try {
    console.log("[DEBUG] Iniciando fetch al JSON:", JSON_URL);
    const response = await fetch(JSON_URL);
    const data = await response.json();
    console.log(
      "[DEBUG] Datos obtenidos del JSON:",
      JSON.stringify(data, null, 2)
    );

    const config = data.config || {};
    const producto = data.productos[model] || {};
    console.log("[DEBUG] Configuración:", config);
    console.log("[DEBUG] Producto:", producto);

    let url;
    switch (action) {
      case "llamar":
        url = config.llamar;
        break;
      case "whatsapp":
        url = config.whatsapp;
        break;
      case "indicaciones":
        url = config.indicaciones;
        break;
      case "refacciones":
        url = producto.refacciones;
        break;
      case "manual":
        url = producto.manual;
        break;
      case "ficha_tecnica":
        url = producto.ficha_tecnica;
        break;
      default:
        console.log("[ERROR] Acción no válida:", action);
        return res.status(400).send("Acción no válida");
    }

    if (!url) {
      console.warn(
        `[WARN] No se encontró URL para acción="${action}" y modelo="${model}"`
      );
      return res.status(404).send("URL no encontrada");
    }

    console.log(`[INFO] Redirigiendo a: ${url}`);
    res.redirect(url); // Redirección directa
  } catch (error) {
    console.error("[ERROR] Error en el servidor:", error);
    res.status(500).send("Error interno del servidor");
  }
});

const PORT = process.env.PORT || 8080; // Cambié a 8080 para coincidir con tus logs
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
