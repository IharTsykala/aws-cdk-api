import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, TransactWriteItemsCommand } from '@aws-sdk/client-dynamodb';
// import { v4 as uuidv4 } from 'uuid';

//constants
export const HEADERS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "OPTIONS,POST,GET"
}

export const REGIONS_NAME = {
    US_EAST_1: "us-east-1",
    EU_CENTRAL_1: "eu-central-1"
}

const client: DynamoDBClient = new DynamoDBClient({ region: REGIONS_NAME.EU_CENTRAL_1 });

const generateRandomId = () => {
    return Math.random().toString(36).slice(2, 11);
}

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Received request:', JSON.stringify(event));

    try {
        const productsTableName = process.env.PRODUCTS_TABLE_NAME;
        const stocksTableName = process.env.STOCKS_TABLE_NAME;
        const { title, description, price, count } = JSON.parse(event.body || '{}');
        const productId = generateRandomId();

        if (!title || !description || !price) {
            return {
                statusCode: 400,
                headers: HEADERS,
                body: JSON.stringify({ message: 'Invalid input' }),
            };
        }

        const product = {
            id: { S: productId },
            title: { S: title },
            description: { S: description },
            price: { N: price.toString() },
        };

        const stock = {
            product_id: { S: productId },
            count: { N: count.toString() },
        };

        const params = {
            TransactItems: [
                {
                    Put: {
                        TableName: productsTableName,
                        Item: product,
                    },
                },
                {
                    Put: {
                        TableName: stocksTableName,
                        Item: stock,
                    },
                },
            ],
        };

        await client.send(new TransactWriteItemsCommand(params));

        return {
            statusCode: 201,
            headers: HEADERS,
            body: JSON.stringify({ message: 'Product and stock created successfully' }),
        };
    } catch (error) {
        console.error('Error creating product and stock:', error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
