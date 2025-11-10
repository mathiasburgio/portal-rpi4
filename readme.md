# Portal Raspberry Pi (README)

Este README describe los pasos para instalar y configurar un portal en una Raspberry Pi de 32-bit (Bookwork). En otras arquitecturas/boards pueden aparecer problemas con `pigpiod`.

> **Nota:** este procedimiento fue probado en Raspberry Pi de 32-bit. Si usas otra versión o placa, puede que tengas que ajustar paquetes (`pigpiod` / `pigpio`) o permisos.

---

## Requisitos

* Raspberry Pi (32-bit / Bookwork recomendado)
* Conexión a Internet
* Acceso con permisos `sudo` en la Raspberry


## 0) Configurar WIFI si estas en consola
```bash
#Listar redes wifi
sudo nmcli device wifi list
#conectarte a red
sudo nmcli device wifi connect "NOMBRE_DEL_WIFI" password "CONTRASEÑA"
```

## 1) Instalar paquetes necesarios

Ejecuta los siguientes comandos:

```bash
sudo apt update
sudo apt install -y hostapd dnsmasq nodejs npm git
# Requerido para la versión de consola
sudo apt install -y network-manager
# pm2 global y con permisos sudo
sudo npm install -g pm2
# pigpiod (o probar con pigpio si hay problemas)
sudo apt install -y pigpiod
```

> Si tu board tiene problemas con `pigpiod`, prueba con `pigpio` o consulta la documentación específica de tu placa.

## 2) Desenmascarar el servicio hostapd

Antes de poder iniciar `hostapd` es necesario desenmascararlo (unmask):

```bash
sudo systemctl unmask hostapd
```

## 3) Clonar el repositorio

Clona el repositorio con `git` (ajusta la URL a la del proyecto):

```bash
git clone <URL-del-repositorio>
cd <nombre-del-repositorio>
#instalar dependencias
npm install
#clonar variables de entorno de ejemplo
cp .env-example .env
#editar variables de entorno
nano .env
```

## 4) Agregar PM2 al inicio del sistema (con permisos root)

Para que PM2 arranque con el sistema como root, ejecuta:

```bash
#importante ejecutar con sudo
sudo pm2 startup
```

Esto te devolverá un comando adicional para ejecutar (si aplica). Copia y ejecútalo si el output lo solicita.

## 5) Configurar y ejecutar la aplicación con PM2

Inicia la aplicación (ejemplo `index.js`) y guarda la configuración de PM2:

```bash
#importante ejecutar con sudo
sudo pm2 start index.js --name portal
sudo pm2 save
```

## 6) Actualizar aplicación gestionada

Para realizar cambios o ver logs de la aplicación gestionada ejecutar:
1. Ingresar al index de portal-rpi4
2. Realizar 5 clicks en el `h1` que dice `Raspberry pi`
3. Al final del documento aparece para cargar un archivo que agregará/remplazará los archivos dentor de la aplicación gestionada. Dicho archivo debe estar en `.zip`


## 7) Finalizar la configuración

Si el programa no requiere acceso al escritorio, quitar el auto-login del raspberry pi

---

## Comandos EXTRA y utilidades

* Forzar escaneo manual de redes (ver ESSID):

```bash
sudo /sbin/iwlist wlan0 scan | grep ESSID
```

* Forzar reset de la configuración Wi‑Fi (ejecuta desde el sistema, ajusta la ruta al proyecto):

```bash
sudo node -e "require('/home/raspberrypi/Desktop/portal-rpi/wifi.js').resetWiFiConfig()"
```

* Ver la IP actual de la interfaz `wlan0`:

```bash
ip addr show wlan0
```

---

## FINAL — Reinicio / Reset físico

Al terminar la configuración, realiza el reinicio de Wi‑Fi físico para aplicar los cambios:

* Mantén presionado **5 segundos** el botón de reset y luego suelta.

Esto completará la configuración y aplicará los cambios en la interfaz inalámbrica.

---

## Configurar `echo` (detección del dispositivo en la red)

Para que tu software detecte el dispositivo en la red, copia y adapta `listen-echo.js` dentro del proyecto según tus necesidades. Este complemento es el que permite el descubrimiento por `echo` en la red local.

---

## Notas y recomendaciones

* Si hay problemas con `pigpiod`, intenta instalar `pigpio` o buscar logs en `journalctl -u pigpiod` y `dmesg`.
* Asegúrate de que `hostapd` y `dnsmasq` no estén corriendo con configuraciones conflictivas antes de arrancar tu portal.
* Si PM2 te pide ejecutar un comando adicional después de `pm2 startup`, ejecútalo con `sudo` tal como te lo indique el output.

---

## Créditos

Creado por Mathias Burgio.

---

¡Listo! Si querés que adapte este README (ej.: agregar ejemplos de configuración de `hostapd.conf`, `dnsmasq.conf` o `listen-echo.js`) lo hago ahora.
