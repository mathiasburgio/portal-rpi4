const fs = require('fs');
const { execSync, exec } = require('child_process');
const WIFI_FILE = '/etc/wpa_supplicant/wpa_supplicant.conf';

function saveWiFiConfig(ssid, password) {
    /* const wpaConfig = `
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
    execSync('wpa_cli -i wlan0 reconfigure', { stdio: 'inherit' }); */

    console.log("1. Detengo servicios");
    execSync("sudo systemctl stop hostapd || true");
    execSync("sudo systemctl stop dnsmasq || true");

    console.log("2. Inicio Network Manager...(espero 5 seg)");
    execSync("sudo systemctl start NetworkManager || true");
    execSync("sleep 5");

    console.log(`3. Borro configuracion vieja para "${ssid}"...(espero 5 seg)`);
    execSync(`sudo nmcli connection delete "${ssid}" || true`);

    console.log(`4. Creo nueva conexion para "${ssid}"`);
    execSync(`sudo nmcli dev wifi connect "${ssid}" password "${password}"`, { stdio: 'inherit' });

    console.log("5. Listo! Deberia estar conectado.");
    return true;
}

function resetWiFiConfig() {
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

        
        console.log("🌐 Configure WIFI ingresando a 192.168.4.1");

        console.log("✅ Portal cautivo activo. Conectate al WiFi 'RPi-Setup' e ingrese a 192.168.4.1:3333");
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
            let networks = [];
            const blocks = stdout.split('Cell ');
            for (const block of blocks.slice(1)) {
                const ssidMatch = block.match(/ESSID:"([^"]+)"/);
                const signalMatch = block.match(/Signal level=(-?\d+) dBm/);
                const signal = signalMatch ? parseInt(signalMatch[1]) : null;
                let quality = null;

                if (signal !== null) {
                    if (signal >= -50) quality = 'Excelente';
                    else if (signal >= -60) quality = 'Buena';
                    else if (signal >= -70) quality = 'Media';
                    else quality = 'Baja';
                }

                if (ssidMatch) {
                    networks.push({
                        ssid: ssidMatch[1],
                        signal: signal,
                        quality: quality
                    });
                }
            }
            networks.sort((a,b) => (b.signal || 0) - (a.signal || 0));
            resolve(networks);
        });
    });
}

module.exports = { saveWiFiConfig, resetWiFiConfig, scanWiFiNetworks };