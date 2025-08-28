# Q1 2025 Import & Quarter Close — TODOs

Done
- Extract spec (LSI): columns/types/VALIDACIONES → `docs/AEAT/unificados-format.json/md`; add index `docs/AEAT/README.md` and `crosswalk.md`.
- Extract codes (PLANTILLA): full lists (incl. valid group/alternative concepts) → `docs/AEAT/unificados-codes.json`.
- Template-driven writer: `writeLibroFromTemplate` with title-aware code placement; tests in utils.
- Prisma: add AEAT code fields on invoices; Seguridad Social manual (TGSS) API + minimal UI (default `G45`).

In progress
- UI selects (In): basic selects present; next is to load from `unificados-codes.json` and render groups (GY4/G19 allowed) instead of hardcoded options.

Next
- UI selects (Out): add Tipo Factura, Concepto Ingreso, Clave/Calificación/Exención; wire to code fields; use `unificados-codes.json`.
- Server validation helper: load `unificados-format.json` + `unificados-codes.json` to validate payloads (accept valid groups; reject unknown codes); enforce basic types/lengths on key fields.
- Quarter-close service (API): implement `closeQuarter(year,q)` to compute 130/303/349; include Seguridad Social (G45/G06) in 130; call writer; return artifact paths + filename.
- Filing guide: generate `guia-presentacion-130-303-349.md` (steps, casillas); add AEAT validator link; show link in UI.
- Integration test: seed 3 months (income/gastos/SS), run quarter-close, assert unified sheets present, headers preserved, data rows written, filename pattern ok, guide contains key values.
- Unit tests: expand coverage (calculators, mappers, writer); add validation helper tests (NIF tipo/código país, Conceptos con GY4/G19, Decimal/Fecha formats).
- Optional preflight: `prepare-trimestre --validate` to run local validations against extracted specs before writing.

UI/Domain additions
- Use `unificados-codes.json` to drive selects; display groups (GY4/G19) as optgroups/entries as per LSI.
- Add settings for Actividad (IAE) default (Código/Tipo) per contribuyente and apply to new lines.
- When `assetFlag` is true, include BIENES-INVERSIÓN sheet (later milestone).
