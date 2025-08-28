**Goal**
- End-to-end “quarter close” proving flow for 2025 T1: create/import monthly income and expenses, add Seguridad Social (no invoice), then close the quarter and generate tax calculations (130/303/349) and an AEAT-compliant Libro de Registro in XLSX per the official spec.

**References (must read before implementation)**
- AEAT: Libro de Registro guidance: https://sede.agenciatributaria.gob.es/Sede/iva/libros-registro.html
- Repo docs index: `docs/AEAT/README.md` (links to extracted format and codes, validation, crosswalk)

**Scope for this milestone**
- User flow (manual within the app):
  - Create a client and issue/import 1 income invoice per month (3 total) for T1 2025.
  - Import expense invoices for the same months.
  - Add recurring non-invoice expense: Seguridad Social (monthly).
  - Click “Cerrar trimestre” to compute models and generate the Libro en formato AEAT (XLSX), plus a filing guide with exact steps/casillas for AEAT forms.
- Outputs (under `testdata/2025/trimestre-1/artifacts/`):
  - `2025_Z1664779K_T_NIKOLAI_ANISIMOV.xlsx` (ejemplo de nombre conforme al patrón AEAT `Ejercicio_NIF_Tipo_Nombre`)
  - `guia-presentacion-130-303-349.md` (instrucciones paso a paso y casillas)
  - Optional for debugging only: `calc-130.json`, `calc-303.json`, `calc-349.json` (not user-facing)

**Design Overview**
- Data source: app DB, not TaxScouts libro. We’ll keep a separate future importer for historic trimestres de TaxScouts.
- Mapping:
  - Internals: continue using `packages/utils` tax calculators (`calc130Ytd`, `calc303`, `build349Lines`).
  - Libro AEAT XLSX (unified Tipo T): generate an XLSX with sheets `EXPEDIDAS_INGRESOS` and `RECIBIDAS_GASTOS` (and `BIENES-INVERSIÓN` if aplica) per LSI (structure) + PLANTILLA (template).
  - Template-driven writer: load `PLANTILLA_LIBROS_UNIFICADOS.xlsx` and write data rows at the correct offsets; place code columns by matching template titles (done).
- Filing guide generator: produce a markdown with instructions for AEAT portals (links), options to choose, y valores por casilla (desde nuestros cálculos). Incluir el patrón de nombre del XLSX (`Ejercicio_NIF_Tipo_Nombre`). Si AEAT permite importar libros para pre-rellenar, documentar la ruta exacta; si no, pasos manuales.
  - Añadir enlace a la herramienta oficial de validación del Libro: https://www2.agenciatributaria.gob.es/wlpl/PACM-SERV/validarLLRs.html (también se mostrará en la UI junto al botón de descarga).

**Work Plan**
1) Confirm AEAT Libro spec (DONE)
- Extract columns/types/validations from LSI → `unificados-format.json/md`. Extract codes from PLANTILLA → `unificados-codes.json`. Add index `docs/AEAT/README.md`.

2) Domain and entry flows (IN PROGRESS)
- Prisma models support: Client, InvoiceOut, InvoiceIn. Added optional AEAT code fields. Seguridad Social manual added via TGSS helper; minimal UI page exists.

3) Libro XLSX writer (Unified) (DONE)
- Util implemented: template-driven writer with title-aware placement; tests added. Mappers map DB → rows and carry codes.

4) Quarter close service (PENDING)
- New service in API: `closeQuarter(year, q)` → computes:
  - 130: YTD gross income and deductible expenses as per MVP; output object only for guide generation.
  - 303: devengada/deducible/resultado 71 using `calc303`.
  - 349: aggregated lines from EU B2B sales with clave S (extendable later).
- Writes artifacts: the XLSX and the markdown guide under the artifacts folder.

5) Filing guide generator (PENDING)
- New util to render `guia-presentacion-130-303-349.md` with:
  - Links to AEAT portals (IRPF 130, IVA 303, 349). Indicate Cl@ve/cert requirements.
  - For 130/303: list casillas with values and short explanations. For 349: list aggregated lines.
  - If AEAT supports importing libros: include exact menu path; if not, instruct manual entry.

6) Integration test (story-level) (PENDING)
- Location: `apps/api/test/quarter-close.int.test.ts`.
- Setup: seed 3 months of data (1 income/month, some expenses, Seguridad Social entries).
- Run: call the quarter close function (not a subprocess).
- Assert: XLSX file exists y tiene los nombres de pestañas unificadas esperados; cabeceras intactas; filas de datos presentes; el nombre del fichero sigue el patrón AEAT; la guía contiene casillas/valores clave; los cálculos son consistentes.

7) Unit tests (coverage focus) (IN PROGRESS)
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
- Which columns are mandatory for our scenario (servicios B2B UE sin IVA repercutido en ventas; gastos con IVA soportado deducible corriente). Capture in `docs/AEAT/template-notes.md`.
- Whether AEAT portals accept Excel libro uploads to prefill models; if so, document exact import path and constraints. If not, guide remains manual.
