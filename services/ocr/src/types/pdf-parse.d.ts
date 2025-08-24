declare module 'pdf-parse' {
  export interface PDFMeta { info?: any; metadata?: any }
  export interface PDFResult { text: string; meta?: PDFMeta }
  function pdfParse(data: Buffer | Uint8Array, options?: any): Promise<PDFResult>
  export default pdfParse
}

