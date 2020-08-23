import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult, APIGatewayProxyHandler } from 'aws-lambda'
import { getUserId } from '../../auth/utils'
import { createLogger } from '../../utils/logger'
import { getDocument } from '../../service/persistance'
const logger = createLogger('getTodo')


export const handler: APIGatewayProxyHandler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {

  //const userId = event.pathParameters.groupId

  const authorization = event.headers.Authorization
  const split = authorization.split(' ')
  const jwtToken = split[1]

  let userId: string =  getUserId(jwtToken)
  
  const result = await getDocument(userId)

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
