const fs = require('fs');
const { execSync, exec } = require('child_process');
const WIFI_FILE = '/etc/wpa_supplicant/wpa_supplicant.conf';

function saveWiFiConfig(ssid, password) {
    const wpaConfig = `
network={
    ssid="${ssid}"
    psk="${password}"
}
`;
    // añadir la red (append)
    fs.appendFileSync(WIFI_FILE, wpaConfig);
    // apagar AP y reconfigurar wpa_supplicant para conectar
    execSync('systemctl stop hostapd dnsmasq', { stdio: 'inherit' });
    execSync('rfkill unblock wlan', { stdio: 'inherit' });
    execSync('wpa_cli -i wlan0 reconfigure', { stdio: 'inherit' });
}

function resetWiFiConfig() {
  /* const defaultConf = `ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=AR
`;
    fs.writeFileSync(WIFI_FILE, defaultConf);
    // parar cliente y levantar AP
    try {
        execSync('systemctl stop wpa_supplicant', { stdio: 'inherit' });
    } catch(e){ 
        // puede fallar si ya está parado 
    }
    execSync('systemctl enable hostapd dnsmasq', { stdio: 'inherit' });
    execSync('systemctl start hostapd dnsmasq', { stdio: 'inherit' });
    console.log("wpa_supplicant restaurado. AP reactivado."); */

    const HOSTAPD_CONF = "/etc/hostapd/hostapd.conf";
    const DNSMASQ_CONF = "/etc/dnsmasq.conf";
    const WPA_SUPPLICANT_CONF = "/etc/wpa_supplicant/wpa_supplicant.conf";

    console.log("🔄 Reiniciando configuración WiFi...");

    try {
        // 1️⃣ Detener servicios WiFi existentes
        console.log("⛔ Deteniendo servicios de red...");
        execSync("sudo systemctl stop hostapd || true");
        execSync("sudo systemctl stop dnsmasq || true");
        execSync("sudo systemctl stop wpa_supplicant || true");
        execSync("sudo systemctl stop NetworkManager || true");

        // 2️⃣ Borrar credenciales anteriores
        console.log("🧹 Limpiando configuración WiFi previa...");
        fs.writeFileSync(
            WPA_SUPPLICANT_CONF,
            `ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=AR
`
        );

        // 3️⃣ Configurar interfaz de red
        console.log("⚙️ Configurando interfaz wlan0 como AP...");
        execSync(`sudo ifconfig wlan0 192.168.4.1 netmask 255.255.255.0 up`);

        // 4️⃣ Crear archivo hostapd.conf
        console.log("📝 Creando hostapd.conf...");
        fs.writeFileSync(
            HOSTAPD_CONF,
            `interface=wlan0
driver=nl80211
ssid=RPi-Setup
hw_mode=g
channel=6
ieee80211n=1
wmm_enabled=1
auth_algs=1
ignore_broadcast_ssid=0
`
        );

        // 5️⃣ Crear archivo dnsmasq.conf
        console.log("📝 Creando dnsmasq.conf...");
        fs.writeFileSync(
            DNSMASQ_CONF,
            `interface=wlan0
dhcp-range=192.168.4.10,192.168.4.50,12h
address=/#/192.168.4.1
`
        );

        // 6️⃣ Iniciar servicios de portal cautivo
        console.log("🚀 Iniciando modo portal cautivo...");
        execSync("sudo systemctl start dnsmasq");
        execSync("sudo systemctl start hostapd");

        // 7️⃣ Levantar el servidor de configuración (Express)
        const serverPath = path.join(__dirname, "server.js");
        console.log("🌐 Iniciando servidor de configuración...");
        execSync(`sudo node ${serverPath} &`, { stdio: "ignore" });

        console.log("✅ Portal cautivo activo. Conectate al WiFi 'RPi-Setup'");
    } catch (err) {
        console.error("❌ Error al reiniciar WiFi:", err.message);
    }
}

function scanWiFiNetworks() {
    return new Promise((resolve) => {
        // usa sudo /sbin/iwlist para que encuentre redes
        exec('sudo /sbin/iwlist wlan0 scan', (err, stdout) => {
            if (err) {
                console.error('Error escaneando redes:', err);
                return resolve([]);
            }
            const networks = [];
            const blocks = stdout.split('Cell ');
            for (const block of blocks.slice(1)) {
                const ssidMatch = block.match(/ESSID:"([^"]+)"/);
                const signalMatch = block.match(/Signal level=(-?\d+) dBm/);
                if (ssidMatch) {
                    networks.push({
                        ssid: ssidMatch[1],
                        signal: signalMatch ? parseInt(signalMatch[1]) : null
                    });
                }
            }
            networks.sort((a,b) => (b.signal || 0) - (a.signal || 0));
            resolve(networks);
        });
    });
}

module.exports = { saveWiFiConfig, resetWiFiConfig, scanWiFiNetworks };