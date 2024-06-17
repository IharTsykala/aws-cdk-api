import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { handler as getProductByIdHandler } from '../services/product/lambda/getProductsById';

describe('getProductsById', () => {
    it('should be called and return a product by ID', async () => {
        const event: APIGatewayProxyEvent = {
            httpMethod: 'GET',
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: {
                productId: '1'
            },
            stageVariables: null,
            requestContext: {} as any,
            resource: '',
            path: '',
            isBase64Encoded: false,
            body: null,
        } as APIGatewayProxyEvent;

        const context: Context = {} as Context;

        const result: void | APIGatewayProxyResult =  await getProductByIdHandler(event, context, () => {});

        expect(result).toEqual(expect.objectContaining({
            statusCode: 200
        }));
    });
});
