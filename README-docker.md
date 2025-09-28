# Lab-Support-Portal -- Docker & VM Setup

## 1. Ziel

Das Projekt **Lab-Support-Portal** wurde in eine Docker-Umgebung
überführt, sodass es lokal (Mac) und später auf einer Ubuntu-VM
betrieben werden kann.\
Bestandteile: - **Frontend** (React + Vite + Nginx) - **Backend**
(Express.js mit Schema-Validierung & Mailversand) - **Mailhog**
(Test-Mailserver)

------------------------------------------------------------------------

## 2. Setup lokal (Mac)

### 2.1 Projektstruktur

    lab-support-portal/
    ├── app/                # Frontend
    ├── api/                # Backend
    ├── config/
    │   └── form.schema.json
    ├── docker-compose.yml
    ├── Dockerfile.backend
    ├── Dockerfile.frontend

### 2.2 Docker-Compose

``` yaml
version: '3.9'

networks:
  appnet:

services:
  backend:
    build:
      context: .
      dockerfile: Dockerfile.backend
    ports:
      - "3000:3000"
    volumes:
      - ./config:/config
    networks: [appnet]

  frontend:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "80:80"
    networks: [appnet]

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"
    networks: [appnet]
```

### 2.3 Backend

-   Health-Check: `/health`
-   API: `POST /api/tickets`
-   CORS erlaubt: `localhost` & `it-service-wi-test.f4.htw-berlin.de`

### 2.4 Frontend

-   Vite Dev-Proxy für `/api → localhost:3000`

-   Nginx Reverse Proxy in Prod:

    ``` nginx
    location /api {
      proxy_pass http://backend:3000;
    }
    ```

### 2.5 Mailhog

-   SMTP: `localhost:1025`
-   UI: `http://localhost:8025`

------------------------------------------------------------------------

## 3. Troubleshooting & Fixes

-   **Build-Fehler TS** → `vite build` direkt genutzt
-   **Schema nicht gefunden** → Volume `./config:/config`
-   **Netzwerkprobleme** → `appnet` eingeführt
-   **404 Endpunkte** → Nginx `proxy_pass` korrigiert
-   **Mailversand** → Schema-Mount + Endpunkte fixen

------------------------------------------------------------------------

## 4. Testing

-   Healthcheck:

    ``` bash
    docker exec -it ticket-frontend curl -i http://backend:3000/health
    ```

-   Tickets → im Frontend anlegen, Mail in Mailhog sichtbar.

------------------------------------------------------------------------

## 5. Übertragung auf VM

-   Deployment per SSH → `git clone` + `docker compose up -d`
-   Zugriff über:\
    `http://it-service-wi-test.f4.htw-berlin.de`
-   Mailserver: erst Mailhog, später echter SMTP

------------------------------------------------------------------------

## 6. Begriffe

-   **Docker**: Container-Technologie
-   **Compose**: Orchestrierung mehrerer Container
-   **VM (Ubuntu)**: Virtueller Server
-   **SSH**: Sichere Remote-Verbindung
-   **Reverse Proxy**: Verteilt Requests intern
-   **CORS**: Browser-Sicherheitsmechanismus

------------------------------------------------------------------------

## 7. Nächste Schritte

-   [ ] CORS finalisieren (inkl. HTTPS)
-   [ ] `.env` mit SMTP-Credentials
-   [ ] Deployment auf VM
-   [ ] SSL mit Let's Encrypt
