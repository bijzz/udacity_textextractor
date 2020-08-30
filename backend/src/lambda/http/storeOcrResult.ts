import 'source-map-support/register'
import { SNSEvent, SNSHandler } from 'aws-lambda'
import { createLogger } from '../../utils/logger'
import { storeOcrResult } from '../../businessLayer/documents'


const logger = createLogger('storeOcrResult')

export const handler: SNSHandler = async (events: SNSEvent) => {
    logger.info("Processing SNS events", { events: JSON.stringify(events) })
    for (const snsRecord of events.Records) {
        const eventStr = snsRecord.Sns.Message
        logger.info("Processing single event", { event: eventStr })
        const event = JSON.parse(eventStr)
        logger.info(event)
        const {
            JobId: JobId,
            Status: Status,
            DocumentLocation: { S3ObjectName }
        } = event
        // only after event has finished
        if (Status === "SUCCEEDED") {
            await storeOcrResult(JobId, S3ObjectName)
        }

        return
    }

}