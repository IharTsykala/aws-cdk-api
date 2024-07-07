import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const dynamoDb = new DynamoDB.DocumentClient();
const sns = new SNSClient({ region: 'eu-central-1' });
const productsTableName = process.env.PRODUCTS_TABLE_NAME ?? "products";
const snsTopicArn = process.env.SNS_TOPIC_ARN ?? "";

export const handler: SQSHandler = async (event: SQSEvent): Promise<void> => {
    const putRequests = event.Records.map(record => {
        const product = JSON.parse(record.body);

        return {
            PutRequest: {
                Item: {
                    id: product.id,
                    name: product.name,
                    price: product.price,
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
        await dynamoDb.batchWrite(params).promise();
        console.log('Products created successfully.');

        const snsMessage = {
            Message: 'Products created successfully.',
            TopicArn: snsTopicArn,
        };

        await sns.send(new PublishCommand(snsMessage));
        console.log('SNS message sent successfully.');
    } catch (error) {
        console.error('Error creating products:', error);
    }
};
