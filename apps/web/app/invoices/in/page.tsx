"use client"
import { useState } from 'react'

export default function InInvoicesPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const onUpload = async () => {
    if (!file) return
    setLoading(true)
    try {
      const form = new FormData()
      form.append('file', file)
      const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'
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
      {result && (
        <pre className="bg-gray-900 text-gray-100 p-3 rounded text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre>
      )}
    </div>
  )
}

