import 'dotenv/config';
// Lädt automatisch alle Variablen aus einer .env-Datei ins process.env.
// → wichtig für SMTP-Zugangsdaten, Port, etc.

import { createServer } from './server.js';
// Importiert die Funktion, die eine fertig konfigurierte Express-App erzeugt
// (inkl. Helmet, RateLimit, Routen usw.).


// Port aus der Umgebung oder Fallback auf 3000
const port = process.env.PORT || 3000;

// Express-App erstellen
const app = createServer();


// Server starten und auf eingehende Requests lauschen
app.listen(port, () => {
  console.log(`✅ API läuft auf http://localhost:${port}`);
});
