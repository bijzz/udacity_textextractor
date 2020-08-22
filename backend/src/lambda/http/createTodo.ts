import 'source-map-support/register'
import * as uuid from 'uuid'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
import { createLogger } from '../../utils/logger'
import { TodoItem  } from '../../models/TodoItem'
import * as AWS  from 'aws-sdk'
import { getUserId } from '../../auth/utils'
const logger = createLogger('createTodo')

const docClient = new AWS.DynamoDB.DocumentClient()

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodoRequest: CreateTodoRequest = JSON.parse(event.body)

  //const parsedBody = JSON.parse(event.body)
  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  const todoId = uuid.v4()
  let userId: string =  getUserId(jwtToken)

  const newToDoItem : TodoItem = {
  todoId: todoId,
  userId: userId,
  createdAt: new Date().toISOString(),
  name: newTodoRequest.name,
  dueDate: newTodoRequest.dueDate,
  done: false // attachment url empty?
  }


  await docClient.put({
    TableName: process.env.TODO_TABLE,
    Item: newToDoItem
  }).promise()

  logger.info('New todo to create', {newToDoItem})
    
    return {
      statusCode: 201,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Credentials': true
      },
      body: JSON.stringify({
        "item": newToDoItem
      })
  }
}
