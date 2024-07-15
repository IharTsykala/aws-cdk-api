import { SQSHandler } from 'aws-lambda';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { SNSClient, PublishCommand } from '@aws-sdk/client-sns';

const ddb = new DynamoDBClient({ region: 'eu-central-1' });
const sns = new SNSClient({ region: 'eu-central-1' });

const productsTableName = process.env.PRODUCTS_TABLE_NAME;
const snsTopicArn = process.env.SNS_TOPIC_ARN;

const generateRandomId = () => {
    return Math.random().toString(36).slice(2, 11);
}

export const handler: SQSHandler = async (event) => {
    console.log('Received SQS event:', JSON.stringify(event));

    const putRequests = event.Records.map(record => {
        const product = JSON.parse(record.body);
        const id = generateRandomId();
        const params = {
            TableName: productsTableName,
            Item: {
                id: { S: id },
                title: { S: product?.title },
                description: { S: product?.description },
                price: { N: product.price?.toString() },
                count: { N: product.count?.toString() },
            },
        };

        console.log('Putting item in DynamoDB:', params);
        return ddb.send(new PutItemCommand(params));
    });

    try {
        await Promise.all(putRequests);

        console.log('All items have been put in DynamoDB.');

        const publishParams = {
            Message: JSON.stringify({ default: 'Products have been created' }),
            MessageStructure: 'json',
            TopicArn: snsTopicArn,
        };

        await sns.send(new PublishCommand(publishParams));
        console.log('SNS message has been sent.');
    } catch (err) {
        console.error('Error creating products:', err);
    }
};
