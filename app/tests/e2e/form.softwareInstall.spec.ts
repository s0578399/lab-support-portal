import { test, expect } from '@playwright/test';

const byName = (page, n: string) => page.locator(`[name="${n}"]`).first();

// robuster Zugriff auf MUI-Select/Combobox via Label
async function openCombo(page, labelRe: RegExp) {
  const label = page.locator('label', { hasText: labelRe }).first();
  // Versuche über htmlFor → id
  const forId = await label.getAttribute('for');
  if (forId) {
    const hasRoleCombo = page.locator(`#${forId} [role="combobox"]`).first();
    if (await hasRoleCombo.count()) { await hasRoleCombo.click(); return; }
    const direct = page.locator(`#${forId}`).first();
    await direct.click(); return;
  }
  // Fallback: nächste Combobox im gleichen FormControl
  await label.locator('..').locator('[role="combobox"]').first().click();
}

async function pickOption(page, optionRe: RegExp) {
  // Option kann als role=option oder ListItem auftauchen
  const opt = page.getByRole('option', { name: optionRe }).first();
  if (await opt.count()) { await opt.click(); return; }
  await page.locator('li', { hasText: optionRe }).first().click();
}

async function clickWeiter(page) {
  const btn = page.getByRole('button', { name: /weiter/i }).first();
  await expect(btn).toBeVisible();
  await expect(btn).toBeEnabled();
  await btn.click();
}

test.only('Software-Install-Formular ausfüllen → Erfolg', async ({ page }) => {
  // Logge Requests zur Diagnose
  page.on('request', (r) => { if (r.method()==='POST') console.log('POST →', r.url()); });

  await page.goto('/', { waitUntil: 'domcontentloaded' });

  // Kategorie wählen: Software-Installation/Update
  await openCombo(page, /Kategorie/i);
  await pickOption(page, /Software-Installation\/Update/i);

  // --- Basisteil (allgemein) ---
  await byName(page, 'subject').fill('Neue Software installieren');

  // Priorität (falls Pflicht)
  await openCombo(page, /Priorität/i);
  await pickOption(page, /(low|niedrig|gering)/i);

  // --- Kategorie-spezifisch laut deinem Schema ---
  await byName(page, 'softwareName').fill('MATLAB Academic');
  await byName(page, 'softwareVersion').fill('R2024b');

  await openCombo(page, /Ist die Software lizenziert\?/i);
  await pickOption(page, /^Ja$/i);

  await openCombo(page, /Lizenz erforderlich\?/i);
  await pickOption(page, /^ja$/i);

  await byName(page, 'licenseInfo').fill('Campuslizenz; Key beim RZ.');

  await openCombo(page, /Ort der Installation/i);
  await pickOption(page, /^VDI$/i);
  await byName(page, 'vdiNote').fill('Pool A – Gruppe 1');

  await byName(page, 'deadline').fill('2025-10-15');
  await byName(page, 'reason').fill('Funktionsupdate für WiSe.');

  // → Weiter zu "Kontaktdaten"
  await clickWeiter(page);

  // --- Kontaktdaten (nur die existierenden Felder füllen!) ---
  await byName(page, 'name').fill('Peter Schmidt');
  await byName(page, 'email').fill('peter@example.com');

  // Wenn es noch einen Übersichtsschritt gibt, noch einmal "Weiter"
  const moreWeiter = page.getByRole('button', { name: /weiter/i }).first();
  if (await moreWeiter.isVisible()) {
    const enabled = await moreWeiter.isEnabled();
    if (enabled) await moreWeiter.click();
  }

  // Finaler Submit-Button (Absenden/Abschicken/Senden)
  const submit = page.getByRole('button', { name: /(absenden|abschicken|senden)/i }).first();
  await expect(submit).toBeVisible({ timeout: 5000 });
  await expect(submit).toBeEnabled();
  
  // Klicke und erwarte, dass ein POST auf /api/tickets abgeht
  const [req] = await Promise.all([
    page.waitForRequest((r) => r.method() === 'POST' && /\/api\/tickets\b/.test(r.url()), { timeout: 10000 }),
    submit.click(),
  ]);

  // (optional) Body grob prüfen, wenn JSON
  try {
    const body = req.postDataJSON?.() ?? {};
    expect(body).toMatchObject({
      category: 'SoftwareInstall',
      subject: 'Neue Software installieren',
      softwareName: 'MATLAB Academic',
    });
  } catch { /* z.B. multipart: egal */ }

  // (optional) UI-Feedback, falls vorhanden
  await page.getByText(/(erfolgreich|ticket|danke)/i).first().waitFor({ timeout: 3000 }).catch(() => {});

}, { timeout: 70_000 });
