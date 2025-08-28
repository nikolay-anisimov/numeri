**Libro Unificado (Tipo T) — Reglas de validación (MVP)**

Objetivo: garantizar que los códigos consignados en el Libro (XLSX) son válidos según la plantilla oficial (LSI/PLANTILLA), permitiendo las agrupaciones válidas documentadas y rechazando códigos no contemplados.

Fuentes
- Plantilla: `docs/AEAT/PLANTILLA_LIBROS_UNIFICADOS.xlsx` (tooltips con listas de valores)
- Codes JSON: `docs/AEAT/unificados-codes.json` (extractor estructurado)

Reglas por columna (EXPEDIDAS_INGRESOS / RECIBIDAS_GASTOS)
- Tipo de Factura: uno de {F1,F2,F3,F4,R1,R2,R3,R4,R5,SF, DV, AJ}
- Concepto de Ingreso: patrón `^I\d{2}$` (p. ej., I01..I09)
- Concepto de Gasto: admite `Gnn` (p. ej., G01..G46) y, según LSI, ciertos códigos de agrupación o conceptos con alternativas (p. ej., `GY4` Suministros; `G19` Servicios con `G40..G42`).
- Clave de Operación: `^0[1-9]|1[0-5]$` (01..15). En recibidas suelen aplicarse 01..09; el Libro unificado admite la familia completa.
- Calificación de la Operación (expedidas): `^[SN]\d$` (S1,S2,N1,N2)
- Operación Exenta (expedidas): `^E\d$` (E1..E6)
- Actividad.Tipo: `^[ABCD]$`
- Actividad.Código: valores numéricos definidos en la plantilla (ver JSON)
- Identificación NIF.Tipo: `^0[2-6]$`
- Cobro/Pago.Medio: `^0[1-5]$`
- Inmueble.Situación: `^[1-5]$`

Notas importantes
- Códigos de agrupación: algunos (p. ej., `GY4` Suministros, `G19` Servicios) son válidos como alternativa a sus subcódigos; otros son meramente agrupadores visuales. La UI debe distinguirlos apoyándose en `unificados-codes.json`.
- Seguridad Social del titular: usar `G45` desde 2025 (admisible `G06` hasta 1T 2024). Documentar el año en la guía de cierre.
- En facturas combinadas de suministros, se permite:
  - Desglosar en filas (G14..G17, G18) con el mismo número/serie, o
  - Usar `GY4` (Suministros) per LSI, o
  - Imputar a `G18 Otros suministros` si no hay desglose.

Implementación (MVP)
- Validación UI: filtrar opciones según `unificados-codes.json`; impedir agrupaciones no válidas y permitir las válidas (p. ej., `GY4`, `G19`) según LSI. Mostrar agrupaciones como optgroups cuando tengan hijos.
- Validación servidor (opcional): cargar `unificados-codes.json` y `unificados-format.json`; rechazar códigos no presentes; aceptar agrupaciones válidas documentadas; conservar trazabilidad del código elegido.
- Escritura XLSX: los códigos se deben ubicar en las columnas correctas según los títulos de la plantilla (ya soportado por el writer template-aware).
