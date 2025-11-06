1- Instalar paquetes necesarios
sudo apt update
sudo apt install -y hostapd dnsmasq nodejs npm git
sudo apt install network-manager (requerido para version de consola)
sudo npm install -g pm2
sudo apt install pigpiod (o probar con pigpio)


2- Detener servicios
ejecute sudo systemctl unmask hostapd
//sudo systemctl stop hostapd
//sudo systemctl stop dnsmasq

3- Clonar repositorio

//CREO INNECESARIO
4- Editar el archivo ´/etc/dhcpcd.conf´ y agregar (con sudo)

//CREO INNECESARIO
interface wlan0
    static ip_address=192.168.4.1/24
    nohook wpa_supplicant

//CREO INNECESARIO
5- Respaldar archivo y editar ´/etc/dnsmasq.conf´.

//CREO INNECESARIO
5.1 respaldar
sudo mv /etc/dnsmasq.conf /etc/dnsmasq.conf.orig

//CREO INNECESARIO
5.2 editar. Agregar al final
interface=wlan0
dhcp-range=192.168.4.2,192.168.4.20,255.255.255.0,24h
domain-needed
bogus-priv

//CREO INNECESARIO
6- Crear el archivo ´/etc/hostapd/hostapd.conf´ y agregar lo siguiente
interface=wlan0
driver=nl80211
ssid=RPI-Setup
hw_mode=g
channel=7
wmm_enabled=0
auth_algs=1
ignore_broadcast_ssid=0

//CREO INNECESARIO
7- Editar ´/etc/default/hostapd´ y poner
DAEMON_CONF="/etc/hostapd/hostapd.conf"

8- Dar permisos para escaneo WIFI
sudo chmod +s /sbin/iwlist

9- Agregar pm2 al iniciar el sistema y con permisos root
sudo pm2 startup systemd -u root --hp /root

//CREO INNECESARIO
10- Habilitar servicios hosapd y dnsmasq
sudo systemctl enable hostapd
sudo systemctl enable dnsmasq

EXTRA
Forzar escaneo manual
sudo /sbin/iwlist wlan0 scan | grep ESSID

Forzar reset WIFI
sudo node -e "require('/home/raspberrypi/Desktop/portal-rpi/wifi.js').resetWiFiConfig()"

Ver IP actual
ip addr show wlan0

FINAL
Al terminar la configuración ejecutar el reinicio de WIFI para terminar. (Mantener 5 segundos el boton de reset y soltar)

configurar echo (para detectar el dispositivo en la red)
En el software que vaya a utilizar este complemento copiar y modificar listen-echo.js segun las necesidades