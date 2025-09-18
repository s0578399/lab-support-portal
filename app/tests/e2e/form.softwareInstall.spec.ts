import { test, expect } from "@playwright/test";

test("Software-Install-Formular ausfüllen → Erfolg", async ({ page }) => {
  await page.goto("http://localhost:5173");

  // BaseFields
  await page.fill('input[name="name"]', "Peter Schmidt");
  await page.fill('input[name="email"]', "peter@example.com");
  await page.fill('input[name="subject"]', "Neue Software installieren");
  await page.selectOption('select[name="priority"]', "low");

  // Kategorie wählen
  await page.selectOption('select[name="category"]', "SoftwareInstall");

  // Kategorie-Felder
  await page.fill('input[name="softwareName"]', "Matlab");
  await page.fill('input[name="softwareVersion"]', "2025a");

  // requiredIf: licenseRequired muss gesetzt werden, wenn isLicensed = yes
  await page.selectOption('select[name="isLicensed"]', "yes");
  await page.selectOption('select[name="licenseRequired"]', "yes");

  // requiredIf/showIf: labRooms muss gesetzt werden, wenn installLocation = Lab
  await page.selectOption('select[name="installLocation"]', "Lab");
  await page.selectOption('select[name="labRooms"]', "A210");

  // Pflichtfelder: deadline + reason
  await page.fill('input[name="deadline"]', "2025-10-01");
  await page.fill(
    'textarea[name="reason"]',
    "Installation wird benötigt, um Praktika im Wintersemester durchführen zu können."
  );

  // Formular absenden
  await page.click('button[type="submit"]');

  // Snackbar-Erfolgsmeldung prüfen
  await expect(page.getByText(/Ticket gesendet/i)).toBeVisible();
});
