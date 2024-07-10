import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDBClient, BatchWriteItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDbClient = new DynamoDBClient({ region: 'eu-central-1' });
const snsClient = new SNSClient({ region: 'eu-central-1' });
const productsTableName = process.env.PRODUCTS_TABLE_NAME ?? "products";
const snsTopicArn = process.env.SNS_TOPIC_ARN ?? "";

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
    const putRequests = event.Records.map(record => {
        const product = JSON.parse(record.body);

        return {
            PutRequest: {
                Item: {
                    id: { S: product?.id },
                    title: { S: product?.title },
                    description: { S: product?.description },
                    price: { N: product.price?.toString() },
                    count: { N: product.count?.toString() },
                },
            },
        };
    });

    const params = {
        RequestItems: {
            [productsTableName]: putRequests,
        },
    };

    try {
        await dynamoDbClient.send(new BatchWriteItemCommand(params));
        console.log('Products created successfully.');

        const snsMessage = {
            Message: 'Products created successfully.',
            TopicArn: snsTopicArn,
        };

        await snsClient.send(new PublishCommand(snsMessage));
        console.log('SNS message sent successfully.');
    } catch (error) {
        console.error('Error creating products:', error);
    }
};
