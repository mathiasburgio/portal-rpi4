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
  const defaultConf = `ctrl_interface=DIR=/var/run/wpa_supplicant GROUP=netdev
update_config=1
country=AR
`;
    fs.writeFileSync(WIFI_FILE, defaultConf);
    // parar cliente y levantar AP
    try {
        execSync('systemctl stop wpa_supplicant', { stdio: 'inherit' });
    } catch(e){ /* puede fallar si ya está parado */ }
    execSync('systemctl enable hostapd dnsmasq', { stdio: 'inherit' });
    execSync('systemctl start hostapd dnsmasq', { stdio: 'inherit' });
    console.log("wpa_supplicant restaurado. AP reactivado.");
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