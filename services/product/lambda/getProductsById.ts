import { APIGatewayProxyHandler } from 'aws-lambda';
import { DynamoDBClient, GetItemCommand } from '@aws-sdk/client-dynamodb';

//types and interfaces
import { IProductWithCount } from "../../../types";

//constants
// import { HEADERS, REGIONS_NAME } from "../constants";

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

export const handler: APIGatewayProxyHandler = async (event) => {
    console.log('Received request:', JSON.stringify(event));
    const productsTableName = process.env.PRODUCTS_TABLE_NAME;
    const stocksTableName = process.env.STOCKS_TABLE_NAME;
    const productId = event.pathParameters?.productId ?? '';

    const productParams = {
        TableName: productsTableName,
        Key: {
            id: { S: productId },
        },
    };

    try {
        const productResult = await client.send(new GetItemCommand(productParams));
        const product = productResult.Item;

        if (!product) {
            return {
                statusCode: 404,
                headers: HEADERS,
                body: JSON.stringify({ message: "Product not found" }),
            };
        }

        const stockParams = {
            TableName: stocksTableName,
            Key: {
                product_id: { S: productId },
            },
        };
        const stockResult = await client.send(new GetItemCommand(stockParams));
        const stock = stockResult.Item;

        const productWithCount: IProductWithCount = {
            id: product.id.S as string,
            title: product.title.S as string,
            description: product.description.S as string,
            price: parseInt(product.price.N as string),
            count: stock ? parseInt(stock.count.N as string) : 0,
        };

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify(productWithCount),
        };
    } catch (error) {
        console.error('Error getting product by ID:', error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
