# Historias de usuario y criterios de aceptación
**Fecha:** 2025-08-24

> Nota: numeración **US-xxx**. Cada historia tiene criterios de aceptación “mínimos” (MVP) y, si aplica, extensiones “futuro”.

## US-001 — Emitir factura mensual UE en USD
**Como** autónomo  
**Quiero** emitir una factura mensual a mi cliente en Polonia, en USD, operación intracomunitaria B2B  
**Para** generar el PDF, registrar el asiento y preparar el 349 (clave S).

**Criterios de aceptación (MVP):**
- **DADO** que existe una factura del mes anterior, **CUANDO** pulso “Emitir factura”, **ENTONCES** se precargan cliente, conceptos, serie y divisa.
- **CUANDO** edito importe/fecha/concepto y guardo, **ENTONCES** se genera **PDF**, **invoiceOut** y el sistema marca operación **intracomunitaria** (sin IVA) y candidata **349-S**.
- **Y** se convierte el total a **EUR** aplicando el **tipo BCE** del **día de devengo**, guardando `fx_to_eur`.
- **Y** puedo descargar el **PDF** y ver la línea candidata 349 en “Impuestos → 349”.

## US-002 — Registrar gasto con OCR+LLM
**Como** autónomo  
**Quiero** subir un PDF/JPG de un gasto y que el sistema extraiga y clasifique los datos  
**Para** ahorrar tiempo y registrar IVA soportado correctamente.

**Criterios de aceptación (MVP):**
- **DADO** un archivo válido, **CUANDO** lo subo, **ENTONCES** el sistema extrae: proveedor, NIF, fecha, **base**, **tipo y cuota de IVA**, **total**, **divisa**.
- **Y** propone **categoría** y marca “**bien de inversión**” si detecta ordenador/equipo.
- **Y** si la divisa no es EUR, convierte a **EUR (BCE/devengo)** y guarda `fx_to_eur`.
- **Y** **PUEDO CORREGIR** cualquier campo antes de guardar.
- **Y** al guardar, se crea **invoiceIn** y (si aplica) asiento de **IVA deducible**.

## US-003 — Inmovilizado (ordenador) y amortización
**Como** autónomo  
**Quiero** dar de alta un ordenador y amortizarlo automáticamente  
**Para** reflejar gasto fiscal y deducciones correctamente.

**Criterios de aceptación (MVP):**
- **CUANDO** marco una compra como **bien de inversión** (ordenador), **ENTONCES** el sistema crea un **activo** con vida útil y coeficiente elegidos.
- **Y** programa **asientos de amortización** periódicos con importe e **impacto en 130/303** según normativa.
- **Y** el **IVA** de esa compra va a **deducible – bienes de inversión** del 303.

## US-004 — Preparar trimestre (130/303/349)
**Como** autónomo  
**Quiero** pulsar un botón y ver una **pre-liquidación** de 130/303/349 con hoja guía  
**Para** revisar y luego presentar en AEAT con seguridad.

**Criterios de aceptación (MVP):**
- **CUANDO** pulso “Preparar trimestre”, **ENTONCES** el sistema calcula:
  - **130**: rendimientos netos **YTD** + minoraciones.
  - **303**: devengado por tipos (0/4/10/21), AIB, ISP; deducible corriente vs. bienes de inversión; **resultado (71)**.
  - **349**: líneas agregadas por **operador y clave** (S para servicios al cliente polaco).
- **Y** muestra una **hoja guía** con **todas las casillas** y cifras.
- **Y** permite exportar **Libros AEAT** (CSV/XLSX) y un **resumen PDF**.

## US-005 — Importar T1 y T2 históricos (TaxScouts)
**Como** autónomo  
**Quiero** importar libros/archivos de los trimestres 1 y 2 ya presentados  
**Para** continuar el ejercicio sin incoherencias y **bloquear** lo ya presentado.

**Criterios de aceptación (MVP):**
- **DADO** ficheros **CSV/XLSX** de libros AEAT, **CUANDO** los importo, **ENTONCES** el sistema mapea a `InvoiceOut`, `InvoiceIn`, `FxRate` y **recalcula YTD**.
- **Y** marca esos periodos como **bloqueados** (solo lectura).
- **Y** la **pre-liquidación** del trimestre actual coincide con los acumulados esperados.

## US-006 — Archivo por trimestres e histórico
**Como** autónomo  
**Quiero** ver y descargar por **trimestre** todos mis **PDFs** y **libros**  
**Para** tener trazabilidad y auditoría.

**Criterios de aceptación (MVP):**
- Vista por **ejercicio → trimestre** con facturas emitidas/recibidas, libros (CSV/XLSX) y PDFs.
- Búsqueda por **texto, NIF, importe, divisa, categoría**.

## US-007 — (Futuro) Conexión bancaria básica
**Como** autónomo  
**Quiero** conectar el banco para traer **cargos a Seguridad Social**  
**Para** conciliar pagos obligatorios.

**Criterios (posterior):**
- Importación periódica y casado automático con conceptos de SS; revisión manual.
