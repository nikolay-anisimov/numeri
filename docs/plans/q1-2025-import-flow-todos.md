# Q1 2025 Import & Quarter Close — TODOs

- AEAT mapping: confirm unified (Tipo T) structure using `docs/AEAT/LSI.xlsx` and `docs/AEAT/Ejemplo_2_1T_2023.xlsx`; update `docs/AEAT/mapping-libro.md` with exact column names/order and required fields.
- Domain check: ensure DB models support Client, InvoiceOut, InvoiceIn, and manual Expense (Seguridad Social). Identify any gaps.
- Libro writer: update `packages/utils/src/aeat-libro-xlsx.ts` to target unified sheets `EXPEDIDAS_INGRESOS` and `RECIBIDAS_GASTOS`.
  - Prefer template-driven approach: load a clean copy of `LSI.xlsx` and write data starting at the first data row after header block.
  - Preserve header rows and any validations; don’t alter column order.
  - Unit tests: verify header rows preserved and data row offsets correct.
- Mappers: add pure mappers from DB entities to
  - AEAT Libro rows (writer input),
  - 303 entries (`Tax303Entry[]`),
  - 349 inputs (`InvoiceOutFor349[]`).
- Quarter-close service: implement `closeQuarter(year, q)` in API to compute 130/303/349 and call the writer. Return artifact paths.
- Filing guide: implement generator for `guia-presentacion-130-303-349.md` with exact AEAT steps and casillas; include filename pattern (Ejercicio+NIF+Tipo+Nombre) and unified sheet names.
- Integration test: seed 3 months (income, gastos, Seguridad Social), run quarter-close, assert XLSX sheets (`EXPEDIDAS_INGRESOS`, `RECIBIDAS_GASTOS`), header preservation, and guide contents.
- Unit tests: expand coverage for calculators (130/303/349) and mappers; add writer structure tests (template load, data row positions, numeric formatting).
- Scripts: add `pnpm prepare:trimestre` to run the pipeline and write artifacts into `testdata/2025/trimestre-1/artifacts/`. Add `pnpm --filter @packages/utils dump:aeat` to inspect templates (wrapper for `packages/utils/scripts/aeat-dump.js`).
