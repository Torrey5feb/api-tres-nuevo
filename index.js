const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const xml2js = require("xml2js");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const TRESGUERRAS_API_URL =
  "https://intranet.tresguerras.com.mx/WS/api/Customer/XML/ws_Api.php";
const ACCESS_USR = "API00162";
const ACCESS_PASS =
  "VVZaQ1NrMUVRWGhPYWtwRVZEQTFWVlZyUmxSU1kwOVNVVlZHUkZaR1RrSlRNRlph";

async function obtenerDatosProducto(modelo) {
  try {
    console.log(`Obteniendo datos para el modelo: ${modelo}`);
    const response = await fetch(
      "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json"
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
    console.error("Error: Faltan datos (modelo o CP)");
    return res.send("<h3>Error: Faltan datos (modelo o CP).</h3>");
  }

  if (!/^\d{5}$/.test(cp_destino)) {
    console.error(
      "Error: Código Postal inválido recibido en backend:",
      cp_destino
    );
    return res.send("<h3>Error: Código postal inválido en backend.</h3>");
  }

  console.log(`Datos correctos recibidos: Modelo=${modelo}, CP=${cp_destino}`);

  const productoData = await obtenerDatosProducto(modelo);
  if (!productoData) {
    console.error("Error: Modelo no encontrado:", modelo);
    return res.send(
      "<h3>Error: Modelo no encontrado en la base de datos.</h3>"
    );
  }

  const requestData = {
    Access_Usr: ACCESS_USR,
    Access_Pass: ACCESS_PASS,
    cp_origen: "76159",
    cp_destino: cp_destino,
    no_bultos_1: "1",
    contenido_1: productoData.nombre || "Producto Torrey",
    peso_1: String(productoData.peso || 5),
    alto_1: String(productoData.alto || 0.3),
    largo_1: String(productoData.largo || 0.4),
    ancho_1: String(productoData.ancho || 0.2),
    bandera_recoleccion: "S",
    bandera_ead: "S",
    retencion_iva_cliente: "N",
    valor_declarado: String(productoData.precio || 2500),
    referencia: `cotizaprod_${Date.now()}`,
    colonia_rem: "DESCONOCIDA",
    colonia_des: "DESCONOCIDA",
  };

  console.log("Datos enviados a Tresguerras:", requestData);

  try {
    const response = await fetch(TRESGUERRAS_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams(requestData).toString(),
    });

    if (!response.ok) {
      throw new Error(
        `HTTP error: ${response.status} - ${response.statusText}`
      );
    }

    const xmlText = await response.text();
    console.log("Respuesta XML de Tresguerras:", xmlText);

    const parser = new xml2js.Parser({ explicitArray: false });
    const data = await new Promise((resolve, reject) => {
      parser.parseString(xmlText, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    if (data.return && !data.return.error) {
      res.send(
        `<h3>Costo de envío: $${
          data.return.total || "0"
        } MXN</h3><p>Días de tránsito: ${
          data.return.dias_transito || "N/A"
        }</p>`
      );
    } else {
      res.send(
        `<h3>Error: ${data.return?.error || "Respuesta inesperada"}</h3><p>${
          data.return?.descripcion_error || "Sin detalles"
        }</p>`
      );
    }
  } catch (error) {
    console.error("Error al conectar con Tresguerras:", error);
    res.send(`<h3>Error al calcular el envío</h3><p>${error.message}</p>`);
  }
});

app.listen(PORT, () => {
  console.log(`Servidor funcionando en http://localhost:${PORT}`);
});
