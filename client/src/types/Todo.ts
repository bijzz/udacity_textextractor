export interface Todo {
  documentId: string
  createdAt: string
  name: string
  ocr:string
  dueDate: string
  done: boolean
  attachmentUrl?: string
}
