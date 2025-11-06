// app.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const { saveWiFiConfig, resetWiFiConfig, scanWiFiNetworks } = require('./wifi');
//const Gpio = require('onoff').Gpio;
const { Gpio } = require('pigpio');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/resources', express.static(path.join(__dirname, 'resources')));

// Página principal
app.get("/", (req, res) => {
    const indexPath = path.join(__dirname, "index.html");
    res.sendFile(indexPath);
});

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
app.post('/connect', (req, res) => {
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
// Require pin 17 (GPIO17, pin físico 11) conectado a GND
const button = new Gpio(17, {
    mode: Gpio.INPUT,
    pullUpDown: Gpio.PUD_UP,
    alert: true
});
button.enableAlert();
let pressStart = null;
const HOLD_TIME = 5000;
button.on('alert', (level) => {
    if(level === 0) {
        pressStart = Date.now();
    }else if(level == 1 && pressStart){
        const held = Date.now() - pressStart;
        pressStart = null;
        if(held >= HOLD_TIME){
            console.log("Botón mantenido >5s. Reseteando WiFi...");
            resetWiFiConfig();
        }
    }
});

const PORT = 3333;
app.listen(PORT, () => {
    console.log(`Portal de configuración iniciado en http://192.168.4.1 (puerto ${PORT})`);
});