const express = require('express');
const fetch = require('node-fetch');
const app = express();

const JSON_URL = 'https://raw.githubusercontent.com/Torrey5feb/URLS/refs/heads/main/modelos.json';

// Lista de dominios permitidos
const ALLOWED_ORIGINS = [
    'https://torrey.store',
    'https://tunegocio.store',
    'https://torrey.info' // Incluye torrey.info y subdominios como api.torrey.info
];

// Middleware para verificar el origen de la solicitud
app.use((req, res, next) => {
    const referer = req.get('Referer');
    console.log(`[DEBUG] Referer recibido: ${referer}`);

    if (!referer) {
        console.log('[WARN] Solicitud sin Referer, acceso denegado');
        return res.status(403).send('Acceso denegado: Origen no especificado');
    }
