declare module 'xlsx' {
  export interface WorkBook {
    SheetNames: string[]
    Sheets: Record<string, any>
  }

  export const SSF: {
    parse_date_code(n: number): { y: number; m: number; d: number; H?: number; M?: number; S?: number } | null
  }

  export const utils: {
    sheet_to_json(ws: any, opts?: any): any[]
    aoa_to_sheet(data: any[][], opts?: any): any
    book_new(): WorkBook
    book_append_sheet(wb: WorkBook, ws: any, name: string): void
  }

  export function readFile(path: string, opts?: any): WorkBook
  export function writeFile(wb: WorkBook, path: string, opts?: any): void
}
