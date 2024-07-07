import { SQSEvent, SQSHandler } from 'aws-lambda';
import { DynamoDB } from 'aws-sdk';

const dynamoDb = new DynamoDB.DocumentClient();
const productsTableName = process.env.PRODUCTS_TABLE_NAME ?? "products";

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
    } catch (error) {
        console.error('Error creating products:', error);
    }
};
