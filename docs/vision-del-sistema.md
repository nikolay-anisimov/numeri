# Visión del sistema (MVP → escalable)
**Fecha:** 2025-08-24  
**Autor:** Nikolai Anisimov (autónomo)  
**Ámbito:** Gestión contable y fiscal para autónomos en España. Sin “servicio de gestoría”; el usuario (yo) controla y presenta.

## 1. Objetivo
Construir una herramienta propia que me permita **emitir facturas**, **registrar gastos**, **convertir divisas**, **preparar declaraciones trimestrales** (Modelos 130, 303 y 349) y **guardar toda la documentación por trimestres**, con soporte para **amortizaciones** (p. ej., ordenador) y **exportación de libros AEAT**. Debe sustituir a servicios como TaxScouts para mi caso particular, reduciendo coste y aumentando control.

## 2. Contexto y alcance
- **Actividad actual**: una factura **mensual** al **mismo cliente en Polonia (UE)**, en **USD**, por servicios B2B (operación intracomunitaria sin IVA repercutido en España; 349 clave **S**).  
- **Gastos**: pocas **facturas de software y oficina** al trimestre (algunas con **IVA soportado**).  
- **Inmovilizado**: compra de **ordenador** → amortización; IVA deducible en bienes de inversión.  
- **Histórico**: los **dos primeros trimestres del año** ya están **presentados** con TaxScouts; debo **importarlos** para continuar el ejercicio correctamente (bloquear lo ya presentado).

## 3. Usuario y modo de uso
- **Usuario único** (yo). Uso frecuente y rápido.  
- Flujo básico: emitir 1 factura/mes, subir 3–10 facturas de gasto/trim., pulsar “**Preparar trimestre**”, revisar y exportar libros/guías para presentación.

## 4. Flujo de trabajo ideal
1) **Emitir factura (mensual)**: formulario precargado con datos del mes anterior; puedo editar; genera PDF, asiento y línea candidata 349-S.  
2) **Registrar gasto**: subo PDF → OCR+LLM extrae datos → puedo corregir → clasifica tipo de gasto, **IVA** y **divisa**; convierte a EUR por **tipo oficial** en fecha de devengo.  
3) **(Futuro)** Conexión bancaria para importar movimientos (p. ej., Seguridad Social).  
4) **Fin de trimestre**: botón **“Preparar trimestre”** que calcula 130/303/349 y muestra **hoja guía** con casillas y **exporta Libros AEAT**.  
5) **Fin de año**: resúmenes anuales y ayuda para la sección de **actividades económicas** del **Modelo 100**.  
6) **Archivo por trimestres**: histórico de facturas (PDF), libros (XLSX/CSV) y totales.

## 5. Requisitos clave (resumen)
- **Multidivisa** con tipos **BCE** por fecha.  
- **OCR+LLM** para capturar datos de facturas y proponer clasificación/IVA.  
- **Inmovilizado y amortización** (ordenador) con asiento automático periódico.  
- **Export** de **Libros AEAT** (ingresos/recibidas) y hoja guía para 130/303/349.  
- **Importación** de trimestres previos (bloqueados).  
- **Trazabilidad**: conservar importe original, moneda, **fx aplicado** y origen del dato.

## 6. Criterios de éxito (MVP)
- Generar sin errores los **Libros AEAT** y los **cálculos** para 130/303/349 del trimestre actual.  
- Emisión de factura mensual en < 1 minuto con precarga correcta.  
- OCR con **≥ 80 %** de aciertos de campos clave (fecha, proveedor/cliente, base, IVA, total), siempre **editable**.

## 7. No objetivos (de momento)
- No presentar declaraciones automáticamente ante AEAT.  
- No multiusuario/gestoría.  
- No contabilidad completa por partidas dobles fuera del alcance definido.
