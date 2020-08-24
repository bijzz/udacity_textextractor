import * as AWS  from 'aws-sdk'
const docClient = new AWS.DynamoDB.DocumentClient()
import { DocumentItem  } from '../models/DocumentItem'
import { UpdateDocumentRequest  } from '../requests/UpdateDocumentRequest'
const s3 = new AWS.S3({
    signatureVersion: 'v4'
  })
import { createLogger } from '../utils/logger'
const logger = createLogger('persistance')
    
export async function persistDocument(newDocumentItem: DocumentItem) {
    logger.info("persistDocument", {newDocumentItem})
    return await docClient.put({
        TableName: process.env.DOCUMENT_TABLE,
        Item: newDocumentItem
    }).promise()
}

export async function deleteDocument(documentId: string) {
    logger.info("deleteDocument", {documentId})
    return await docClient.delete({
        TableName: process.env.DOCUMENT_TABLE,
        Key: {
            documentId: documentId
        }
      }).promise()
}

export async function getDocument(userId: string) {
    logger.info("getDocument ", {userId})
    // get via hashkey / better for bulk retrival
    // query have filter extensions servers-side
    return await docClient.query({
        TableName : process.env.DOCUMENT_TABLE,
        IndexName : process.env.DOCUMENT_TABLE_IDX_NAME,
        KeyConditionExpression: 'userId = :userId', // :value's are specified below in the ExpressionAttributeValues
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise()
}

export async function updateDocument(documentId: string, updatedDocument:UpdateDocumentRequest) {
    logger.info("updateDocument ", {documentId: documentId, updateDocument: updatedDocument})
    return await docClient.update(  
        {
        TableName: process.env.DOCUMENT_TABLE,
        Key: {'documentId' : documentId},
        UpdateExpression : 'set #name = :document_name, done = :done, dueDate = :due_date',
        ExpressionAttributeNames: {
            '#name' : 'name'
        },
        ExpressionAttributeValues: {
            ':document_name' : updatedDocument.name,
            ':done' : updatedDocument.done,
            ':due_date' : updatedDocument.dueDate
        },
        ReturnValues : 'NONE',
    
      }).promise()
}





export function getUploadUrl(documentId: string) {
    logger.info("getUploadUrl ", {documentId})
    return s3.getSignedUrl('putObject', {
      Bucket: process.env.DOCUMENT_S3_BUCKET,
      Key: documentId,
      Expires: process.env.SIGNED_URL_EXPIRATION
    })
  }

  export async function updateUploadUrl(documentId: string) {
    logger.info("updateUploadUrl ", {documentId,url:process.env.DOCUMENT_URL.concat(documentId)})
      await docClient.update(  {
        TableName: process.env.DOCUMENT_TABLE,
        Key: {'documentId' : documentId},
        UpdateExpression : 'set attachmentUrl = :DOCUMENT_URL',
        ExpressionAttributeValues: {
            ':DOCUMENT_URL' : process.env.DOCUMENT_URL.concat(documentId)
        },
        ReturnValues : 'NONE',
    
      }).promise()
  }


