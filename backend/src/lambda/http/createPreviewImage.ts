import 'source-map-support/register'
import { S3Handler, S3Event } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { createPreviewImage } from '../../businessLayer/documents'

const logger = createLogger('createPreviewImage')

export const handler: S3Handler = async (events: S3Event) => {
    logger.info("S3 Event initiated; begin to create a preview image of pdf")
    //const a = events
    for (const record of events.Records) {
        const key = record.s3.object.key
        // filter out events created by the preview image itself
        if (!key.includes(process.env.IMG_PREVIEW_SUFFIX)) {
            await createPreviewImage(key)
        }

    }
    return 
}

