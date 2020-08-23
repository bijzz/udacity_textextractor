import 'source-map-support/register'
import * as AWS  from 'aws-sdk'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUserId } from '../../auth/utils'
import { createLogger } from '../../utils/logger'
const logger = createLogger('getTodo')

const docClient = new AWS.DynamoDB.DocumentClient()

export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  //const userId = event.pathParameters.groupId

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  let userId: string =  getUserId(jwtToken)

  // get via hashkey / better for bulk retrival
  // query have filter extensions servers-side
  const result = await docClient.query({
    TableName : process.env.TODO_TABLE,
    IndexName : process.env.TODO_TABLE_IDX_NAME,
    KeyConditionExpression: 'userId = :userId', // :value's are specified below in the ExpressionAttributeValues
    ExpressionAttributeValues: {
        ':userId': userId
    }
}).promise()

logger.info("Fetched Todos", {userId: userId})

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items: result.Items
    })
  }


}
