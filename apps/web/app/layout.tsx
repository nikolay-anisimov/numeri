import './globals.css'
import React from 'react'

export const metadata = {
  title: 'Numeri',
  description: 'Freelancer accounting for Spain'
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-gray-50 text-gray-900">
        <div className="max-w-6xl mx-auto p-4">
          <header className="flex items-center justify-between py-4">
            <h1 className="text-xl font-semibold">Numeri</h1>
            <nav className="flex gap-4 text-sm">
              <a href="/invoices/in" className="hover:underline">Facturas recibidas</a>
              <a href="/invoices/out" className="hover:underline">Facturas emitidas</a>
              <a href="/tax/summary" className="hover:underline">Impuestos</a>
              <a href="/settings" className="hover:underline">Ajustes</a>
            </nav>
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  )
}

