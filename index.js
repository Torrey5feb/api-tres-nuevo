const express = require("express");
const axios = require("axios");
const cors = require("cors"); // Instala con `npm install cors`
const app = express();
const port = process.env.PORT || 3000;

// Configura CORS para permitir solicitudes desde Tienda Nube
const corsOptions = {
  origin: "https://tu-tienda.tiendanube.com", // Reemplaza con el dominio exacto de tu tienda (por ejemplo, "torrey.tiendanube.com")
  optionsSuccessStatus: 200, // Para navegadores antiguos
};
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Endpoint para verificar el modelo antes de configurar botones
app.get("/producto/check", async (req, res) => {
  const model = req.query.model || "0LPCR40-N"; // Modelo predeterminado

  try {
    console.log("Verificando modelo:", model); // Log para depuración
    const jsonResponse = await axios.get(
      "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json?t=" +
        Date.now()
    );
    let jsonData = jsonResponse.data;

    if (typeof jsonResponse.data === "string") {
      jsonData = JSON.parse(jsonResponse.data);
    }

    if (!jsonData || !jsonData.productos) {
      throw new Error(
        'El JSON no tiene la estructura esperada (falta "productos")'
      );
    }

    const producto = jsonData.productos[model];
    if (!producto) {
      throw new Error(`Producto "${model}" no encontrado en el JSON`);
    }

    res.json({ status: "ok" });
  } catch (error) {
    console.error("Error al verificar el modelo:", error.message);
    res.status(404).json({ error: "Modelo no encontrado o error en el JSON" });
  }
});

// Endpoint para manejar las acciones de los botones
app.get("/producto/:action", async (req, res) => {
  const action = req.params.action;
  const model = req.query.model || "0LPCR40-N"; // Modelo predeterminado si no se especifica

  try {
    console.log("Solicitud recibida:", action, model); // Log para depuración
    const jsonResponse = await axios.get(
      "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json?t=" +
        Date.now()
    );
    let jsonData = jsonResponse.data;

    if (typeof jsonResponse.data === "string") {
      jsonData = JSON.parse(jsonResponse.data);
    }

    if (!jsonData || !jsonData.productos) {
      throw new Error(
        'El JSON no tiene la estructura esperada (falta "productos")'
      );
    }

    const producto = jsonData.productos[model];
    if (!producto) {
      throw new Error(`Producto "${model}" no encontrado en el JSON`);
    }

    const config = jsonData.config || {};

    let url = "";
    switch (action) {
      case "llamar":
        url = config.llamar || "tel:4422171717"; // Valor predeterminado de modelos.json
        break;
      case "whatsapp":
        url = config.whatsapp || "http://wa.me/524422171717"; // Valor predeterminado de modelos.json
        break;
      case "visitanos":
        url =
          config.indicaciones ||
          "https://www.google.com/maps/dir/?api=1&destination=20.6154051,-100.4203416&travelmode=driving"; // Valor predeterminado de modelos.json
        break;
      case "refacciones":
        url = producto.refacciones || "#";
        break;
      case "manual":
        url = producto.manual || "#";
        break;
      case "ficha_tecnica":
        url = producto.ficha_tecnica || "#";
        break;
      default:
        throw new Error("Acción no válida");
    }

    console.log("URL devuelta:", url); // Log para depuración
    res.json({ url });
  } catch (error) {
    console.error("Error al procesar la acción:", error.message);
    res
      .status(500)
      .json({ error: "No se pudo procesar la acción. Inténtalo de nuevo." });
  }
});

// Endpoint pausado para cotización de Tres Guerras (mantenido sin cambios por ahora)
app.get("/cotizar", async (req, res) => {
  const modelo = req.query.modelo;
  console.log(`GET /cotizar - Modelo recibido: ${modelo}`);
  res.send(`
    <html>
      <head>
        <title>Calcular costo de envío</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          input[type="text"] { width: 100%; padding: 8px; margin: 10px 0; }
          button { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor: pointer; }
          button:hover { background-color: #0056b3; }
        </style>
      </head>
      <body>
        <h3>Calcular costo de envío</h3>
        <form method="POST" action="/cotizar">
          <input type="hidden" name="modelo" value="${modelo}">
          <label>Código postal de destino:</label>
          <input type="text" name="cp_destino" maxlength="6" pattern="[0-9]{5}" required placeholder="Ej. 54000">
          <button type="submit">Calcular</button>
        </form>
      </body>
    </html>
  `);
});

app.post("/cotizar", async (req, res) => {
  const modelo = req.body.modelo;
  const cp_destino = req.body.cp_destino;
  console.log(`POST /cotizar - Modelo: ${modelo}, CP Destino: ${cp_destino}`);

  if (!modelo || !cp_destino) {
    console.error("Faltan parámetros: modelo o cp_destino");
    return res.send(
      `<html><body><h3>Error</h3><p>Faltan datos requeridos</p><button onclick="window.close()">Cerrar</button></body></html>`
    );
  }

  // Lógica pausada hasta recibir info de Tres Guerras
  res.send(
    `<html><body><h3>Función pausada</h3><p>Estamos esperando información técnica de Tres Guerras para completar esta funcionalidad.</p><button onclick="window.close()">Cerrar</button></body></html>`
  );
});

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
