import 'source-map-support/register'
import { S3Handler, S3Event } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { triggerTextract, createAndPersistImage } from '../../service/persistance'

const logger = createLogger('createPreviewImage')

export const handler: S3Handler = async (events: S3Event) => {
    logger.info("S3 Event initiated; begin to create a preview image of pdf")
    //const a = events
    for (const record of events.Records) {
        const key = record.s3.object.key
        if (!key.includes(process.env.IMG_PREVIEW_SUFFIX) 
            // &&
            // !key.includes(process.env.IMG_FULL_SUFFIX) 
            ) { // avoid infinite loop
            logger.info("Processing S3 item ", {key:key})
            await createAndPersistImage(key)
            const response = await triggerTextract(key)
            console.log(response)
        }
    }
    return 
}

