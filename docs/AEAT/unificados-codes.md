**Libro Unificado (Tipo T) — Códigos y listas de valores (extraídos de PLANTILLA_LIBROS_UNIFICADOS.xlsx)**

Nota: Estos valores proceden de los comentarios (tooltips) de celdas en la plantilla oficial. Sirven para validar/normalizar los campos codificados del libro. En la UI, se deben presentar como selectores o valores sugeridos por defecto cuando sea posible.

Expedidas_INGRESOS — Códigos principales
- Tipo de Factura (columna "Tipo de Factura"): F1, F2, F3, F4, R1, R2, R3, R4, R5, SF
  - F1: Factura en la que se identifica al destinatario
  - F2: Factura sin identificación del destinatario
  - F3: Factura sustitutiva sin una anotación negativa
  - F4: Asiento resumen de facturas
  - R1..R5: Facturas rectificativas (varios supuestos, art. 80 LIVA)
  - SF: Asiento sin factura
- Concepto de Ingreso ("Concepto de Ingreso"): I01..I09
  - I01: Ingresos de explotación
  - I02: Ingresos financieros derivados del aplazamiento o fraccionamiento de operaciones
  - I03: Ingresos por subvenciones corrientes
  - I04: Imputación de ingresos por subvenciones de capital
  - I05: IVA devengado (recargo equivalencia y/o recargo de agricultura, ganadería y pesca)
  - I06: Variación de existencias (incremento)
  - I07: Otros ingresos
  - I08: Autoconsumo de bienes y servicios
  - I09: Transmisión elementos patrimoniales (libertad amortización...)
- Clave de Operación ("Clave de Operación"): 01..15 (regímenes especiales y supuestos)
  - 01: Régimen general; 02: Exportación; 03: Bienes usados; 04: Oro inversión; 05: Agencias de viajes; 06: Grupo de entidades; 07: Criterio de caja; 08: IPSI/IGIC; 09: Mediación AAVV; 10: Cobros por cuenta de terceros; 11..13: Arrendamiento local (varios); 14..15: Devengo diferido (certificaciones/tracto sucesivo)
- Calificación de la Operación: S1, S2, N1, N2
  - S1: Sujeta y no exenta sin ISP; S2: Sujeta y no exenta con ISP; N1: No sujeta (art. 7, 14, otros); N2: No sujeta por reglas de localización
- Operación Exenta: E1..E6 (artículos 20..25 y otros)

Actividad (común expedidas/recibidas)
- Tipo de Actividad: A, B, C, D
  - A: Incluidas en IAE; B: No incluidas en IAE; C: Actividades no iniciadas; D: Arrendadores de inmuebles no incluidos en los códigos anteriores
- Subtipo / Grupo (resumen):
  - A: 01 Arrendadores de bienes inmuebles; 02 Ganadería independiente; 03 Resto de actividades empresariales
  - 04 Profesionales artísticos o deportivos; 05 Resto de profesionales
  - B: 01 Agrícola; 02 Ganadera dependiente; 03 Forestal; 04 Producción de mejillón en batea; 05 Pesquera (excepto mejillón en batea); 06 Otras actividades no incluidas

Identificación del destinatario/expedidor (común)
- Tipo (NIF en país de residencia): 02..06
  - 02: NIF-IVA intracomunitario; 03: Pasaporte; 04: Documento oficial de identificación; 05: Certificado de Residencia; 06: Otro documento probatorio

Cobro/Pago (criterio de caja)
- Medio utilizado: 01..05
  - 01: Transferencia; 02: Cheque; 03: No se cobra (devengo forzoso); 04: Otros medios; 05: Domiciliación bancaria

Inmueble
- Situación (1..5)
  - 1: RC en territorio común; 2: RC en País Vasco; 3: RC en Navarra; 4: Sin RC; 5: Extranjero

RECIBIDAS_GASTOS — Códigos principales
- Tipo de Factura: (mismo esquema F1..R5)
- Concepto de Gasto ("Concepto de Gasto"): G01..G46 (extracto)
  - G01: Compra de existencias
  - G02: Variación de existencias (disminución)
  - G03: Otros consumos de explotación
  - G04: Sueldos y salarios
  - G05: Seguridad Social a cargo de la empresa
  - G06: Seguridad Social y Aportaciones a mutualidades alternativas del titular (admitido hasta 1T 2024)
  - G45: Seguridad Social del titular de la actividad (usar desde 2025)
  - G46: Aportaciones a mutualidades alternativas del titular (usar desde 2025)
- Clave de Operación: 01..09 (incluye REAGYP, criterio de caja, IPSI/IGIC, adquisiciones interiores, etc.)

Bienes de Inversión — Tipo de Bien (extracto)
- 11: Terrenos (escombreras)
- 12: Edificaciones y Construcciones
- 21: Maquinaria; 22: Elementos de Transporte; 23: Equipos informáticos; 24: Mobiliario; 25: Instalaciones; 26: Barcos/Aeronaves; 27: Batea; 28: Útiles y Herramientas; 29: Otro Inmovilizado Material
- 31: Patentes/Marcas; 32: Derechos de Traspaso; 33: Aplicaciones Informáticas; 39: Otro Inmovilizado Intangible
- 41..43: Ganado y frutales (agrario)

Recomendaciones UI (MVP)
- Guardar en ajustes del contribuyente: Actividad (IAE) Código/Tipo y Grupo. Usar como defecto en nuevas líneas.
- Ingresos B2B UE (servicios): sugerir Tipo de Factura F1, Concepto de Ingreso I01, Calificación S1, Operación Exenta vacía. Clave de operación según flags (intracomunitaria, ISP, etc.).
- Seguridad Social del titular: mapear a G45 (desde 2025). Para ejercicios anteriores, permitir G06.
- Permitir selección manual cuando haya ambigüedad y recordar la elección por proveedor/categoría.

