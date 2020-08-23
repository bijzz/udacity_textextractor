import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { getUploadUrl, updateUploadUrl } from '../../service/persistance'
const logger = createLogger('uploadUrl')



export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const documentId = event.pathParameters.documentId

  const url = getUploadUrl(documentId)


  await updateUploadUrl(documentId)

  logger.debug("Presigned URL fetched",{presignedUrl: url})

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

