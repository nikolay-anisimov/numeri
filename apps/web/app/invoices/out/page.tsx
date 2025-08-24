"use client"
import { useEffect, useMemo, useState } from 'react'

type InvoiceOut = {
  id: string
  issueDate: string
  series?: string | null
  number: string
  clientId: string
  base: number
  vatRate: number
  vatAmount: number
  total: number
  currency: string
}

export default function OutInvoicesPage() {
  const api = useMemo(() => process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000', [])
  const [rows, setRows] = useState<InvoiceOut[]>([])
  const [loading, setLoading] = useState(false)
  const [createdById, setCreatedById] = useState('')
  const [base, setBase] = useState('')
  const [clientId, setClientId] = useState('')

  useEffect(() => {
    ;(async () => {
      try {
        const res = await fetch(`${api}/invoices/out`)
        const json = await res.json()
        setRows(json)
      } catch (e) {
        console.error(e)
      }
    })()
  }, [api])

  const emitFromLast = async () => {
    try {
      if (!createdById) return alert('Indica createdById')
      setLoading(true)
      const payload: any = { createdById }
      if (base) payload.base = Number(base)
      if (clientId) payload.clientId = clientId
      const res = await fetch(`${api}/invoices/out/emit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error(`API error ${res.status}`)
      const json = await res.json()
      alert(`Emitida ${json.series ? json.series + '-' : ''}${json.number}`)
      // refresh list
      const list = await fetch(`${api}/invoices/out`).then((r) => r.json())
      setRows(list)
    } catch (e) {
      console.error(e)
      alert('No se pudo emitir la factura')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-medium">Facturas emitidas</h2>
      <div className="border rounded p-4 bg-white space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 items-center">
          <label className="text-sm">createdById</label>
          <input className="border p-2" value={createdById} onChange={(e) => setCreatedById(e.target.value)} />
          <label className="text-sm">Base (opcional)</label>
          <input className="border p-2" value={base} onChange={(e) => setBase(e.target.value)} placeholder="usa base anterior por defecto" />
          <label className="text-sm">ClientId (opcional)</label>
          <input className="border p-2" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="usa cliente anterior por defecto" />
          <button className="col-span-2 md:col-span-1 px-3 py-2 bg-blue-600 text-white rounded" onClick={emitFromLast} disabled={loading}>
            {loading ? 'Emitiendo…' : 'Emitir desde última'}
          </button>
        </div>
      </div>

      <div className="border rounded p-4 bg-white">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left">
              <th className="py-1">Fecha</th>
              <th>Número</th>
              <th>Base</th>
              <th>IVA</th>
              <th>Total</th>
              <th>Divisa</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t">
                <td className="py-1">{String(r.issueDate).slice(0, 10)}</td>
                <td>{r.series ? `${r.series}-` : ''}{r.number}</td>
                <td>{r.base}</td>
                <td>{r.vatAmount}</td>
                <td>{r.total}</td>
                <td>{r.currency}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
