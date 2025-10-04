import request from "supertest";
import { createServer } from "../src/server.js";

const app = createServer();


// RequiredIf/showIf testen
describe("POST /api/tickets (Software-Install)", () => {
  it("Happy Path → 200", async () => {
    const res = await request(app)
      .post("/api/tickets")
      // BaseFields
      .field("name", "Peter Schmidt")
      .field("email", "peter@example.com")
      .field("subject", "Neue Software installieren")
      .field("priority", "medium")
      // Kategorie
      .field("category", "SoftwareInstall")
      // Kategorie-Felder
      .field("softwareName", "Matlab")
      .field("softwareVersion", "2025a")
      .field("isLicensed", "yes")
      .field("licenseRequired", "yes") // requiredIf
      .field("installLocation", "Lab")
      .field("labRooms", "A210") // requiredIf installLocation=Lab
      .field("deadline", "2025-10-01")
      .field("reason", "Notwendig für neues Praktikum im Wintersemester.");

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("ok", true);
  });
});
