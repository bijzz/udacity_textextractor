import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { deleteDocument } from '../../businessLayer/documents'

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const documentId = event.pathParameters.documentId

  await deleteDocument(documentId)


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
