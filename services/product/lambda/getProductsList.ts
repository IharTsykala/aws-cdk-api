import { APIGatewayProxyHandler } from 'aws-lambda';

//constants
import { headers, products } from "../constants";

export const handler: APIGatewayProxyHandler = async (event) => {
    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(products),
    };
};
