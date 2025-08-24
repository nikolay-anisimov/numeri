# Requisitos detallados del sistema (basado en la visión)
**Fecha:** 2025-08-24  
**Relacionado:** Historias US-001…US-007, y *Especificación técnica — Modelos trimestrales AEAT (130, 303, 349)*

## 1. Requisitos funcionales
1. **Emisión de facturas (US-001)**
   - Plantilla con precarga del último mes; edición completa antes de emitir.
   - Marcado automático de operación intracomunitaria B2B (sin IVA) y **349 clave S** al usar cliente UE con NIF-IVA válido.
   - Generación de **PDF** y registro `InvoiceOut` con `currency`, `amount_original`, `fx_to_eur`.
2. **Registro de gastos (US-002)**
   - Subida de **PDF/JPG/PNG**; OCR+LLM extrae proveedor, NIF, fecha, base, tipo/cuota IVA, total, divisa.
   - Clasificación en **categoría** (software, oficina, etc.) y bandera **bien de inversión**.
   - Conversión a **EUR con BCE** en fecha de devengo; trazabilidad de FX.
3. **Inmovilizado y amortización (US-003)**
   - Alta de activo con vida útil/coeficiente; calendario de depreciación y asientos periódicos.
   - IVA de compra en **deducible – bienes de inversión**.
4. **Pre-trimestre 130/303/349 (US-004)**
   - Cálculo de casillas con **resumen YTD** para 130, reparto devengado/deducible 303, agregación 349 por operador/clave.
   - **Hoja guía** (UI+PDF) y export **Libros AEAT** (CSV/XLSX).
5. **Importar T1/T2 históricos (US-005)**
   - Wizard de importación desde **Libros AEAT**; bloqueo de periodos importados.
6. **Archivo/Historico (US-006)**
   - Estructura *ejercicio → trimestre*; archivos y búsquedas.
7. **Conexión bancaria (US-007 Futuro)**
   - Importación de movimientos; conciliación con Seguridad Social.

## 2. Requisitos no funcionales
- **Rendimiento**: preparar trimestre en < **5 s** con 500 documentos/año.
- **Fiabilidad**: almacenamiento transaccional; copias de seguridad diarias.
- **Trazabilidad**: logs de cálculo por **casilla** (130/303) y **línea** (349).
- **Usabilidad**: emitir factura mensual en < **1 min**; teclado y atajos.
- **Portabilidad**: Docker Compose (web, api, db, ocr).

## 3. Datos y modelo (resumen)
- `ThirdParty` (cliente/proveedor; `nif`, `euVat`, `country`), `InvoiceOut`, `InvoiceIn`, `FxRate`, `FixedAsset`, `DepreciationRun`, `LedgerEntry`.
- Campos críticos: `currency`, `amount_original`, `fx_to_eur`, `euOperation`, `vatRate`, `vatAmount`, `assetFlag`.
- Trazas: `source` (OCR/manual/import), `attachments[]` (PDF/JPG), `period` (YYYY-Qn).

## 4. Reglas fiscales y de negocio
- **Servicios B2B UE**: sin IVA repercutido en España; 349 **S**; validación NIF-IVA (manual o enlace a VIES).
- **Multidivisa**: **BCE** por fecha; guardar `fx_to_eur` aplicado.
- **130**: importes **YTD**, minoraciones, negativos previos; guía para complementarias.
- **303**: devengado por tipo (0/4/10/21), AIB, ISP; deducible corriente vs. bienes de inversión; **casilla 71**.
- **349**: periodicidad; agregación por operador/clave; rectificativas.
- **Amortización**: activo ordenador; coeficiente y vida útil configurables (por defecto, ED simplificada).

## 5. UI/UX (flujo)
- **Dashboard** con plazos y previsión.  
- **Facturas** (duplicar última, editar, PDF).  
- **Gastos** (subida, OCR, revisión rápida, marcar bien de inversión).  
- **Impuestos** (pre-trimestre con casillas y export AEAT).  
- **Inmovilizado** (alta y plan).  
- **Archivo** (por trimestre).

## 6. Integraciones
- **OCR+LLM** (servicio interno; API externa o LM Studio en siguiente fase).  
- **Tipos BCE** (servicio de FX propio con caché).  
- **(Futuro)** bancos (CSV/aggregator).

## 7. Seguridad y cumplimiento
- Usuario único; autenticación básica.  
- Cifrado en tránsito (HTTPS); copias de seguridad; control de versiones de reglas por **ejercicio**.

## 8. Pruebas (test-first)
- Unitarias para **reglas fiscales** (130/303/349), **FX** y **amortización**.  
- Contratos API (OpenAPI) + tipos TS generados.  
- E2E (emitir factura; subir gasto; preparar trimestre; export libros).

## 9. Trazabilidad historias → requisitos
- **US-001** → RF 1; UI Facturas; FX.  
- **US-002** → RF 2; OCR; clasificación; FX.  
- **US-003** → RF 3; Inmovilizado; 303 bienes inversión.  
- **US-004** → RF 4; Cálculos 130/303/349; Export AEAT.  
- **US-005** → RF 5; Importador; Bloqueos.  
- **US-006** → RF 6; Archivo/Historico.  
- **US-007** → RF 7; Integración bancaria futura.

## 10. Roadmap
- **MVP**: RF 1–4 + 6; importador T1/T2 (RF 5).  
- **Fase 2**: conexión bancaria (RF 7), validación VIES integrada, mejoras OCR.  
- **Fase 3**: plantillas avanzadas, multiempresa, prorrata especial, VeriFactu.
