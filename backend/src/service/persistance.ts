import * as AWS  from 'aws-sdk'
const docClient = new AWS.DynamoDB.DocumentClient()
import { TodoItem  } from '../models/TodoItem'
import { UpdateTodoRequest  } from '../requests/UpdateTodoRequest'
const s3 = new AWS.S3({
    signatureVersion: 'v4'
  })

    
export async function persistTodo(newToDoItem: TodoItem) {
    return await docClient.put({
        TableName: process.env.TODO_TABLE,
        Item: newToDoItem
    }).promise()
}

export async function deleteTodo(todoId: string) {
    return await docClient.delete({
        TableName: process.env.TODO_TABLE,
        Key: {
            todoId: todoId
        }
      }).promise()
}

export async function getTodo(userId: string) {
    // get via hashkey / better for bulk retrival
    // query have filter extensions servers-side
    return await docClient.query({
        TableName : process.env.TODO_TABLE,
        IndexName : process.env.TODO_TABLE_IDX_NAME,
        KeyConditionExpression: 'userId = :userId', // :value's are specified below in the ExpressionAttributeValues
        ExpressionAttributeValues: {
            ':userId': userId
        }
    }).promise()
}

export async function updateTodo(todoId: string, updatedTodo:UpdateTodoRequest) {
    return await docClient.update(  {
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
}





export function getUploadUrl(todoId: string) {
    return s3.getSignedUrl('putObject', {
      Bucket: process.env.ATTACHMENT_S3_BUCKET,
      Key: todoId,
      Expires: process.env.SIGNED_URL_EXPIRATION
    })
  }

  export async function updateUploadUrl(todoId: string) {
      await docClient.update(  {
        TableName: process.env.TODO_TABLE,
        Key: {'todoId' : todoId},
        UpdateExpression : 'set attachmentUrl = :attachment_url',
        ExpressionAttributeValues: {
            ':attachment_url' : process.env.ATTACHMENT_URL.concat(todoId)
        },
        ReturnValues : 'NONE',
    
      }).promise()
  }


