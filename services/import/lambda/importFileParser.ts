import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import csv from 'csv-parser';
import { Readable } from 'stream';

const s3 = new S3Client({ region: 'eu-central-1' });
const sqs = new SQSClient({ region: 'eu-central-1' });

const queueUrl = process.env.SQS_QUEUE_URL;

export const handler: S3Handler = async (event: S3Event) => {
    console.log('Event received:', JSON.stringify(event));

    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const parsedKey = key.replace('uploaded/', 'parsed/');

        console.log(`Processing file: ${key} from bucket: ${bucket}`);

        try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
            const csvData = await data.Body?.transformToString() ?? "";

            console.log('CSV Data retrieved successfully.');

            const readableStream = new Readable();
            readableStream._read = () => {};
            readableStream.push(csvData);
            readableStream.push(null);

            const records: any[] = [];

            await new Promise<void>((resolve, reject) => {
                readableStream
                    .pipe(csv())
                    .on('data', (row) => {
                        console.log('Parsed record:', row);
                        records.push(row);
                    })
                    .on('end', async () => {
                        try {
                            console.log('CSV file parsed successfully.');

                            await Promise.all(records.map(async (record) => {
                                const sendMessageCommand = new SendMessageCommand({
                                    QueueUrl: queueUrl,
                                    MessageBody: JSON.stringify(record)
                                });
                                await sqs.send(sendMessageCommand);
                                console.log('Record sent to SQS:', record);
                            }));

                            await s3.send(new CopyObjectCommand({
                                Bucket: bucket,
                                CopySource: `${bucket}/${key}`,
                                Key: parsedKey,
                            }));
                            console.log(`File copied to ${parsedKey}`);

                            await s3.send(new DeleteObjectCommand({
                                Bucket: bucket,
                                Key: key,
                            }));
                            console.log(`File deleted from ${key}`);

                            resolve();
                        } catch (err) {
                            console.error('Error during CSV processing:', err);
                            reject(err);
                        }
                    })
                    .on('error', (err) => {
                        console.error('Error during CSV parsing:', err);
                        reject(err);
                    });
            });

        } catch (error) {
            console.error('Error getting object from S3:', error);
        }
    }
};
