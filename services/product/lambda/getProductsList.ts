import {APIGatewayProxyHandler, AttributeValue} from 'aws-lambda';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';

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

    const productsParams = {
        TableName: productsTableName,
    };

    try {
        const productsResult = await client.send(new ScanCommand(productsParams));
        let products = productsResult.Items ?? [];

        const stocksParams = {
            TableName: stocksTableName,
        };

        const stocksResult = await client.send(new ScanCommand(stocksParams));
        const stocks = stocksResult.Items ?? [];

        const productsWithCount: IProductWithCount[] = products.map(product => {
            const stock = stocks.find(s => s.product_id.S === product.id.S);
            return {
                id: product.id.S as string,
                title: product.title.S as string,
                description: product.description.S as string,
                price: parseInt(product.price.N as string),
                count: stock ? parseInt(stock.count.N as string) : 0,
            };
        });

        return {
            statusCode: 200,
            headers: HEADERS,
            body: JSON.stringify(productsWithCount),
        };
    } catch (error) {
        console.error('Error getting products list:', error);
        return {
            statusCode: 500,
            headers: HEADERS,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
