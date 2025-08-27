# Q1 2025 Import & Quarter Close — TODOs

- AEAT mapping: extract required columns/sheets from `docs/AEAT/Formato_Electronico_Comun_Libros_Registro_IVA_IRPF.pdf` and write `docs/AEAT/mapping-libro.md`.
- Domain check: ensure DB models support Client, InvoiceOut, InvoiceIn, and manual Expense (Seguridad Social). Identify any gaps.
- Libro writer: create `packages/utils/src/aeat-libro-xlsx.ts` to generate AEAT-compliant XLSX (Ingresos/Compras). Add unit tests for headers and sample rows.
- Mappers: add pure mappers from DB entities to
  - AEAT Libro rows (writer input),
  - 303 entries (`Tax303Entry[]`),
  - 349 inputs (`InvoiceOutFor349[]`).
- Quarter-close service: implement `closeQuarter(year, q)` in API to compute 130/303/349 and call the writer. Return artifact paths.
- Filing guide: implement generator for `guia-presentacion-130-303-349.md` with exact AEAT steps and casillas.
- Integration test: seed 3 months (income, gastos, Seguridad Social), run quarter-close, assert XLSX sheets/headers and guide contents.
- Unit tests: expand coverage for calculators (130/303/349) and mappers; add writer structure tests.
- Scripts: add `pnpm prepare:trimestre` to run the pipeline and write artifacts into `testdata/2025/trimestre-1/artifacts/`.

