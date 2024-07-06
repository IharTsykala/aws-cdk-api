import { APIGatewayProxyEvent, Context } from 'aws-lambda';
import { handler as importProductsFileHandler } from '../services/import/lambda/importProductsFile';

describe('importProductsFile', () => {
    it('should be called and return a signed URL', async () => {
        const event: APIGatewayProxyEvent = {
            httpMethod: 'GET',
            headers: {},
            multiValueHeaders: {},
            queryStringParameters: { name: 'test.csv' },
            multiValueQueryStringParameters: null,
            pathParameters: null,
            stageVariables: null,
            requestContext: {} as any,
            resource: '',
            path: '',
            isBase64Encoded: false,
            body: null,
        } as APIGatewayProxyEvent;

        const context: Context = {} as Context;

        await importProductsFileHandler(event, context, () => {});
    });

    it('should return 400 if name is missing', async () => {
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
            body: null,
        } as APIGatewayProxyEvent;

        const context: Context = {} as Context;

        await importProductsFileHandler(event, context, () => {});
    });
});
