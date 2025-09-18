import { jest } from "@jest/globals";
import path from "path";
import { fileURLToPath } from "url";

// 1) Vor dem Import des Servers: Mailservice mocken → Mailversand schlägt garantiert fehl
jest.unstable_mockModule("../src/services/mailService.js", () => ({
  sendTicketMail: jest.fn().mockRejectedValue(new Error("SMTP down"))
}));

// 2) Dynamische (ESM) Importe NACH dem Mock
const { createServer } = await import("../src/server.js");
const request = (await import("supertest")).default;

// __dirname in ESM herstellen
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = createServer();

// Basis-Test um Mail-Error zu testen
describe("POST /api/tickets (Procurement) → 502 bei Mail-Fehler", () => {
  it("liefert 502, wenn der Mailversand fehlschlägt", async () => {
    const res = await request(app)
      .post("/api/tickets")
      // Base-Fields
      .field("name", "Max Mustermann")
      .field("email", "max@example.com")
      .field("subject", "Beschaffung Laptop")
      .field("priority", "high")
      // Kategorie
      .field("category", "Procurement")
      // Procurement required fields
      .field("applicantName", "Max Mustermann")
      .field("applicantTitle", "Prof. Dr.")
      .field("applicantRole", "Dozent")
      .field("costCenter", "KST-12345")
      .field("requestType", "Hardware")
      .field("description", "Beschaffung eines leistungsfähigen Notebooks für die Lehre, inkl. Dock.")
      .field("justification", "Aktuelles Gerät ist defekt, Ersatz dringend benötigt.")
      .field("quantity", "2")
      .field("unit", "Stück")
      .field("priority", "very_high") // Kategorie-eigene Priorität
      // Pflicht-Uploads
      .attach("vergabeFile", path.join(__dirname, "fixtures", "dummy.pdf"))
      .attach("belegFile", path.join(__dirname, "fixtures", "dummy.pdf"));

    expect(res.status).toBe(502);
    expect(res.body).toEqual({ error: "Mail Failed" });
  });
});
