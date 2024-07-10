import { SQSEvent, Context } from 'aws-lambda';
import { handler as catalogBatchProcessFunction } from '../services/product/dist/lambda/catalogBatchProcess';

describe('catalogBatchProcessFunction', () => {
    it('should be called with SQS event', async () => {
        const event: SQSEvent = {
            Records: [
                {
                    messageId: '1',
                    receiptHandle: 'abc',
                    body: JSON.stringify({
                        id: '1',
                        title: 'Product A',
                        description: 'Description of Product A',
                        price: 10.99,
                        count: 100,
                    }),
                    attributes: {
                        ApproximateReceiveCount: '1',
                        SentTimestamp: '1625812076341',
                        SenderId: 'AROAI2XZAYJ7MB7YQKZX5:importProductsFileHandler',
                        ApproximateFirstReceiveTimestamp: '1625812076341',
                    },
                    messageAttributes: {},
                    md5OfBody: '',
                    eventSource: 'aws:sqs',
                    eventSourceARN: 'arn:aws:sqs:eu-central-1:123456789012:catalog-items-queue',
                    awsRegion: 'eu-central-1',
                },
            ],
        };

        const context: Context = {} as Context;

        await catalogBatchProcessFunction(event, context, () => {});
    });
});
