import { APIGatewayProxyEvent, Context, APIGatewayProxyResult } from 'aws-lambda';
import { handler as getProductsListHandler } from '../services/product';

describe('getProductsList', () => {
    it('should be called and return a list of products', async () => {
        const event: APIGatewayProxyEvent = {
            httpMethod: 'GET',
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: null,
            multiValueQueryStringParameters: null,
            pathParameters: null,
            stageVariables: null,
            requestContext: {} as any,
            resource: '',
            path: '',
            isBase64Encoded: false,
            body: null
        } as APIGatewayProxyEvent;

        const context: Context = {} as Context;

        const result: APIGatewayProxyResult = await getProductsListHandler(event, context, () => {}) as APIGatewayProxyResult;

        expect(result).toEqual(expect.objectContaining({
            statusCode: 200
        }));
    });
});
