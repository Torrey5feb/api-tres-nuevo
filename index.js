const express = require("express");
const axios = require("axios");
const xml2js = require("xml2js");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

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
    return res.send(`
      <html>
        <body>
          <h3>Error</h3>
          <p>Faltan datos requeridos</p>
          <button onclick="window.close()">Cerrar</button>
        </body>
      </html>
    `);
  }

  try {
    console.log("Haciendo solicitud a GitHub...");
    const jsonResponse = await axios.get(
      "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json?t=" +
        Date.now()
    );
    console.log("Respuesta cruda de GitHub (tipo):", typeof jsonResponse.data);
    console.log("Respuesta cruda de GitHub:", jsonResponse.data);

    let jsonData = jsonResponse.data;
    if (typeof jsonResponse.data === "string") {
      console.log(
        "Parseando JSON manualmente porque se recibió como cadena..."
      );
      jsonData = JSON.parse(jsonResponse.data);
    }
    console.log("JSON parseado:", JSON.stringify(jsonData));

    if (!jsonData || !jsonData.productos) {
      console.error("Estructura del JSON inválida:", JSON.stringify(jsonData));
      throw new Error(
        'El JSON no tiene la estructura esperada (falta "productos")'
      );
    }

    const producto = jsonData.productos[modelo];
    if (!producto) {
      console.error("Producto no encontrado en el JSON:", modelo);
      throw new Error(`Producto "${modelo}" no encontrado en el JSON`);
    }
    console.log("Datos del producto:", JSON.stringify(producto));

    const soapRequest = `
      <soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:urn="urn:ws_customer">
        <soapenv:Header/>
        <soapenv:Body>
          <urn:ApiCotizacion>
            <urn:DatosForm>
              <urn:no_bultos_1>1</urn:no_bultos_1>
              <urn:contenido_1>caja</urn:contenido_1>
              <urn:peso_1>${producto.peso}</urn:peso_1>
              <urn:alto_1>${producto.alto}</urn:alto_1>
              <urn:largo_1>${producto.largo}</urn:largo_1>
              <urn:ancho_1>${producto.ancho}</urn:ancho_1>
              <urn:cp_origen>76159</urn:cp_origen>
              <urn:cp_destino>${cp_destino}</urn:cp_destino>
              <urn:bandera_recoleccion>N</urn:bandera_recoleccion>
              <urn:bandera_ead>S</urn:bandera_ead>
              <urn:retencion_iva_cliente>N</urn:retencion_iva_cliente>
              <urn:valor_declarado>${producto.precio}</urn:valor_declarado>
              <urn:referencia>${
                producto.referencia || "Compra por defecto"
              }</urn:referencia>
              <urn:colonia_rem>${
                producto.colonia_rem || "Centro"
              }</urn:colonia_rem>
              <urn:colonia_des>${
                producto.colonia_des || "Centro"
              }</urn:colonia_des>
              <urn:Access_Usr>API00162</urn:Access_Usr>
              <urn:Access_Pass>VVZaQ1NrMUVRWGhPYWtwRVZEQTFWVlZyUmxSU1kwOVNVVlZHUkZaR1RrSlRNRlph</urn:Access_Pass>
            </urn:DatosForm>
          </urn:ApiCotizacion>
        </soapenv:Body>
      </soapenv:Envelope>
    `;
    console.log("Solicitud SOAP XML a Tres Guerras:", soapRequest);

    const apiResponse = await axios.post(
      "https://intranet.tresguerras.com.mx/WS/api/Customer/XML/ws_Api.php",
      soapRequest,
      {
        timeout: 30000,
        headers: { "Content-Type": "text/xml" },
      }
    );
    console.log("Código de estado HTTP:", apiResponse.status);
    console.log("Respuesta de la API (cruda):", apiResponse.data);

    const parser = new xml2js.Parser({ explicitArray: false });
    const parsedResponse = await parser.parseStringPromise(apiResponse.data);
    console.log("Respuesta XML parseada:", JSON.stringify(parsedResponse));

    const total =
      parsedResponse["SOAP-ENV:Envelope"]["SOAP-ENV:Body"][
        "ApiCotizacionResponse"
      ]["return"]["total"] || "No disponible";

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            button { padding: 10px 20px; background-color: #007bff; color: white; border: none; cursor: pointer; }
            button:hover { background-color: #0056b3; }
          </style>
        </head>
        <body>
          <h3>Costo de envío</h3>
          <p>Total: $${total}</p>
          <button onclick="window.close()">Cerrar</button>
        </body>
      </html>
    `);
  } catch (error) {
    const errorMsg = error.response?.data || error.message;
    console.error("Error al calcular costo:", errorMsg);
    console.error("Código de estado HTTP (si aplica):", error.response?.status);
    console.error("Detalles del error:", error.stack);

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; text-align: center; }
            p { color: red; }
            button { padding: 10px 20px; background-color: #dc3545; color: white; border: none; cursor: pointer; }
            button:hover { background-color: #c82333; }
          </style>
        </head>
        <body>
          <h3>Error</h3>
          <p>No se pudo calcular el costo: ${errorMsg}</p>
          <button onclick="window.close()">Cerrar</button>
        </body>
      </html>
    `);
  }
});

app.listen(port, () => {
  console.log(`Servidor corriendo en puerto ${port}`);
});
