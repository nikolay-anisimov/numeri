**Libro de Registro — Formato Electrónico Común (IVA/IRPF)**

Purpose
- Capture the exact sheets, columns, formats and validations required by AEAT to generate the Libro de Registro in XLSX from our data model.
- Source: Formato Electrónico Común (see docs/AEAT/Formato_Electronico_Comun_Libros_Registro_IVA_IRPF.pdf).

Status
- Draft. Marked fields with [verify] require confirmation against the PDF. This file will drive implementation in `packages/utils/src/aeat-libro-xlsx.ts`.

Verification Checklist (to do with the PDF)
- [ ] Confirm mandatory sheets and exact Spanish sheet titles required by AEAT.
- [ ] Confirm the exact column names, order, and data types for Expedidas (ventas).
- [ ] Confirm the exact column names, order, and data types for Recibidas (compras).
- [ ] Confirm whether IRPF books are mandatory alongside IVA for our scenario.
- [ ] Confirm encoding/codes for "Clave de operación" (AIB/ISP/intracomunitaria/etc.).
- [ ] Confirm handling for multi-type IVA per invoice (0/4/10/21 in the same line vs multiple lines).
- [ ] Confirm whether non-EUR currency is permitted and how to report it.

Sheets To Produce
- IVA – Libro registro de facturas expedidas → sheet name: EXPEDIDAS
- IVA – Libro registro de facturas recibidas → sheet name: RECIBIDAS
- IRPF – Libro registro de ingresos (estimación directa) → sheet name: INGRESOS
- IRPF – Libro registro de gastos (estimación directa) → sheet name: GASTOS
- Bienes de inversión (si procede) → sheet name: BIENES-INVERSIÓN

File Naming (Excel XLSX)
- One file for IVA books and another for IRPF, unless unified.
- Unified file allowed containing both taxes.
- Filename must be: `Ejercicio` + `NIF` + `Tipo` + `Nombre/Razón social` (concatenated, spec does not state separator) [confirm separators].
  - Tipo values:
    - C: All IVA books in one XLSX, with sheets: EXPEDIDAS, RECIBIDAS, BIENES-INVERSIÓN (if applies).
    - D: All IRPF books in one XLSX, with sheets: INGRESOS, GASTOS, BIENES-INVERSIÓN (if applies).
    - T: Unified IVA+IRPF in one XLSX, with sheets: EXPEDIDAS_INGRESOS, RECIBIDAS_GASTOS, BIENES-INVERSIÓN (if applies).
  - File type: XLSX.

Data Types & Formats (global)
- Date: Excel date (no time), displayed as `dd/mm/yyyy` [verify]
- Amounts: numeric with 2 decimals; dot as decimal separator (Excel handles locale) [verify]
- NIF: text (preserve leading zeros, foreign formats) [verify]

IVA — Facturas expedidas (Ventas) — Columns
1) Fecha expedición [date]
2) Fecha operación [date, optional] [verify]
3) Serie [text]
4) Número [text]
5) NIF destinatario [text]
6) Nombre/Razón social destinatario [text]
7) Base imponible (tipo 0%) [number] [verify if split by tipo]
8) Cuota repercutida (tipo 0%) [number] [verify]
9) Base imponible (tipo 4%) [number]
10) Cuota repercutida (tipo 4%) [number]
11) Base imponible (tipo 10%) [number]
12) Cuota repercutida (tipo 10%) [number]
13) Base imponible (tipo 21%) [number]
14) Cuota repercutida (tipo 21%) [number]
15) Total factura [number]
16) Descripción/Concepto [text, optional]
17) Clave operación (AIB/ISP/Intracomunitaria, etc.) [text] [verify codificación]
18) Moneda [text, default EUR] [verify if allowed]

IVA — Facturas recibidas (Compras) — Columns
1) Fecha expedición [date]
2) Fecha operación [date, optional]
3) Serie [text]
4) Número [text]
5) NIF proveedor [text]
6) Nombre/Razón social proveedor [text]
7) Base imponible deducible (tipo 0%) [number] [verify]
8) Cuota soportada (tipo 0%) [number] [verify]
9) Base imponible deducible (tipo 4%) [number]
10) Cuota soportada (tipo 4%) [number]
11) Base imponible deducible (tipo 10%) [number]
12) Cuota soportada (tipo 10%) [number]
13) Base imponible deducible (tipo 21%) [number]
14) Cuota soportada (tipo 21%) [number]
15) Total factura [number]
16) Bienes de inversión (S/N) [boolean] [verify exact field]
17) Descripción/Concepto [text]
18) Moneda [text, default EUR] [verify]

IRPF — Libro de ingresos — Columns [verify applicability]
1) Fecha [date]
2) Nº factura/justificante [text]
3) Descripción [text]
4) Importe íntegro [number]
5) IVA repercutido [number] [verify if IRPF libro incluye IVA campos]
6) Retención practicada [number] [verify]
7) Total cobrado [number]

IRPF — Libro de gastos — Columns [verify applicability]
1) Fecha [date]
2) Nº factura/justificante [text]
3) Proveedor [text]
4) NIF proveedor [text]
5) Concepto [text]
6) Importe deducible (base) [number]
7) IVA soportado deducible [number]
8) Gasto no deducible [number] [verify]
9) Bien de inversión (S/N) [boolean]
10) Total pagado [number]

Notes on IVA vs IRPF books
- Autónomos en estimación directa simplificada suelen llevar libros de IVA (si sujetos a IVA) y los de IRPF; la AEAT define un formato común. Confirmar si basta con libros de IVA para el caso con IVA y usar los de IRPF cuando aplique. [verify]

Mapping From Internal Model
- Common internal fields: `date`, `series`, `number`, `thirdPartyName`, `thirdPartyNif`, `base`, `vatRate`, `vatAmount`, `total`, `asset` (bienes inversión), `euOperation`, `isp`, `aib`, `currency`.
- Ventas (emitidas) → Expedidas:
  - Fecha expedición ← `date`
  - Serie/Numero ← `series`/`number`
  - NIF/Nombre destinatario ← `thirdPartyNif`/`thirdPartyName`
  - Bases/Cuotas por tipo ← group by `vatRate` in {0,4,10,21}
  - Total ← `total`
  - Clave operación ← derive from flags (`euOperation`, `isp`, `aib`) [verify coding]
- Compras (recibidas) → Recibidas:
  - Igual que arriba, pero marcar `Bienes inversión` si `asset===true`
  - Bases/Cuotas deducibles por tipo

Validations & Calculations
- Sumas por línea: total ≈ base + cuota (por tipo y sumadas) [allow minor rounding]
- Tipos IVA admitidos: 0, 4, 10, 21 [extendable]
- Fechas dentro del trimestre declarado [not enforced by writer, but validated upstream]

Open Questions
- Exact sheet names and order mandated by AEAT.
- Whether IRPF books are required alongside IVA for nuestro caso (servicios B2B UE, sin IVA repercutido en España para ventas intracomunitarias).
- Encoding of “Clave de operación” (AIB, ISP, intracomunitaria, etc.) in the common format.
- Support for moneda distinta de EUR.

Example (Expedidas) — Single Line
- Fecha: 15/02/2025
- Serie: F-2025
- Número: 0002
- NIF destinatario: PL1234567890
- Nombre destinatario: Cliente Sp. z o.o.
- Base 0%: 1.000,00
- Cuota 0%: 0,00
- Total: 1.000,00
- Clave operación: Intracomunitaria (S) [verify code]

Implementation Notes
- The XLSX writer will generate four sheets (two if IRPF not required), with exact headers and basic data validation.
- Unit tests will assert headers, types (numeric cells), and a couple of example rows.
