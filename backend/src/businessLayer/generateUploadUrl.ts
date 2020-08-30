import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { getUploadUrl, updateUploadUrl } from '../../service/persistance'
const logger = createLogger('uploadUrl')



export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const documentId = event.pathParameters.documentId

  const url = getUploadUrl(documentId)
  
  logger.info("Presigned URL fetched",{presignedUrl: url})

  await updateUploadUrl(documentId)

  logger.info("Updated database entry with attachment url ")

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

