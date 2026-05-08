# Sistema de Monitoreo y Control Bidireccional IoT mediante API REST

**Resumen—** Este documento describe la arquitectura, diseño e implementación de un sistema de Internet de las Cosas (IoT) orientado al monitoreo de temperatura y humedad, y al control físico de actuadores (LED). El proyecto integra un microcontrolador ESP8266 con un sensor DHT22, comunicándose mediante una arquitectura API RESTful en Node.js/Express y una base de datos NoSQL (MongoDB).

## I. INTRODUCCIÓN
El propósito de este proyecto es establecer una comunicación bidireccional fiable entre hardware y software. Se ha desarrollado una plataforma que permite la recepción de datos sensoriales (Push) y la emisión de comandos de control (Read) mediante peticiones HTTP. La interfaz gráfica se presenta a través de un Dashboard dinámico, asegurado bajo mecanismos de autenticación y cifrado de credenciales.

## II. ARQUITECTURA DEL SISTEMA
El sistema se divide en tres capas principales:
1. **Capa Física (Hardware):** Compuesta por un ESP8266 y un sensor DHT22.
2. **Capa Lógica (Backend API):** Construida sobre Node.js utilizando el framework Express.
3. **Capa de Presentación (Frontend):** Dashboard desarrollado con HTML/CSS/JS puro, empleando la librería Plotly.js para la representación gráfica de datos.

## III. DISEÑO DE LA BASE DE DATOS (NoSQL)
Se ha implementado MongoDB para la persistencia de datos. El esquema consta de dos colecciones principales:
* **SensorData:** Registra `temperature`, `humidity` y un `timestamp`.
* **Users:** Almacena `username`, `email` y `password`. Para garantizar la seguridad e integridad del sistema, la contraseña es sometida a un proceso de *hashing* mediante el algoritmo `bcryptjs`.

## IV. DISEÑO DE LA API REST Y COMUNICACIÓN
El flujo de datos sigue el modelo cliente-servidor a través de endpoints REST.

### A. Comunicación Frontend - Backend (JWT Secured)
* `POST /api/auth/login`: Autenticación y generación de Token JWT.
* `GET /api/sensor/history`: Recuperación de datos históricos para Plotly.js.
* `POST /api/sensor/led`: Publicación (Push) del estado deseado para el actuador.

### B. Comunicación Hardware - Backend (API Key Secured)
* `POST /api/sensor/data`: El sensor envía (Push) métricas de temperatura y humedad.
* `GET /api/sensor/led-status`: El ESP8266 consulta (Read) el estado actual para accionar el circuito físico del LED.

## V. VISTAS DEL SISTEMA
La aplicación web provee tres secciones principales, garantizando la experiencia de usuario y la seguridad:
1. **Login/Logout:** Vista de control de acceso.
2. **Dashboard:** Panel principal que despliega gráficas y controles de actuador.
3. **About (Acerca de):** Sección descriptiva con información técnica del proyecto.
