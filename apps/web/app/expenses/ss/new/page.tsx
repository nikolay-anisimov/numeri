export default function NewSeguridadSocial() {
  async function create(formData: FormData) {
    'use server'
    const issueDate = String(formData.get('date') || '')
    const amount = Number(formData.get('amount') || 0)
    const createdById = String(process.env.NEXT_PUBLIC_DEFAULT_USER_ID || '')
    const api = String(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000')
    const res = await fetch(`${api}/invoices/in/ss`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ issueDate, amountEUR: amount, createdById, codeConceptoGasto: 'G45' })
    })
    if (!res.ok) throw new Error('Failed to create Seguridad Social record')
  }

  const today = new Date().toISOString().slice(0, 10)
  return (
    <div style={{ padding: 16 }}>
      <h1>Nueva Seguridad Social (mensual)</h1>
      <form action={create}>
        <label>
          Fecha:
          <input name="date" type="date" defaultValue={today} required />
        </label>
        <br />
        <label>
          Importe EUR:
          <input name="amount" type="number" step="0.01" required />
        </label>
        <br />
        <button type="submit">Guardar (Concepto G45)</button>
      </form>
      <p style={{ marginTop: 8, fontSize: 12 }}>
        Nota: Usa G45 (Seguridad Social del titular) por defecto; puedes ajustarlo después.
      </p>
    </div>
  )
}

