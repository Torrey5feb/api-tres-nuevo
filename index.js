const express = require("express");
const fetch = require("node-fetch");
const cors = require("cors"); // Importa cors
const app = express();

// Configura CORS para permitir solicitudes desde torrey.store
app.use(
  cors({
    origin: "https://torrey.store", // Permite solo este origen
    methods: ["POST"], // Permite solo POST (ajusta si necesitas más)
    allowedHeaders: ["Content-Type"], // Permite este encabezado
  })
);

app.use(express.json());

const JSON_URL =
  "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json";

app.post("/action", async (req, res) => {
  const { model, action } = req.body;
  console.log(`Recibido: model=${model}, action=${action}`);

  try {
    const response = await fetch(JSON_URL);
    const data = await response.json();
    const config = data.config || {};
    const producto = data.productos[model] || {};

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
        return res.status(400).json({ error: "Acción no válida" });
    }

    if (!url) {
      console.warn(
        `No se encontró URL para acción="${action}" y modelo="${model}"`
      );
      return res.status(404).json({ error: "URL no encontrada" });
    }

    console.log(`Enviando URL: ${url}`);
    res.json({ url });
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
