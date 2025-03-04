const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/cotizar', async (req, res) => {
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

app.post('/cotizar', async (req, res) => {
  const modelo = req.body.modelo;
  const cp_destino = req.body.cp_destino;
  console.log(`POST /cotizar - Modelo: ${modelo}, CP Destino: ${cp_destino}`);

  if (!modelo || !cp_destino) {
    console.error('Faltan parámetros: modelo o cp_destino');
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
    console.log('Haciendo solicitud a GitHub...');
    const jsonResponse = await axios.get('https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json?t=' + Date.now());
    console.log('Respuesta cruda de GitHub (tipo):', typeof jsonResponse.data);
    console.log('Respuesta cruda de GitHub:', jsonResponse.data);

    let jsonData = jsonResponse.data;
    if (typeof jsonResponse.data === 'string') {
      console.log('Parseando JSON manualmente porque se recibió como cadena...');
      jsonData = JSON.parse(jsonResponse.data);
    }
    console.log('JSON parseado:', JSON.stringify(jsonData));

    if (!jsonData || !jsonData.productos) {
      console.error('Estructura del JSON inválida:', JSON.stringify(jsonData));
      throw new Error('El JSON no tiene la estructura esperada (falta "productos")');
    }

    const producto = jsonData.productos[modelo];
    if (!producto) {
      console.error('Producto no encontrado en el JSON:', modelo);
      throw new Error(`Producto "${modelo}" no encontrado en el JSON`);
    }
    console.log('Datos del producto:', JSON.stringify(producto));

    const requestData = {
      no_bultos_1: "1",
      contenido_1: "caja",
      peso_1: producto.peso,
      alto_1: producto.alto,
      largo_1: producto.largo,
      ancho_1: producto.ancho,
      cp_origen: "76159",
      cp_destino: cp_destino,
      bandera_recoleccion: "N",
      bandera_ead: "S",
      retencion_iva_cliente: "N",
      valor_declarado: producto.precio,
      colonia_rem: producto.colonia_rem || "Centro",
      colonia_des: producto.colonia_des || "Centro",
      referencia: producto.referencia || "Compra por defecto",
      Access_Usr: "API00162",
      Access_Pass: "VVZaQ1NrMUVRWGhPYWtwRVZEQTFWVlZyUmxSU1kwOVNVVlZHUkZaR1RrSlRNRlph"
    };
    console.log('Solicitud a Tres Guerras:', JSON.stringify(requestData));

    // Usar el endpoint de producción con action en la URL
    const apiResponse = await axios.post(
      'https://intranet.tresguerras.com.mx/WS/api/Customer/JSON/?action=ApiCotizacion',
      requestData,
      {
        timeout: 30000,
        headers: { 'Content-Type': 'application/json' }
      }
    );
    console.log('Respuesta de la API (cruda):', apiResponse.data);

    // Verificar si la respuesta es un objeto válido
    if (typeof apiResponse.data !== 'object' || !apiResponse.data.return) {
      console.error('Respuesta inválida de la API, no es un objeto JSON con "return":', apiResponse.data);
      throw new Error('La API no devolvió una respuesta JSON válida');
    }

    const total = apiResponse.data.return.total || 'No disponible';

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
    const errorMsg = error.response?.data?.return?.descripcion_error || error.message;
    console.error('Error al calcular costo:', errorMsg);
    console.error('Detalles del error:', error.response ? JSON.stringify(error.response.data) : error.stack);

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