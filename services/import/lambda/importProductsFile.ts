import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { APIGatewayProxyHandler } from 'aws-lambda';
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

const s3 = new S3Client({ region: process.env.AWS_REGION });

export const handler: APIGatewayProxyHandler = async (event) => {
    const bucketName = process.env.BUCKET_NAME ?? 'import-csv-rss';

    // Проверка наличия имени файла в запросе
    const fileName = event.queryStringParameters?.name;

    if (!fileName) {
        return {
            statusCode: 400,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            },
            body: JSON.stringify({
                message: 'Missing name parameter',
            }),
        };
    }

    const objectKey = `uploaded/${fileName}`;

    try {
        // Создание подписанной URL для загрузки файла
        const command = new PutObjectCommand({
            Bucket: bucketName,
            Key: objectKey,
        });
        const signedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });

        return {
            statusCode: 200,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            },
            body: JSON.stringify({
                message: 'Signed URL created successfully',
                url: signedUrl,
            }),
        };
    } catch (error) {
        console.error(error);
        return {
            statusCode: 500,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
            },
            body: JSON.stringify({
                message: 'Error creating signed URL',
                error: (error as Error).message,
            }),
        };
    }
};
