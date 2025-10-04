# lab-support-portal
Helpdesk for creating support requests for the HTW  IT laboratories.

Lab Support Portal – Ticket-Erfassung

Überblick
Das Lab-Support-Portal ist ein Prototyp für die strukturierte Erfassung von Support-Tickets durch Hochschul-Mitarbeiter.
Die Anwendung besteht aus einem React-Frontend für die Ticket-Erfassung und einem Express.js-Backend für Validierung und Mailversand.
Ziel: Tickets werden über ein Webformular aufgenommen und strukturiert per E-Mail an das bestehende Ticketsystem der Hochschule weitergeleitet.


Architektur
Frontend (React, Vite, MUI)
Ticket-Formular mit Validierung (Zod, react-hook-form)
Klare Fehler- & Erfolgsmeldungen (Snackbar)
Responsives UI nach Hochschul-Designfarben
Optional: dynamische Formularfelder je nach Kategorie
Build & Auslieferung über Nginx
Backend (Express.js)
API-Endpunkt /api/tickets (POST)
Serverseitige Validierung (Zod)
Mailversand via Nodemailer
Dev: Mailhog (SMTP localhost:1025)
Prod: Uni-SMTP
Sicherheit: Helmet, Rate-Limit (60/min/IP), Logging (Request-ID)
Fehlercodes: 400 (Invalid Input), 502 (Mail Failed), 500 (Unexpected)
Deployment
Docker-Compose-Stack mit drei Containern:
Frontend (Nginx, React)
Backend (Express.js)
Mailhog (Test-SMTP)
VM-Deployment über docker-compose.vm.yml
Nginx als Reverse Proxy für API

lab-support-portal/
├── app/                  # React-Frontend
│   ├── index.html
│   ├── vite.config.ts
│   ├── config/form.schema.json
│   ├── Dockerfile
│   └── ...
│
├── api/                  # Express.js-Backend
│   ├── package.json
│   ├── Dockerfile
│   └── ...
│
├── docker-compose.yml          # lokales Setup
├── docker-compose.vm.yml       # Deployment auf Uni-VM
├── README.md                   # diese Datei
├── README-docker.md            # Docker-Setup
└── .env.example                # Beispiel-Config

Lokale Entwicklung
Voraussetzungen
Node.js ≥ 18
npm oder yarn
Docker (für Tests mit Mailhog)
Frontend starten
cd app
npm install
npm run dev
→ erreichbar unter http://localhost:5173


Backend starten
cd api
npm install
npm run dev
→ API unter http://localhost:3000/api/tickets

Mailhog (lokal)
docker run -d -p 1025:1025 -p 8025:8025 mailhog/mailhog
SMTP: localhost:1025
Web-UI: http://localhost:8025

API-Spezifikation
POST /api/tickets
Request (JSON):

Request (JSON):
{
  "name": "Max Mustermann",
  "email": "max@htw-berlin.de",
  "subject": "Drucker defekt",
  "category": "Hardware",
  "urgency": "high",
  "description": "Der Drucker im Raum B-101 zeigt dauernd Papierstau an."
}

Request (JSON):
{
  "name": "Max Mustermann",
  "email": "max@htw-berlin.de",
  "subject": "Drucker defekt",
  "category": "Hardware",
  "urgency": "high",
  "description": "Der Drucker im Raum B-101 zeigt dauernd Papierstau an."
}

Fehlercodes:
400 → Ungültige Eingabe
502 → Mailversand fehlgeschlagen
500 → Unerwarteter Serverfehler

Tests
Backend:
cd api
npm test
Framework: Jest
Testabdeckung: Validierung, API-Responses, Mail-Mocks

Sicherheit
Helmet → Schutz gängiger HTTP-Header
Rate Limit → max. 60 Requests/Minute pro IP
Logging → jede Anfrage mit eindeutiger Request-ID

Hinweise
Für Docker-Setup & Deployment → siehe README-docker.md
Kein Login/Auth → Portal offen im Uni-Netz
Keine Admin-Funktionalität (reine Ticket-Erfassung)
Mailversand in Prod über Uni-SMTP, in Dev über Mailhog