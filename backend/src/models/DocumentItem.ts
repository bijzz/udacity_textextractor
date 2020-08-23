export interface DocumentItem {
  userId: string
  documentId: string
  createdAt: string
  name: string
  dueDate: string
  done: boolean
  attachmentUrl?: string
}
