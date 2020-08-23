import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { deleteDocument } from '../../service/persistance'
import { createLogger } from '../../utils/logger'
const logger = createLogger('deleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const documentId = event.pathParameters.documentId

  await deleteDocument(documentId)

  logger.info('Document deleted', {documentId: documentId})

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      "documentId": documentId,
      "description": "Item deleted"
    })
}
}
