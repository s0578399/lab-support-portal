import path from "node:path";                
import { fileURLToPath } from "node:url";    
const __filename = fileURLToPath(import.meta.url); 
const __dirname  = path.dirname(__filename);
import request from "supertest";
import { createServer } from "../src/server.js";

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
      .field("applicantRole", "Dozent")
      .field("costCenter", "12345")
      .field("requestType", "Hardware")
      .field("description", "Beschaffung eines neuen Laptops für Lehrbetrieb, inkl. Zubehör.")
      .field("justification", "Aktuelles Gerät ist defekt, Ersatz dringend benötigt.")
      .field("quantity", "2")
      .field("unit", "Stück")


      // Datei-Uploads (Pflichtfelder)
      .attach("vergabeFile", path.join(__dirname, "fixtures", "dummy pdf.pdf")) 
      .attach("belegFile",   path.join(__dirname, "fixtures", "dummy pdf.pdf"));

    console.log("DEBUG status/body", res.status, res.body);
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
