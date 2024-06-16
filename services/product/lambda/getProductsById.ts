import { APIGatewayProxyHandler } from 'aws-lambda';

//constants
import { headers, products } from "../constants";

export const handler: APIGatewayProxyHandler = async (event) => {
    const productId = event.pathParameters?.productId ?? '';

    const product = products.find(p => p.id === parseInt(productId));

    if (!product) {
        return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ message: "Product not found" }),
        };
    }

    return {
        statusCode: 200,
        headers,
        body: JSON.stringify(product),
    };
};
