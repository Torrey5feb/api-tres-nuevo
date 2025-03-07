const express = require("express");
const fetch = require("node-fetch");
const app = express();

const JSON_URL =
  "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json";

app.get("/action", async (req, res) => {
  const { model, action } = req.query; // Obtiene model y action de los parámetros de la URL
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
        return res.status(400).send("Acción no válida");
    }

    if (!url) {
      console.warn(
        `No se encontró URL para acción="${action}" y modelo="${model}"`
      );
      return res.status(404).send("URL no encontrada");
    }

    console.log(`Generando redirección a: ${url}`);

    // Devuelve una página HTML que abre la URL en una nueva ventana
    const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Redirigiendo...</title>
                <script>
                    window.open('${url}', '_blank');
                    window.close(); // Cierra la ventana temporal (puede no funcionar en todos los navegadores)
                </script>
            </head>
            <body>
                <p>Abriendo ${action} para ${model}...</p>
                <p>Si no se abre, haz clic <a href="${url}" target="_blank">aquí</a>.</p>
            </body>
            </html>
        `;
    res.send(html);
  } catch (error) {
    console.error("Error en el servidor:", error);
    res.status(500).send("Error interno del servidor");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});
