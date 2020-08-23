import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
const docClient = new AWS.DynamoDB.DocumentClient()
import { createLogger } from '../../utils/logger'
const logger = createLogger('deleteTodo')

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId


  await docClient.delete({
    TableName: process.env.TODO_TABLE,
    Key: {
        todoId: todoId
    }
  }).promise()

  logger.info('Todo deleted', {todoId: todoId})

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      "todoId": todoId,
      "description": "Item deleted"
    })
}
}
