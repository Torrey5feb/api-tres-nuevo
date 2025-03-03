app.post("/cotizar", async (req, res) => {
    // ... (código anterior hasta requestData)
  
    console.log("Datos enviados a Tresguerras:", requestData);
  
    try {
      const response = await fetch(TRESGUERRAS_API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams(requestData).toString(),
        timeout: 30000
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error: ${response.status} - ${response.statusText}`);
      }
  
      const data = await response.json(); // Si la respuesta es JSON, ajusta a XML si es necesario
  
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
        res.send(`<h3>Error: ${data.return?.error || "Respuesta inesperada"}</h3><p>${data.return?.descripcion_error || "Sin detalles"}</p>`);
      }
    } catch (error) {
      console.error("Error al conectar con Tresguerras:", error);
      res.send(`<h3>Error al calcular el envío</h3><p>${error.message}</p>`);
    }
  });