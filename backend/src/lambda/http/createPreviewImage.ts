import 'source-map-support/register'
import { S3Handler, S3Event } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
const logger = createLogger('createPreviewImage')

export const handler: S3Handler = async (events: S3Event) => {
    logger.info("Start to create a preview image of pdf")
    //const a = events
    for (const record of events.Records) {
        const key = record.s3.object.key
        logger.info("Processing S3 item ", key)
    }
    return 
}

