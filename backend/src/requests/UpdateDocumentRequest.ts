/**
 * Fields in a request to update a single TODO item.
 */
export interface UpdateDocumentRequest {
  name: string
  dueDate: string
  done: boolean
}