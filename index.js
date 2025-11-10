// app.js
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const fs = require('fs');
const { saveWiFiConfig, resetWiFiConfig, scanWiFiNetworks } = require('./wifi');
//const Gpio = require('onoff').Gpio;
const { Gpio } = require('pigpio');
const emitEcho = require('./emit-echo');
const multer = require('multer');
const AdmZip = require('adm-zip');
const { exec } = require('child_process');
const os = require("os");
require('dotenv').config();

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/resources', express.static(path.join(__dirname, 'resources')));

if(fs.existsSync( path.join(__dirname, 'uploads') ) === false){
    fs.mkdirSync( path.join(__dirname, 'uploads') );
}
const upload = multer({ dest: path.join(__dirname, 'uploads/') });

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

function extractAndReplace(zipPath, destFolder) {
    ensureDirSync(destFolder);
    const zip = new AdmZip(zipPath);
    zip.getEntries().forEach(entry => {
        const entryPath = path.join(destFolder, entry.entryName);
        if (entry.isDirectory) {
            ensureDirSync(entryPath);
        } else {
            ensureDirSync(path.dirname(entryPath));
            fs.writeFileSync(entryPath, zip.readFile(entry));
            console.log("📦 Reemplazado:", entryPath);
        }
    });
}
function ensureDirSync(dirPath) {
    if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true });
}

app.post('/update-software',  upload.single("file"), (req, res) => {
    if (!req.file) return res.status(400).send("No se envió ningún archivo.");

    try {
        const zipPath = req.file.path;
        console.log("📁 Recibido ZIP:", zipPath);

        extractAndReplace(zipPath, process.env.SOFTWARE_PATH);

        // 🧹 Borramos el ZIP temporal
        fs.unlinkSync(zipPath);

        res.send("✅ Archivos actualizados correctamente.");
    } catch (err) {
        console.error("❌ Error procesando ZIP:", err);
        res.status(500).send("Error procesando el archivo ZIP.");
    }
});

app.post('/restart-software', (req, res) => {
    exec(`sudo pm2 restart ${process.env.SOFTWARE_PM2_NAME}`, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error al reiniciar el software: ${error}`);
            return res.status(500).json("Error reiniciando el software");
        }
        console.log(`Software reiniciado: ${stdout}`);
        res.send("Software reiniciado correctamente");
    });
});
app.get("/logs", (req, res) => {
    try{
        const lines = req.query.lines || 100;
        const error = req.query.error || false;
        exec(`sudo pm2 logs ${process.env.SOFTWARE_PM2_NAME} --lines ${lines} ${error ? '--error' : ''} --nostream`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error obteniendo logs: ${error}`);
                return res.status(500).send("Error obteniendo logs");
            }
            res.send(stdout);
        });
    } catch (err) {
        console.error(`Error en /logs: ${err}`);
        res.status(500).send("Error obteniendo logs");      
    }
});

console.log("IS_RASPBERRY:", process.env.IS_RASPBERRY);
if(process.env.IS_RASPBERRY === "true"){
    // Botón de reseteo
    // Require pin 17 (GPIO17, pin físico 11) conectado a GND
    const button = new Gpio(17, {
        mode: Gpio.INPUT,
        pullUpDown: Gpio.PUD_UP,
        alert: true
    });
    button.enableAlert();
    let pressStart = null;
    const HOLD_TIME = 3000;
    button.on('alert', (level) => {
        if(level === 0) {
            pressStart = Date.now();
        }else if(level == 1 && pressStart){
            const held = Date.now() - pressStart;
            pressStart = null;
            if(held >= HOLD_TIME){
                console.log("Botón mantenido >3s. Reseteando WiFi...");
                resetWiFiConfig();
            }
        }
    });
    console.log("Botón de reseteo configurado en GPIO17");
}

app.listen(process.env.PORTAL_PORT, () => {
    console.log(`Portal de configuración iniciado en http://192.168.4.1 (puerto ${process.env.PORTAL_PORT})`);
});