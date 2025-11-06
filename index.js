// app.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { saveWiFiConfig, resetWiFiConfig, scanWiFiNetworks } = require('./wifi');
const Gpio = require('onoff').Gpio;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// API: obtener redes WiFi
app.get('/networks', async (req, res) => {
    try {
        const networks = await scanWiFiNetworks();
        res.json(networks);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

// Guardar red WiFi
app.post('/save', (req, res) => {
    const { ssid, password } = req.body;
    if (!ssid || !password) return res.status(400).send('Faltan datos');
    try {
        saveWiFiConfig(ssid, password);
        res.send("<h2>Guardado correctamente. Conectando a la red...</h2>");
    } catch (e) {
        console.error(e);
        res.status(500).send("Error guardando configuración");
    }
});

// Botón de reseteo
const BUTTON_PIN = 3; // BCM 3 -> pin físico 5. Cambiar a 17 si preferís (GPIO17)
const button = new Gpio(BUTTON_PIN, 'in', 'both', { debounceTimeout: 50 });
let pressStart = null;
const HOLD_TIME = 5000;

button.watch((err, value) => {
    if (err) return console.error(err);
    if (value === 0) {
        pressStart = Date.now();
    } else if (pressStart) {
        const held = Date.now() - pressStart;
        pressStart = null;
        if (held >= HOLD_TIME) {
            console.log("Botón mantenido >5s. Reseteando WiFi...");
            resetWiFiConfig();
        } else {
            console.log("Presionado corto.");
        }
    }
});

process.on('SIGINT', () => {
    button.unexport();
    process.exit();
});

const PORT = 80;
app.listen(PORT, () => {
    console.log(`Portal de configuración iniciado en http://192.168.4.1 (puerto ${PORT})`);
});