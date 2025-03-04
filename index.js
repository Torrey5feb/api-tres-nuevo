const express = require("express");
const axios = require("axios");
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Ruta para mostrar la ventana emergente
app.get("/cotizar", async (req, res) => {
  const modelo = req.query.modelo; // "TVC17"
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

// Ruta para procesar el formulario y llamar a la API
app.post("/cotizar", async (req, res) => {
  const modelo = req.body.modelo;
  const cp_destino = req.body.cp_destino;

  try {
    // Obtener datos del JSON en GitHub
    const jsonResponse = await axios.get(
      "https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json"
    );
    const producto = jsonResponse.data.productos[modelo];

    // Construir solicitud a Tres Guerras
    const requestData = {
      no_bultos_1: "1",
      contenido_1: "caja",
      peso_1: producto.peso, // "50"
      alto_1: producto.alto, // "1.8"
      largo_1: producto.largo, // "0.9"
      ancho_1: producto.ancho, // "0.9"
      cp_origen: "76159",
      cp_destino: cp_destino,
      bandera_recoleccion: "N",
      bandera_ead: "S",
      retencion_iva_cliente: "N",
      valor_declarado: producto.precio, // "2500"
      Access_Usr: "API00162",
      Access_Pass:
        "VVZaQ1NrMUVRWGhPYWtwRVZEQTFWVlZyUmxSU1kwOVNVVlZHUkZaR1RrSlRNRlph",
    };

    // Llamar a la API de Tres Guerras
    const apiResponse = await axios.post(
      "https://intranet.tresguerras.com.mx/WS/apiTest/Customer/JSON/?action=ApiCotizacion",
      requestData,
      { timeout: 30000 }
    );

    const total = apiResponse.data.return.total || "No disponible";

    // Mostrar resultado
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
    const errorMsg =
      error.response?.data?.return?.descripcion_error || error.message;
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
