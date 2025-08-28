**AEAT Libros — Reference Index**

Purpose
- One place to understand sources, extracted specs, our notes, and how they drive code (UI, validation, writer).

Status
- Scope: Libros unificados (Tipo T) for autónomos (IVA+IRPF) not in SII. LSIJ.xlsx (personas jurídicas no SII) is out of scope for now.

Sources (official)
- `PLANTILLA_LIBROS_UNIFICADOS.xlsx`: Unified template with tooltips (code lists), group headers, and example structure.
- `LSI.xlsx`: Format spec for Libros unificados (columns, data types like Decimal/Fecha/Alfanumérico, and VALIDACIONES numeradas).
- `Formato_Electronico_Comun_Libros_Registro_IVA_IRPF.pdf`: Overview of file organization, naming, and upload; also aligns with unified design.
- `Ejemplo_2_1T_2023.xlsx`: Concrete sample unified Libro with data.
- Others: `CALCULO_CASILLAS_IVA_PRE303-LSI.xlsx`, `Traslado_*`, `Epigrafes_x_EEDD.xlsx` (supporting docs; not wired yet).
- Out-of-scope (for now): `LSIJ.xlsx` (personas jurídicas no SII; XLS/CSV designs).

Extracted (generated)
- Format (columns, types, validations):
  - `docs/AEAT/unificados-format.json`
  - `docs/AEAT/unificados-format.md`
  - Generate: `node packages/utils/scripts/aeat-format-extract.js docs/AEAT/LSI.xlsx`
- Codes (lists from template tooltips):
  - `docs/AEAT/unificados-codes.json`
  - Generate: `node packages/utils/scripts/aeat-codes-extract.js docs/AEAT/PLANTILLA_LIBROS_UNIFICADOS.xlsx`
- Helpers:
  - `packages/utils/scripts/aeat-extract.js` (quick dump: sheet names + row headers + comments)

Our Notes and Guides
- `docs/AEAT/validation.md`: Rules for allowed codes per column, data types, and guidance (e.g., group codes like GY4/G19 per LSI). Designed to be enforced by UI and optional server validation.
- `docs/AEAT/template-notes.md`: Preferred template, start row, filename pattern, AEAT validator link.
- `docs/AEAT/unificados-codes.md`: Curated overview of key code lists; the JSON above is the authoritative set.
- `docs/AEAT/crosswalk.md`: Mapping of app fields → unified Libro headers (sheet/column) and code fields. (See file for details.)
- Deprecated: `docs/AEAT/mapping-libro.md` (kept for history; superseded by extracted format + crosswalk).

Consumers in code
- Writer: `packages/utils/src/aeat-libro-xlsx.ts` loads the unified template and writes rows after headers; code columns placed using template titles.
- Mappers: `packages/utils/src/mappers.ts` map DB entities → Libro rows, carrying AEAT code fields.
- Quarter CLI: `apps/api/src/scripts/prepare-trimestre.ts` builds rows, writes unified XLSX, prints 303/349 summaries.
- UI: Invoices In page has AEAT selects; Seguridad Social form defaults to G45.

Developer workflow
1) Update sources (PLANTILLA, LSI) if new versions.
2) Regenerate extracted specs:
   - Format: `node packages/utils/scripts/aeat-format-extract.js docs/AEAT/LSI.xlsx`
   - Codes: `node packages/utils/scripts/aeat-codes-extract.js docs/AEAT/PLANTILLA_LIBROS_UNIFICADOS.xlsx`
3) Update UI selects/validation using JSONs; adjust server validator if needed.
4) Validate generated Libro via AEAT tool: https://www2.agenciatributaria.gob.es/wlpl/PACM-SERV/validarLLRs.html

