import * as AWS  from 'aws-sdk'
const docClient = new AWS.DynamoDB.DocumentClient()
import { DocumentItem  } from '../models/DocumentItem'
import { UpdateDocumentRequest  } from '../requests/UpdateDocumentRequest'
const s3 = new AWS.S3({
    signatureVersion: 'v4'
  })

    
export async function persistDocument(newDocumentItem: DocumentItem) {
    return await docClient.put({
        TableName: process.env.DOCUMENT_TABLE,
        Item: newDocumentItem
    }).promise()
}

export async function deleteDocument(documentId: string) {
    return await docClient.delete({
        TableName: process.env.DOCUMENT_TABLE,
        Key: {
            todoId: documentId
        }
      }).promise()
}

export async function getDocument(userId: string) {
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
    return await docClient.update(  {
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
    return s3.getSignedUrl('putObject', {
      Bucket: process.env.DOCUMENT_S3_BUCKET,
      Key: documentId,
      Expires: process.env.SIGNED_URL_EXPIRATION
    })
  }

  export async function updateUploadUrl(documentId: string) {
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


