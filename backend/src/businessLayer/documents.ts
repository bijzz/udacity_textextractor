import { triggerTextract, removeDocument, getDocument, fetchPersistTextractresult, createAndPersistImage, persistDocument, deleteDocument, getUploadUrl, updateUploadUrl  } from '../dataLayer/persistance'
import { createLogger } from '../utils/logger'
const logger = createLogger('documents')
import { CreateDocumentRequest } from '../requests/CreateDocumentRequest'
import * as uuid from 'uuid'
import { getUserId } from '../auth/utils'
import { DocumentItem } from '../models/DocumentItem'

export async function createDocument(newDoc:CreateDocumentRequest, jwtToken:string) {
  
  const documentId = uuid.v4()
  let userId: string =  getUserId(jwtToken)

  const newDocumentItem : DocumentItem = {
  documentId: documentId,
  userId: userId,
  createdAt: new Date().toISOString(),
  name: newDoc.name,
  dueDate: newDoc.dueDate,
  done: false // attachment url empty?
  }
  await persistDocument(newDocumentItem)
  logger.info('New document created', { newDocumentItem })
  
  return newDocumentItem
}

export async function createPreviewImage(key: string) { 
  
  logger.info("Processing S3 item ", {key:key})
  await createAndPersistImage(key)
  const response = await triggerTextract(key)
  console.log(response)
 
}

export async function deleteDocument(documentId: string) {
  await removeDocument(documentId)
  logger.info('Document deleted', {documentId: documentId})
}

export async function fetchUploadUrl(documentId: string) {
  const url = getUploadUrl(documentId)
  logger.info("Presigned URL fetched",{presignedUrl: url})
  await updateUploadUrl(documentId)
  logger.info("Updated database entry with attachment url ")
  return url
}

export async function getDocument(jwtToken:string) {
  
  let userId: string =  getUserId(jwtToken)
  const result = await getDocument(userId)
  logger.info("Fetched Todos", { userId: userId })
  return result

}

export async function storeOcrResult(jobId: string, key: string) {
  logger.info("Fetching text extraction results")
  await fetchPersistTextractresult(jobId, key)
}