# Q1 2025 Import & Quarter Close — TODOs

Done
- AEAT mapping (unified Tipo T): extracted sheet names, filename pattern, data row offsets; docs updated in `docs/AEAT/mapping-libro.md` and `docs/AEAT/template-notes.md`.
- Libro writer (template-driven): added `writeLibroFromTemplate` targeting `EXPEDIDAS_INGRESOS` and `RECIBIDAS_GASTOS`; tests added in utils.

Next
- Domain check: ensure DB models support the flow (Client, InvoiceOut, InvoiceIn) and manual monthly Seguridad Social.
  - Option A: model Seguridad Social as `LedgerEntry` with `type=OTHER` and link to a special ThirdParty (TGSS). Add small UI form.
  - Option B: add a dedicated `ManualExpense` entity and map to 303 deductible entries. Decide and implement minimal path (A likely sufficient).
- Mappers (pure functions):
  - DB → unified Libro rows (column order per template; non-applicable fields blank initially).
  - DB → 303 entries (`Tax303Entry[]`).
  - DB → 349 inputs (`InvoiceOutFor349[]`).
- Quarter-close service (API): implement `closeQuarter(year, q)` to compute 130/303/349 and call the template writer; return artifact paths and suggested filename `Ejercicio_NIF_T_NOMBRE.xlsx`.
- Filing guide: generate `guia-presentacion-130-303-349.md` with AEAT steps, casillas, filename pattern; include validator link (https://www2.agenciatributaria.gob.es/wlpl/PACM-SERV/validarLLRs.html). Surface link in UI next to download.
- Integration test: seed 3 months (income, gastos, Seguridad Social), run quarter-close, assert unified sheets present, headers preserved, data rows written, guide contains key values.
- Unit tests: expand coverage for calculators (130/303/349), mappers, and writer (template load, row positions, numeric formatting).
- Scripts: add `prepare:trimestre` runner and a small wrapper to inspect templates (uses `packages/utils/scripts/aeat-dump.js`).

UI/Domain additions (new)
- Use `PLANTILLA_LIBROS_UNIFICADOS.xlsx` to drive select options (see `docs/AEAT/unificados-codes.md`).
- Add settings for Actividad (IAE) Código/Tipo por contribuyente y sugerir en nuevas líneas.
- For Seguridad Social del titular, asignar Concepto de Gasto G45 (o G06 si aplica a ejercicios previos). Permitir override manual.
- Add UI selects for: Tipo de Factura, Concepto (Ingreso/Gasto), Clave/Calificación de Operación, Exención, Tipo NIF, Medio de cobro/pago, Situación de inmueble. Recordar por proveedor/cliente.
