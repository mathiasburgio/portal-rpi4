const dgram = require("dgram");
const socket = dgram.createSocket("udp4");
const LISTEN_PORT = 41234;

socket.on("message", (msg, rinfo) => {
    try {
        const data = JSON.parse(msg.toString());
        if (data.type === "RPI_PORTAL") {
            console.log(`🔊 Mensaje recibido de ${data.ip}: ${data.time}`);
        }
    } catch (err) {
        console.error("Error al procesar el mensaje:", err);
    }
});

socket.bind(LISTEN_PORT, () => {
    console.log(`👂 Escuchando en el puerto ${LISTEN_PORT}`);
});