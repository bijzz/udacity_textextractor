import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'


const s3 = new AWS.S3({
  signatureVersion: 'v4'
})
const docClient = new AWS.DynamoDB.DocumentClient()

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId

  const url = getUploadUrl(todoId)

  await docClient.update(  {
    TableName: process.env.TODO_TABLE,
    Key: {'todoId' : todoId},
    UpdateExpression : 'set attachmentUrl = :attachment_url',
    ExpressionAttributeValues: {
        ':attachment_url' : process.env.ATTACHMENT_URL.concat(todoId)
    },
    ReturnValues : 'NONE',

  }).promise()

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      uploadUrl: url
    })
  }


}

function getUploadUrl(todoId: string) {
  return s3.getSignedUrl('putObject', {
    Bucket: process.env.ATTACHMENT_S3_BUCKET,
    Key: todoId,
    Expires: process.env.SIGNED_URL_EXPIRATION
  })
}