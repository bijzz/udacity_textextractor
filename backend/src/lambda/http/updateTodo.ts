import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyHandler, APIGatewayProxyResult } from 'aws-lambda'
import { UpdateTodoRequest } from '../../requests/UpdateTodoRequest'
import { createLogger } from '../../utils/logger'
const logger = createLogger('updateTodo')

const docClient = new AWS.DynamoDB.DocumentClient()


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const todoId = event.pathParameters.todoId
  
  const updatedTodo: UpdateTodoRequest = JSON.parse(event.body)

  await docClient.update(  {
    TableName: process.env.TODO_TABLE,
    Key: {'todoId' : todoId},
    UpdateExpression : 'set #name = :todo_name, done = :done, dueDate = :due_date',
    ExpressionAttributeNames: {
        '#name' : 'name'
    },
    ExpressionAttributeValues: {
        ':todo_name' : updatedTodo.name,
        ':done' : updatedTodo.done,
        ':due_date' : updatedTodo.dueDate
    },
    ReturnValues : 'NONE',

  }).promise()

  logger.info("Updated Todo", {todoId: todoId})

  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      "todoId": todoId,
      "description": "Item updated"
    })
  }
}
