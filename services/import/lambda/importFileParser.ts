import { S3Event, S3Handler } from 'aws-lambda';
import { S3Client, GetObjectCommand, CopyObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import csv from 'csv-parser';
import { Readable } from 'stream';

const s3 = new S3Client({ region: 'eu-central-1' });

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
                .on('data', (row) => {
                    console.log('Parsed row:', row);
                })
                .on('end', async () => {
                    console.log('CSV file successfully processed');

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
                    console.log(`File moved to ${parsedKey}`);
                })
                .on('error', (error: Error) => {
                    console.error('Error processing CSV file', error);
                });

        } catch (error) {
            console.error('Error getting object from S3', error);
        }
    }
};
