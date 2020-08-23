import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
//import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'
//const util = require('util')

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
// const jwksUrl = process.env.JWT_SET_URL

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {
  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  if (!authHeader) throw new Error('Authentication Header not available')

  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt
  logger.info('Authheader', {autheader: authHeader})
  logger.info('Trying to verify token', {token: token})



  var jwksClient = require('jwks-rsa');
  var client = jwksClient({
    jwksUri: process.env.AUTH_0_JWKS
  });
  
  logger.info('Kid', {kid: jwt.header.kid})

  const key = await client.getSigningKeyAsync(jwt.header.kid)//, function(err, key) {
  const pubKey = key.publicKey || key.rsaPublicKey
  logger.info('pubKey', {pubKey: pubKey})

  //     if (err) {
  //       throw new Error('Kid not found in JWKS')
  //     }
  //     const signingKey = key.getPublicKey()
  //     logger.info('Pubkey', {pubkey: signingKey})
  //     return  verify(token, signingKey, { algorithms: ["RS256"] }) as JwtPayload
  //   })
  return verify(token, pubKey, { algorithms: ["RS256"] }) as JwtPayload

}



function getToken(authHeader: string): string {
  if (!authHeader) throw new Error('No authentication header')

  if (!authHeader.toLowerCase().startsWith('bearer '))
    throw new Error('Invalid authentication header')

  const split = authHeader.split(' ')
  const token = split[1]

  return token
}
