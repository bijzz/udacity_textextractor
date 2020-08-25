import * as AWS  from 'aws-sdk'
const docClient = new AWS.DynamoDB.DocumentClient()
import { DocumentItem  } from '../models/DocumentItem'
import { UpdateDocumentRequest  } from '../requests/UpdateDocumentRequest'
const s3 = new AWS.S3({
    signatureVersion: 'v4'
  })
import { createLogger } from '../utils/logger'
const logger = createLogger('persistance')
var fs = require('fs')
, gm = require('gm').subClass({imageMagick: true});
var request = require('request-promise')

export async function persistDocument(newDocumentItem: DocumentItem) {
    logger.info("persistDocument", {newDocumentItem})
    return await docClient.put({
        TableName: process.env.DOCUMENT_TABLE,
        Item: newDocumentItem
    }).promise()
}

function createPreviewImage(localPdfPath:string) {
    return new Promise((resolve, reject) => {
    gm(localPdfPath.concat("[0]")) // [0]
    .thumb(
        200, // width
        200, // height
        process.env.TMP_FILE_PATH, // output file 
        80, // quality [0,100]
        (error, stdout, stderr, command) => {
            if (!error) {
            resolve(stdout)
            } else {
            logger.info("ImageMick conversion of PDF failed")
            logger.info(command)
            logger.info(stdout)
            logger.info(stderr)
            logger.info(error)
            reject(stderr)
            }
        }
    )
  })
}

export async function createAndPersistPreviewImage(key: string) {
    
    // see https://gist.github.com/jamilnyc/71bb717c95835bcc1d848b5158e90abb
    const url = process.env.DOCUMENT_URL.concat(key)
    logger.info("Create preview image from s3 file", {s3:url})

    const options = {
        url: url,
        encoding: null
      }

    const localPdfPath = process.env.TMP_FILE_PATH.concat(".pdf")
    const localPngPath = process.env.TMP_FILE_PATH

    const result = await request.get(options)
    const pdfBuffer = Buffer.from(result, 'utf8')
    fs.writeFileSync(localPdfPath, pdfBuffer)
    logger.info("Written S3 file to local storage", {path:localPdfPath})
    const gmResult = await createPreviewImage(localPdfPath)
    logger.info("GM finished", {result: gmResult})

    const newKey =  key.concat('-preview')
    logger.info("Perist preview image in s3 with new key ", {s3key: newKey})
    const pngBuffer = fs.readFileSync(localPngPath)
    const destparams = {
        Bucket: process.env.DOCUMENT_S3_BUCKET,
        Key: newKey,
        Body: pngBuffer,
        ContentType: "image"
    }

    await s3.putObject(destparams).promise()

    fs.unlinkSync(localPngPath)
    fs.unlinkSync(localPdfPath)

    return 
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


