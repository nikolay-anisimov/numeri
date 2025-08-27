**Feature**
- Automate downloading OpenAI subscription invoices (API platform and ChatGPT Plus/Team) into a local folder, then import into the app via CLI options.

**Why**
- Centralize monthly invoices for accounting and VAT reporting; avoid manual downloads from dashboards.

**Initial Approach (Abandoned for now)**
- Playwright script to navigate and download PDFs using a persistent browser profile.
- Two flows considered:
  - **API Platform**: `https://platform.openai.com/settings/organization/billing/history`.
  - **ChatGPT Plus/Team**: Open ChatGPT settings → Manage → Stripe portal → download invoice.

**Issues Encountered**
- **No public billing API**: Regular accounts don’t have an official API or auto‑email for invoices.
- **Cloudflare/anti‑bot loops**: Headless and even headful automated sessions hit “Verify you are human” repeatedly.
- **Auth redirects failing**: ChatGPT login sometimes redirected to `/api/auth/error` when automation flags were detected or cookies were stale.
- **Selector fragility**: UI and Stripe portal elements change; brittle across accounts/regions.
- **Profile permissions**: A misconfigured absolute profile path (`/pw-openai-profile`) caused permission errors on cleanup.

**Alternatives Considered**
- **Manual + reminder**: Calendar reminder monthly to download invoices.
- **Email → Drive (Apple App Store only)**: If subscription is via Apple, use Gmail + Apps Script to archive receipts.
- **No‑code (Zapier/Make)**: Only viable if invoices arrive by email with attachments (not the case for standard Plus/API).

**Proposed Future Plan**
- Start with a manual‑assist CLI (Node or Python) that:
  - Opens the correct dashboard URL in a normal browser.
  - Waits for user to confirm the portal is open.
  - Scans the active page for direct `.pdf` links and downloads the latest.
- Add an import CLI to normalize filenames to `OpenAI_YYYY-MM.pdf` and place them under a known folder (e.g., `testdata/invoices/openai/`).
- Optional: workspace script (`pnpm invoices:openai`) to orchestrate download + import.

**Acceptance Criteria (Later)**
- Run `pnpm invoices:openai --target [platform|chatgpt] --month 2025-07 --out ./invoices`.
- Script saves the PDF (normalized name) or prints a clear manual step if automation blocks it.
- Import tool moves/links the PDF into the app’s ingestion path or posts to an internal endpoint.

**Notes**
- Any automation must respect ToS and avoid aggressive bot‑evasion tactics. The manual‑assist approach keeps control with the user and minimizes brittleness.

