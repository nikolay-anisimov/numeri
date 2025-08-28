"use client"
import { useEffect, useMemo, useState } from 'react'

type Supplier = { id: string; name: string; nif: string; euVatNumber?: string | null; countryCode: string }

export default function InInvoicesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [supplierId, setSupplierId] = useState<string>('')
  const [creatingSupplier, setCreatingSupplier] = useState(false)
  const [newSupplier, setNewSupplier] = useState<{ name: string; nif: string; euVatNumber?: string; countryCode: string }>({ name: '', nif: '', euVatNumber: '', countryCode: 'ES' })
  const api = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', [])

  useEffect(() => {
    // Load suppliers
    ;(async () => {
      try {
        const res = await fetch(`${api}/third-parties`)
        const json = await res.json()
        setSuppliers(json.filter((x: any) => x.type === 'SUPPLIER'))
      } catch (e) {
        console.error('Failed to fetch suppliers', e)
      }
    })()
  }, [api])

  const onUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const res = await fetch(`${api}/files/parse`, { method: 'POST', body: form })
      const json = await res.json()
      setResult(json)
    } catch (e) {
      console.error(e)
      alert('Upload failed')
    } finally {
      setLoading(false)
    }
  }

  const parsed = result?.parsed || null

  const onCreateSupplier = async () => {
    try {
      setCreatingSupplier(true)
      const res = await fetch(`${api}/third-parties`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'SUPPLIER', ...newSupplier })
      })
      const json = await res.json()
      setSuppliers((prev) => [...prev, json])
      setSupplierId(json.id)
      setNewSupplier({ name: '', nif: '', euVatNumber: '', countryCode: 'ES' })
    } catch (e) {
      console.error(e)
      alert('No se pudo crear el proveedor')
    } finally {
      setCreatingSupplier(false)
    }
  }

  const [formState, setFormState] = useState({
    issueDate: '',
    base: '',
    vatRate: '',
    vatAmount: '',
    total: '',
    currency: 'EUR',
    deductible: true,
    category: '',
    assetFlag: false,
    notes: '',
    createdById: '',
    codeTipoFactura: 'F1',
    codeConceptoGasto: 'G01',
    codeClaveOperacion: '01'
  })

  useEffect(() => {
    if (!parsed) return
    setFormState((s) => ({
      ...s,
      issueDate: parsed.issueDate || new Date().toISOString().slice(0, 10),
      base: String(parsed.baseAmount ?? ''),
      vatRate: String(parsed.vatRate ?? ''),
      vatAmount: String(parsed.vatAmount ?? ''),
      total: String(parsed.totalAmount ?? ''),
      currency: parsed.currency || 'EUR'
    }))
  }, [parsed])

  const onSave = async () => {
    try {
      if (!supplierId) return alert('Selecciona o crea un proveedor')
      if (!formState.createdById) return alert('Indica createdById (usuario)')
      const payload = {
        issueDate: formState.issueDate,
        supplierId,
        base: Number(formState.base),
        vatRate: Number(formState.vatRate || 0),
        vatAmount: Number(formState.vatAmount || 0),
        total: Number(formState.total),
        currency: formState.currency,
        deductible: formState.deductible,
        category: formState.category || undefined,
        assetFlag: formState.assetFlag,
        notes: formState.notes || undefined,
        codeTipoFactura: formState.codeTipoFactura,
        codeConceptoGasto: formState.codeConceptoGasto,
        codeClaveOperacion: formState.codeClaveOperacion,
        createdById: formState.createdById
      }
      const res = await fetch(`${api}/invoices/in`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      alert('Factura guardada')
      setResult(null)
    } catch (e) {
      console.error(e)
      alert('No se pudo guardar la factura')
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Facturas recibidas</h2>
      <div className="border rounded p-4 bg-white">
        <input
          type="file"
          accept="application/pdf,image/*"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <button className="ml-2 px-3 py-2 bg-blue-600 text-white rounded" onClick={onUpload} disabled={!file || loading}>
          {loading ? 'Procesando…' : 'Subir y procesar'}
        </button>
      </div>
      {parsed && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="border rounded p-4 bg-white space-y-3">
            <h3 className="font-medium">Proveedor</h3>
            <label className="block text-sm">Seleccionar</label>
            <select className="border p-2 w-full" value={supplierId} onChange={(e) => setSupplierId(e.target.value)}>
              <option value="">— Selecciona proveedor —</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.nif})
                </option>
              ))}
            </select>
            <div className="text-xs text-gray-500">O crea uno nuevo:</div>
            <div className="grid grid-cols-2 gap-2">
              <input className="border p-2" placeholder="Nombre" value={newSupplier.name} onChange={(e) => setNewSupplier({ ...newSupplier, name: e.target.value })} />
              <input className="border p-2" placeholder="NIF" value={newSupplier.nif} onChange={(e) => setNewSupplier({ ...newSupplier, nif: e.target.value })} />
              <input className="border p-2" placeholder="NIF-IVA UE (opcional)" value={newSupplier.euVatNumber} onChange={(e) => setNewSupplier({ ...newSupplier, euVatNumber: e.target.value })} />
              <input className="border p-2" placeholder="País (ES, PL, …)" value={newSupplier.countryCode} onChange={(e) => setNewSupplier({ ...newSupplier, countryCode: e.target.value.toUpperCase() })} />
            </div>
            <button className="mt-2 px-3 py-2 bg-gray-700 text-white rounded" onClick={onCreateSupplier} disabled={creatingSupplier}>
              {creatingSupplier ? 'Creando…' : 'Crear y usar'}
            </button>
          </div>

          <div className="border rounded p-4 bg-white space-y-3">
            <h3 className="font-medium">Datos de la factura</h3>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-sm">Fecha</label>
              <input className="border p-2" type="date" value={formState.issueDate} onChange={(e) => setFormState({ ...formState, issueDate: e.target.value })} />
              <label className="text-sm">Base</label>
              <input className="border p-2" type="number" value={formState.base} onChange={(e) => setFormState({ ...formState, base: e.target.value })} />
              <label className="text-sm">Tipo IVA %</label>
              <input className="border p-2" type="number" value={formState.vatRate} onChange={(e) => setFormState({ ...formState, vatRate: e.target.value })} />
              <label className="text-sm">Cuota IVA</label>
              <input className="border p-2" type="number" value={formState.vatAmount} onChange={(e) => setFormState({ ...formState, vatAmount: e.target.value })} />
              <label className="text-sm">Total</label>
              <input className="border p-2" type="number" value={formState.total} onChange={(e) => setFormState({ ...formState, total: e.target.value })} />
              <label className="text-sm">Divisa</label>
              <input className="border p-2" value={formState.currency} onChange={(e) => setFormState({ ...formState, currency: e.target.value.toUpperCase() })} />
              <label className="text-sm">Tipo de Factura</label>
              <select className="border p-2" value={formState.codeTipoFactura} onChange={(e) => setFormState({ ...formState, codeTipoFactura: e.target.value })}>
                <option value="F1">F1 — Identifica destinatario</option>
                <option value="F2">F2 — Sin identificar destinatario</option>
                <option value="F3">F3 — Sustitutiva</option>
                <option value="F4">F4 — Asiento resumen</option>
                <option value="R1">R1 — Rectif. (varios)</option>
                <option value="R2">R2 — Rectif. (concurso)</option>
                <option value="R3">R3 — Rectif. (incobrable)</option>
                <option value="R4">R4 — Rectif. (resto)</option>
                <option value="R5">R5 — Rectif. (simplificadas)</option>
                <option value="SF">SF — Asiento sin factura</option>
              </select>
              <label className="text-sm">Concepto de Gasto</label>
              <select className="border p-2" value={formState.codeConceptoGasto} onChange={(e) => setFormState({ ...formState, codeConceptoGasto: e.target.value })}>
                <option value="G01">G01 — Compra de existencias</option>
                <option value="G03">G03 — Otros consumos</option>
                <option value="G04">G04 — Sueldos y salarios</option>
                <option value="G05">G05 — SS empresa</option>
                <option value="G45">G45 — SS titular (recomendado)</option>
                <option value="G46">G46 — Mutualidades titular</option>
              </select>
              <label className="text-sm">Clave de Operación</label>
              <select className="border p-2" value={formState.codeClaveOperacion} onChange={(e) => setFormState({ ...formState, codeClaveOperacion: e.target.value })}>
                <option value="01">01 — Régimen general</option>
                <option value="07">07 — Criterio de caja</option>
                <option value="08">08 — IPSI/IGIC</option>
                <option value="09">09 — AAVV mediación</option>
              </select>
              <label className="text-sm">Categoría</label>
              <input className="border p-2" value={formState.category} onChange={(e) => setFormState({ ...formState, category: e.target.value })} />
              <label className="text-sm">Notas</label>
              <input className="border p-2" value={formState.notes} onChange={(e) => setFormState({ ...formState, notes: e.target.value })} />
              <label className="text-sm">Bien de inversión</label>
              <input className="border p-2" type="checkbox" checked={formState.assetFlag} onChange={(e) => setFormState({ ...formState, assetFlag: e.target.checked })} />
              <label className="text-sm">Deducible</label>
              <input className="border p-2" type="checkbox" checked={formState.deductible} onChange={(e) => setFormState({ ...formState, deductible: e.target.checked })} />
              <label className="text-sm">createdById</label>
              <input className="border p-2" value={formState.createdById} onChange={(e) => setFormState({ ...formState, createdById: e.target.value })} />
            </div>
            <button className="mt-2 px-3 py-2 bg-green-600 text-white rounded" onClick={onSave}>Guardar factura</button>
          </div>

          <div className="md:col-span-2">
            <h3 className="font-medium">OCR (depuración)</h3>
            <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
          </div>
        </div>
      )}
    </div>
  )
}
