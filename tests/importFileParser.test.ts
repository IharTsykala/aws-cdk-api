import { S3Event, Context } from 'aws-lambda';
import { handler as importFileParserHandler } from '../services/import/lambda/importFileParser';

describe('importFileParser', () => {
    it('should be called and process the CSV file', async () => {
        const event: S3Event = {
            Records: [
                {
                    s3: {
                        bucket: {
                            name: 'test-bucket',
                        },
                        object: {
                            key: 'uploaded/test.csv',
                        },
                    },
                },
            ],
        } as S3Event;

        const context: Context = {} as Context;

        await importFileParserHandler(event, context, () => {});
    });
});
