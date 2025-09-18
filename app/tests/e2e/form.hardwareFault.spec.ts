import { test, expect } from "@playwright/test";

test("Hardware-Fault-Formular ausfüllen → Erfolg", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // BaseFields
  await page.fill('input[name="name"]', "Lisa Müller");
  await page.fill('input[name="email"]', "lisa@example.com");
  await page.fill('input[name="subject"]', "Beamer defekt");
  await page.selectOption('select[name="priority"]', "medium");

  // Kategorie wählen
  await page.selectOption('select[name="category"]', "hardware-fault");

  // Kategorie-Felder
  await page.selectOption('select[name="lab"]', "A209");
  await page.selectOption('select[name="deviceType"]', "Beamer");
  await page.fill('input[name="inventoryNumber"]', "INV-4711");

  await page.fill(
    'textarea[name="errorDescription"]',
    "Beamer geht nach 5 Minuten aus, vermutlich Überhitzung."
  );

  await page.selectOption('select[name="priority"]', "hoch");
  await page.fill(
    'textarea[name="reproSteps"]',
    "Beamer einschalten, 5 Minuten warten → Gerät schaltet sich ab."
  );

  // Formular absenden
  await page.click('button[type="submit"]');

  // Snackbar-Erfolgsmeldung prüfen
  await expect(page.getByText(/Ticket gesendet/i)).toBeVisible();
});
