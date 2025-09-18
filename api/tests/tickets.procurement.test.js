import request from "supertest";
import { createServer } from "../src/server.js"; // passe den Pfad an!

const app = createServer();


// Basis-Tests die serverseitige Validierung testen
describe("POST /api/tickets (Procurement)", () => {
  it("Happy Path → 200", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .field("name", "Max Mustermann")               // baseField
      .field("email", "max@example.com")             // baseField
      .field("subject", "Neues Laptop")              // baseField
      .field("priority", "high")                     // baseField
      .field("category", "Procurement")              // wichtig: Kategorie-Key

      // Category: Procurement
      .field("applicantName", "Max Mustermann")
      .field("applicantTitle", "Prof. Dr.")
      .field("applicantRole", "Dozent")
      .field("costCenter", "12345")
      .field("requestType", "Hardware")
      .field("description", "Beschaffung eines neuen Laptops für Lehrbetrieb, inkl. Zubehör.")
      .field("justification", "Aktuelles Gerät ist defekt, Ersatz dringend benötigt.")
      .field("quantity", "2")
      .field("unit", "Stück")
      .field("priority", "very_high")

      // Datei-Uploads (Pflichtfelder)
      .attach("vergabeFile", path.join(__dirname, "fixtures", "dummy.pdf"))
      .attach("belegFile", path.join(__dirname, "fixtures", "dummy.pdf"));

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });


  it("Invalid Input (fehlende Pflichtfelder) → 400", async () => {
    const res = await request(app)
      .post("/api/tickets")
      .field("category", "Procurement") // nur Kategorie, Rest fehlt
      .field("name", "X");         
  });
});
