**AEAT Unified Libro (Tipo T) — Template Notes**

- Use `docs/AEAT/LSI.xlsx` as the base template for unified (T) books.
- Sheets present: `EXPEDIDAS_INGRESOS`, `RECIBIDAS_GASTOS`, and optionally `BIENES-INVERSIÓN`.
- Header/dictionary rows: first two rows are headers; data starts at Excel row 3 (0-based index 2).
- Keep sheet names and column order exactly as in the template; do not alter header rows.
- For our initial scenario (servicios B2B UE; gastos corrientes):
  - Commonly populated fields (Expedidas): Ejercicio, Periodo, Serie, Número, NIF/Nombre destinatario, Base (según tipo), Tipo IVA, Cuota IVA, Total Factura.
  - Commonly populated fields (Recibidas): Ejercicio, Periodo, (Serie-Número), NIF/Nombre expedidor, Base/Tipo/Cuota IVA, Deducible, Total Factura.
  - Leave non-applicable fields blank initially (retenciones IRPF, recargo equivalencia, criterio de caja, inmueble, etc.).
- Filename pattern: `Ejercicio_NIF_Tipo_Nombre` (e.g., `2025_Z1664779K_T_NIKOLAI_ANISIMOV.xlsx`).
- Validator: test generated files with AEAT’s tool: https://www2.agenciatributaria.gob.es/wlpl/PACM-SERV/validarLLRs.html

