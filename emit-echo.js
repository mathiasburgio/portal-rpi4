const dgram = require('dgram');
const os = require('os');

const socket = dgram.createSocket('udp4');
const BROADCAST_PORT = 41234;
const BROADCAST_ADDR = '255.255.255.255';

socket.bind(() => {
    socket.setBroadcast(true);
});

function getLocalIP() {
    const interfaces = os.networkInterfaces();
    for (const iface in interfaces) {
        for (const addr of interfaces[iface]) {
            if (addr.family === 'IPv4' && !addr.internal) {
                return addr.address;
            }
        }
    }
    return null;
}
function broadcastPresence() {
    const ip = getLocalIP();
    const message = Buffer.from(
        JSON.stringify({
            type: 'RPI_PORTAL',
            ip: ip,
            time: Date.now()
        }
    ));
    socket.send(message, BROADCAST_PORT, BROADCAST_ADDR);
    console.log(`📡 Broadcast enviado desde ${ip}`);
}
setInterval(broadcastPresence, 5000);