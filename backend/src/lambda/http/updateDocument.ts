import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateDocumentRequest } from '../../requests/UpdateDocumentRequest'
import { createLogger } from '../../utils/logger'
import { updateDocument } from '../../service/persistance'
const logger = createLogger('updateTodo')


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const documentId = event.pathParameters.documentId
  
  const updatedTodo: UpdateDocumentRequest = JSON.parse(event.body)

  await updateDocument(documentId, updatedTodo)

  logger.info("Updated Todo", {documentId: documentId})

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      "documentId": documentId,
      "description": "Item updated"
    })
  }
}
