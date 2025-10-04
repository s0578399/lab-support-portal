import request from "supertest";
import { createServer } from "../src/server.js";

const app = createServer();


// MinLength und optionales File testen
describe("POST /api/tickets (Hardware-Fault)", () => {
  it("Happy Path → 200", async () => {
    const res = await request(app)
      .post("/api/tickets")
      // BaseFields
      .field("name", "Lisa Müller")
      .field("email", "lisa@example.com")
      .field("subject", "Beamer defekt")
      .field("priority", "high")
      // Kategorie
      .field("category", "hardware-fault")
      // Kategorie-Felder
      .field("lab", "A209")
      .field("deviceType", "Beamer")
      .field("inventoryNumber", "INV-4711")
      .field("errorDescription", "Beamer geht nach 5 Minuten aus.")
      .field("reproSteps", "Beamer starten, nach kurzer Zeit geht er aus.");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });
});
