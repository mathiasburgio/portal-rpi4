// wifi.js
const { saveWiFiConfig, resetWiFiConfig } = require('./wifi.js'); // cambiá el nombre según tu archivo

const action = process.argv[2];

if (action === "reset") {
    resetWiFiConfig();
} else if (action === "save") {
    const ssid = process.argv[3];
    const pass = process.argv[4];
    if (!ssid || !pass) {
        console.log("Uso: npm run saveWiFi -- <SSID> <PASSWORD>");
        process.exit(1);
    }
    saveWiFiConfig(ssid, pass);
} else {
    console.log("Comandos disponibles:");
    console.log("  npm run resetWiFi");
    console.log("  npm run saveWiFi -- <SSID> <PASSWORD>");
}