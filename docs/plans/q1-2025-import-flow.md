**Goal**
- End-to-end “quarter close” proving flow for 2025 T1: create/import monthly income and expenses, add Seguridad Social (no invoice), then close the quarter and generate tax calculations (130/303/349) and an AEAT-compliant Libro de Registro in XLSX per the official spec.

**References (must read before implementation)**
- AEAT: Libro de Registro guidance: https://sede.agenciatributaria.gob.es/Sede/iva/libros-registro.html
- Repo docs: `docs/AEAT/Formato_Electronico_Comun_Libros_Registro_IVA_IRPF.pdf` (and related files you added)

**Scope for this milestone**
- User flow (manual within the app):
  - Create a client and issue/import 1 income invoice per month (3 total) for T1 2025.
  - Import expense invoices for the same months.
  - Add recurring non-invoice expense: Seguridad Social (monthly).
  - Click “Cerrar trimestre” to compute models and generate the Libro en formato AEAT (XLSX), plus a filing guide with exact steps/casillas for AEAT forms.
- Outputs (under `testdata/2025/trimestre-1/artifacts/`):
  - `libro-registro-aeat.xlsx` (conforme al Formato Electrónico Común IVA/IRPF)
  - `guia-presentacion-130-303-349.md` (instrucciones paso a paso y casillas)
  - Optional for debugging only: `calc-130.json`, `calc-303.json`, `calc-349.json` (not user-facing)

**Design Overview**
- Data source: app DB, not TaxScouts libro. We’ll keep a separate future importer for historic trimestres de TaxScouts.
- Mapping:
  - Internals: continue using `packages/utils` tax calculators (`calc130Ytd`, `calc303`, `build349Lines`).
  - Libro AEAT XLSX: implement a new writer per AEAT spec with the required sheets/columns (Ingresos/Libro de Ventas; Gastos/Libro de Compras) as defined in the PDF.
- Filing guide generator: produce a markdown with instructions for AEAT portals (links), what options to choose, and what values to put in each casilla (sourced from our calcs). If AEAT allows importing libros to prefill anything, document the precise path; otherwise, give explicit manual steps.

**Work Plan**
1) Confirm AEAT Libro spec
- Extract required columns, sheet names, data types, and validations from the PDF. Document mapping in `docs/AEAT/mapping-libro.md`.
- Decide if we build separate books for IVA and IRPF, or a unified pro book (initially: pro autónomos IRPF, ingresos/gastos).

2) Domain and entry flows
- Ensure Prisma models support: Client, InvoiceOut, InvoiceIn, ExpenseManual (for Seguridad Social), with date, base, IVA, total, currency.
- Minimal UI to add these entries for each month (or seeded via script for tests).

3) Libro XLSX writer
- New util: `packages/utils/src/aeat-libro-xlsx.ts` using `xlsx` to produce XLSX that matches the PDF (headers, formats; basic validation where feasible).
- Mapper from our DB entities → Libro rows.
- Unit tests: header mapping, a few rows, workbook integrity.

4) Quarter close service
- New service in API: `closeQuarter(year, q)` → computes:
  - 130: YTD gross income and deductible expenses as per MVP; output object only for guide generation.
  - 303: devengada/deducible/resultado 71 using `calc303`.
  - 349: aggregated lines from EU B2B sales with clave S (extendable later).
- Writes artifacts: the XLSX and the markdown guide under the artifacts folder.

5) Filing guide generator
- New util to render `guia-presentacion-130-303-349.md` with:
  - Links to AEAT portals (IRPF 130, IVA 303, 349). Indicate Cl@ve/cert requirements.
  - For 130/303: list casillas with values and short explanations. For 349: list aggregated lines.
  - If AEAT supports importing libros: include exact menu path; if not, instruct manual entry.

6) Integration test (story-level)
- Location: `apps/api/test/quarter-close.int.test.ts`.
- Setup: seed 3 months of data (1 income/month, some expenses, Seguridad Social entries).
- Run: call the quarter close function (not a subprocess).
- Assert: XLSX file exists and has expected sheets/headers/row counts; guide markdown exists and contains key casillas/values; calculators return consistent totals.

7) Unit tests (coverage focus)
- Mappers: DB entities → 303 entries, → 349 inputs, → Libro rows.
- Calculators: `calc303`, `calc130Ytd`, `build349Lines` with targeted scenarios.
- Writer: XLSX structure test (headers, numeric formats for base/IVA/total).

8) Future: TaxScouts importer (not in this milestone)
- A separate script to parse historical libros (TaxScouts) and seed DB for prior trimestres. Keep read-only and flagged as imported/locked.

**Acceptance Criteria**
- From clean DB, user can enter/import 3 months of invoices/expenses and Seguridad Social, then run “Cerrar trimestre”.
- The system generates an XLSX Libro per AEAT spec and a filing guide markdown with casillas for 130/303 and 349 lines.
- Integration and unit tests pass locally and in CI; no network required.

**Open Questions / To Validate**
- Exact AEAT columns for autónomos (IRPF) vs. IVA books—some taxpayers keep both. We’ll implement the pro books per PDF first.
- Whether AEAT portals accept Excel libro uploads to prefill forms. If not, guide remains manual.

