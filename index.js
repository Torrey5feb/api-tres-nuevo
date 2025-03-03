const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const xml2js = require("xml2js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true })); // Para form-urlencoded
app.use(express.json()); // Para JSON (opcional, por si el frontend cambia)

const TRESGUERRAS_API_URL =
  "https://intranet.tresguerras.com.mx/WS/api/Customer/XML/ws_Api.php";
const ACCESS_USR = "API00162";
const ACCESS_PASS =
  "VVZaQ1NrMUVRWGhPYWtwRVZEQTFWVlZyUmxSU1kwOVNVVlZHUkZaR1RrSlRNRlph";

async function obtenerDatosProducto(modelo) {
  try {
    console.log(`Obteniendo datos para el modelo: ${modelo}`);
    const response = await fetch(
      "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json",
      {
        timeout: 30000, // Aumentado a 30 segundos según la documentación
      }
    );
    if (!response.ok)
      throw new Error(`HTTP error al obtener modelos: ${response.status}`);
    const jsonData = await response.json();
    return jsonData.productos[modelo] || null;
  } catch (error) {
    console.error("Error al obtener el JSON de productos:", error);
    return null;
  }
}

app.post("/cotizar", async (req, res) => {
  console.log("Solicitud POST recibida en /cotizar con datos:", req.body);
  const { modelo, cp_destino } = req.body;

  if (!modelo || !cp_destino) {
    return res.send("<h3>Error: Faltan datos (modelo o CP).</h3>");
  }

  const productoData = await obtenerDatosProducto(modelo);
  if (!productoData) {
    return res.send(
      "<h3>Error: Modelo no encontrado en la base de datos.</h3>"
    );
  }

  const requestData = {
    Access_Usr: ACCESS_USR,
    Access_Pass: ACCESS_PASS,
    cp_origen: "76159", // Código postal de origen fijo según tu indicación
    cp_destino: cp_destino,
    no_bultos_1: "1",
    contenido_1: productoData.nombre || "Báscula Torrey 40kg",
    peso_1: String(productoData.peso || 50), // Usar 50 para TVC17
    alto_1: String(productoData.alto || 1.8), // Usar 1.8 para TVC17
    largo_1: String(productoData.largo || 0.9), // Usar 0.9 para TVC17
    ancho_1: String(productoData.ancho || 0.9), // Usar 0.9 para TVC17
    bandera_recoleccion: "S",
    bandera_ead: "S",
    retencion_iva_cliente: "N",
    valor_declarado: String(productoData.precio || 2500), // Usar 2500 para TVC17
    referencia: `cotizaprod_${Date.now()}`,
    colonia_rem: "DESCONOCIDA",
    colonia_des: "DESCONOCIDA",
  };

  console.log(
    "Código postal recibido en el servidor (raw):",
    req.body.cp_destino
  );
  console.log("Código postal procesado:", cp_destino);
  console.log("Datos enviados a Tresguerras:", requestData);

  try {
    const response = await fetch(TRESGUERRAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(requestData).toString(),
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status} - ${response.statusText}`
      );
    }

    const xmlText = await response.text(); // Esperamos XML como respuesta
    console.log("Respuesta XML de Tresguerras:", xmlText);
    const parser = new xml2js.Parser({ explicitArray: false });
    const data = await new Promise((resolve, reject) => {
      parser.parseString(xmlText, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (data.return && !data.return.error) {
      res.send(`
        <!DOCTYPE html>
        <html>
        <head>
          <title>Resultado del Envío</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
          </style>
        </head>
        <body>
          <h3>Resultado para ${encodeURIComponent(modelo)}</h3>
          <p>Costo de envío: $${data.return.total || "0"} MXN</p>
          <p>Días de tránsito: ${data.return.dias_transito || "N/A"}</p>
          <button onclick="window.close()">Cerrar</button>
        </body>
        </html>
      `);
    } else {
      res.send(
        `<h3>Error en la cotización</h3><p>${
          data.return?.error || "Respuesta inesperada"
        }</p>`
      );
    }
  } catch (error) {
    console.error("Error en la API:", error);
    res.send(`<h3>Error al procesar la cotización</h3><p>${error.message}</p>`);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en Railway en el puerto ${PORT}`);
});
