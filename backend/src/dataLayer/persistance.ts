import * as AWS  from 'aws-sdk'
const docClient = new AWS.DynamoDB.DocumentClient()
import { DocumentItem  } from '../models/DocumentItem'
import { UpdateDocumentRequest  } from '../requests/UpdateDocumentRequest'
const s3 = new AWS.S3({
    signatureVersion: 'v4'
  })
import { createLogger } from '../utils/logger'
const textract = new AWS.Textract()

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

// function awsTextract(params) {
//     return new Promise((resolve, reject) => {
//         const textract = new AWS.Textract()
//         textract.analyzeDocument(params, (err, data) => {
//             if (err) reject(err.stack)
//             else     resolve(data)          // successful response
//         }
//         )
//   })
// }

export async function fetchPersistTextractresult(jobid: string, key: string) {
  //const targetKey = key.concat("-txt")
  const job = { JobId: jobid }
  logger.info("jobId",job)
  const extractedText = await textract.getDocumentTextDetection(job).promise()
  var text:string = ""
  for (const block of extractedText.Blocks) {
    if (block.BlockType === "LINE" && block.Text) {
      text = text + block.Text
    }
  }
  logger.debug("Result", extractedText)
  

  // var jp = require('jsonpath')
  // const text = jp.query(extractedText, '$..Text').join(" ")
  // const destparams = {
  //   Bucket: process.env.DOCUMENT_S3_BUCKET,
  //   Key: targetKey,
  //   Body: text
  // }

  logger.info("Persisting extracted text")
  //logger.debug("S3 parameters", destparams)

  await docClient.update(  
    {
    TableName: process.env.DOCUMENT_TABLE,
    Key: {'documentId' : key},
    UpdateExpression : 'set #textract = :text',
    ExpressionAttributeNames: {
        '#textract' : 'textract'
    },
    ExpressionAttributeValues: {
        ':text' : text
    },
    ReturnValues : 'NONE',

  }).promise()

  // logger.info("Persisting text extraction results", {key: targetKey})
  // await s3.putObject(destparams).promise()    
}

export async function triggerTextract(key:string) {
    const params = {
        DocumentLocation: {
          S3Object: {
            Bucket: process.env.DOCUMENT_S3_BUCKET,
            Name: key
          }
        },
        NotificationChannel: {
          RoleArn: process.env.TEXTRACT_ROLE,
          SNSTopicArn: process.env.OCR_SNS_TOPIC_ARN
        }
    }
  logger.info("Trigger text extraction", {params: params})
      
      await textract.startDocumentTextDetection(params).promise()

}

function createPreviewImage(localPdfPath:string) {
    return new Promise((resolve, reject) => {
    gm(localPdfPath.concat("[0]")) // [0]
    .thumb(
        200, // width
        200, // height
        process.env.TMP_FILE_PATH_PREVIEW, // output file 
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

// function createImage(localPdfPath:string) {
//     return new Promise((resolve, reject) => {
//     gm(localPdfPath) // [0]
//     .setFormat("png")
//     .resize(800)
//     .quality(80)
//     .write(process.env.TMP_FILE_PATH_FULL, (err)  => {
//         if (!err) {
//             resolve("conversion succeded")
//         }  else {
//             reject(err)
//         }
//     }
//     )
//     })
// }

async function persistImage(key: string, suffix:string, localPath:string) {
    const newKey =  key.concat(suffix)
    logger.info("Perist image in s3 with new key ", {s3key: newKey})
    const pngBuffer = fs.readFileSync(localPath)
    const destparams = {
        Bucket: process.env.DOCUMENT_S3_BUCKET,
        Key: newKey,
        Body: pngBuffer,
        ContentType: "image"
    }
    return await s3.putObject(destparams).promise()
}

export async function createAndPersistImage(key: string) {
    
    // see https://gist.github.com/jamilnyc/71bb717c95835bcc1d848b5158e90abb
    const url = process.env.DOCUMENT_URL.concat(key)
    logger.info("Create preview image from s3 file", {s3:url})

    const options = {
        url: url,
        encoding: null
      }

    const localPdfPath = process.env.TMP_FILE_PATH_PDF
    const localPngPreviewPath = process.env.TMP_FILE_PATH_PREVIEW
    // const localPngPath = process.env.TMP_FILE_PATH_FULL

    const result = await request.get(options)
    const pdfBuffer = Buffer.from(result, 'utf8')
    fs.writeFileSync(localPdfPath, pdfBuffer)
    logger.info("Written S3 file to local storage", {path:localPdfPath})
    const previewImageResult = await createPreviewImage(localPdfPath)
    logger.info("Preview image creation is done", {result: previewImageResult})
    // const imageResult = await createImage(localPdfPath)
    // logger.info("Full image creation is done", {result: imageResult})

    await persistImage(key, process.env.IMG_PREVIEW_SUFFIX, localPngPreviewPath)
    logger.info("Persist of preview image is done")
    // await persistImage(key, process.env.IMG_FULL_SUFFIX, localPngPath)
    // logger.info("Persist of full image is done")

    fs.unlinkSync(localPngPreviewPath)
    // fs.unlinkSync(localPngPath)
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


