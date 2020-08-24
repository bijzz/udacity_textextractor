import 'source-map-support/register'
import * as uuid from 'uuid'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateDocumentRequest } from '../../requests/CreateDocumentRequest'
import { DocumentItem  } from '../../models/DocumentItem'
import { getUserId } from '../../auth/utils'
import { createLogger } from '../../utils/logger'
import { persistDocument } from '../../service/persistance'
const logger = createLogger('createTodo')


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodoRequest: CreateDocumentRequest = JSON.parse(event.body)

  //const parsedBody = JSON.parse(event.body)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const documentId = uuid.v4()
  let userId: string =  getUserId(jwtToken)

  const newDocumentItem : DocumentItem = {
  documentId: documentId,
  userId: userId,
  createdAt: new Date().toISOString(),
  name: newTodoRequest.name,
  dueDate: newTodoRequest.dueDate,
  done: false // attachment url empty?
  }

  await persistDocument(newDocumentItem)


  logger.info('New document created', {newDocumentItem})
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        "item": newDocumentItem
      })
  }
}
