import { test, expect } from "@playwright/test";
import path from "path";

test("Procurement-Formular ausfüllen → Erfolg", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // BaseFields
  await page.fill('input[name="name"]', "Max Mustermann");
  await page.fill('input[name="email"]', "max@example.com");
  await page.fill('input[name="subject"]', "Beschaffung Laptop");
  await page.selectOption('select[name="priority"]', "high");

  // Kategorie wählen
  await page.selectOption('select[name="category"]', "Procurement");

  // Category: Procurement Pflichtfelder
  await page.fill('input[name="applicantName"]', "Max Mustermann");
  await page.fill('input[name="applicantTitle"]', "Prof. Dr.");
  await page.fill('input[name="applicantRole"]', "Dozent");
  await page.fill('input[name="costCenter"]', "12345");

  await page.selectOption('select[name="requestType"]', "Hardware");

  await page.fill(
    'textarea[name="description"]',
    "Beschaffung eines leistungsfähigen Notebooks für die Lehre, inkl. Dockingstation."
  );
  await page.fill(
    'textarea[name="justification"]',
    "Aktuelles Gerät ist defekt, Ersatz dringend benötigt."
  );

  await page.fill('input[name="quantity"]', "2");
  await page.fill('input[name="unit"]', "Stück");

  // Pflicht-Uploads
  await page.setInputFiles(
    'input[name="vergabeFile"]',
    path.join(__dirname, "../fixtures/dummy.pdf")
  );
  await page.setInputFiles(
    'input[name="belegFile"]',
    path.join(__dirname, "../fixtures/dummy.pdf")
  );

  // Formular absenden
  await page.click('button[type="submit"]');

  // Snackbar-Erfolgsmeldung prüfen
  await expect(page.getByText(/Ticket gesendet/i)).toBeVisible();
});
