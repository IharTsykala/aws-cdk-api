import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import csv from 'csv-parser';
import { Readable } from 'stream';

const s3 = new S3Client({ region: 'eu-central-1' });
const sqs = new SQSClient({ region: 'eu-central-1' });

const queueUrl = process.env.SQS_QUEUE_URL;

export const handler: S3Handler = async (event: S3Event) => {
    for (const record of event.Records) {
        const bucket = record.s3.bucket.name;
        const key = decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '));
        const parsedKey = key.replace('uploaded/', 'parsed/');

        try {
            const data = await s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
            const csvData = await data.Body?.transformToString() ?? "";

            const readableStream = new Readable();
            readableStream._read = () => {};
            readableStream.push(csvData);
            readableStream.push(null);

            readableStream
                .pipe(csv())
                .on('data', async (row) => {
                    // Send each parsed row to SQS
                    try {
                        await sqs.send(new SendMessageCommand({
                            QueueUrl: queueUrl,
                            MessageBody: JSON.stringify(row),
                        }));
                        console.log('Message sent to SQS:', row); // Log the message sent to SQS
                    } catch (error) {
                        console.error('Error sending message to SQS:', error); // Log any error during sending message to SQS
                    }
                })
                .on('end', async () => {
                    console.log('CSV file successfully processed'); // Log when CSV file processing is completed

                    await s3.send(new CopyObjectCommand({
                        Bucket: bucket,
                        CopySource: `${bucket}/${key}`,
                        Key: parsedKey,
                    }));
                    console.log(`File copied to ${parsedKey}`); // Log when file is copied

                    await s3.send(new DeleteObjectCommand({
                        Bucket: bucket,
                        Key: key,
                    }));
                    console.log(`File moved to ${parsedKey}`); // Log when file is moved
                })
                .on('error', (error: Error) => {
                    console.error('Error processing CSV file', error); // Log any error during CSV file processing
                });

        } catch (error) {
            console.error('Error getting object from S3', error); // Log any error during getting object from S3
        }
    }
};
