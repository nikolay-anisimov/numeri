**App → Libro Unificado (Tipo T) Crosswalk**

Goal
- Map our DB fields to unified Libro headers (sheet/column), including AEAT code fields, to keep implementation clear and testable.

Legend
- Headers use `Group.Subheader` per `unificados-format.json` (from LSI.xlsx).
- Codes refer to values defined in `unificados-codes.json` (from PLANTILLA).

RECIBIDAS_GASTOS (Compras y gastos)
- `InvoiceIn.issueDate` → `Fecha Expedición(…)`
- `InvoiceIn.supplier.name` → `Nombre Expedidor`
- `InvoiceIn.supplier.nif`/`euVatNumber` → `NIF Expedidor.Tipo/Código País/Identificación` (future: split when data present)
- `InvoiceIn.base` → `Base Imponible`
- `InvoiceIn.vatRate` → `Tipo de IVA`
- `InvoiceIn.vatAmount` → `Cuota IVA Soportado`
- `InvoiceIn.total` → `Total Factura`
- `InvoiceIn.assetFlag` → `Bien de Inversión` (S/N)
- `InvoiceIn.deductible` → `Deducible en Periodo Posterior` (if false, otherwise blank)
- Codes:
  - `InvoiceIn.codeTipoFactura` → `Tipo de Factura`
  - `InvoiceIn.codeConceptoGasto` → `Concepto de Gasto` (accept Gnn; allow GY4/G19 per LSI)
  - `InvoiceIn.codeClaveOperacion` → `Clave de Operación`

EXPEDIDAS_INGRESOS (Ventas/ingresos)
- `InvoiceOut.issueDate` → `Fecha Expedición(…)`
- `InvoiceOut.client.name` → `Nombre Destinatario`
- `InvoiceOut.client.nif/euVatNumber` → `NIF Destinatario.Tipo/Código País/Identificación` (future: split)
- `InvoiceOut.base` → `Base Imponible`
- `InvoiceOut.vatRate` → `Tipo de IVA`
- `InvoiceOut.vatAmount` → `Cuota IVA Repercutida`
- `InvoiceOut.total` → `Total Factura`
- Codes:
  - `InvoiceOut.codeTipoFactura` → `Tipo de Factura`
  - `InvoiceOut.codeConceptoIngreso` → `Concepto de Ingreso`
  - `InvoiceOut.codeClaveOperacion` → `Clave de Operación`
  - `InvoiceOut.codeCalificacionOp` → `Calificación de la Operación`
  - `InvoiceOut.codeExencion` → `Operación Exenta`

Common/Derived
- `Ejercicio`, `Periodo`: derived from date (YYYY and 1T/2T/3T/4T).
- `Identificación de la Factura.Serie/Número/Número-Final`: from `series/number`; número-final used for ranges (not typical in our flow).
- `Cobro/Pago` blocks: not filled initially; kept for future criterion/cash-flow tracking.
- `Inmueble.*`: not filled unless applicable.

Notes
- Column positions vary across templates; writer is template-aware and places codes/values by matching titles.
- When only combined supplies are present, `GY4` may be used (per LSI) instead of G14..G17 and/or `G18`.
- Future: split NIF fields per template; add validation to enforce types/lengths as per `unificados-format.json`.

