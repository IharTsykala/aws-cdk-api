import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult, Context, Callback } from 'aws-lambda';

export const handler = (event: APIGatewayTokenAuthorizerEvent, context: Context, callback: Callback<APIGatewayAuthorizerResult>): void => {
    console.log('event.authorizationToken', event.authorizationToken);
    if (!event.authorizationToken) {
        callback(null, generateErrorResponse('Unauthorized', 401));
        return;
    }

    const token = event.authorizationToken.split(' ')[1];
    const decodedToken = Buffer.from(token, 'base64').toString('utf-8');
    console.log('decodedToken', decodedToken);
    const [username, password] = decodedToken.split(':');

    const storedPassword = process?.env?.TEST_PASSWORD ?? "TEST_PASSWORD";
    const storedUsername = process?.env?.GITHUB_ACCOUNT_LOGIN ?? "IharTsykala";

    if (username === storedUsername && password === storedPassword) {
        const policy = generatePolicy('user', 'Allow', event.methodArn);
        callback(null, policy);
    } else {
        callback(null, generateErrorResponse('Unauthorized', 403));
    }
};

const generatePolicy = (principalId: string, effect: 'Allow' | 'Deny', resource: string): APIGatewayAuthorizerResult => {
    const authResponse: APIGatewayAuthorizerResult = {
        principalId: principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: effect,
                Resource: resource
            }]
        }
    };
    return authResponse;
};

const generateErrorResponse = (message: string, statusCode: number): APIGatewayAuthorizerResult => {
    return {
        principalId: 'user',
        policyDocument: {
            Version: '2012-10-17',
            Statement: [{
                Action: 'execute-api:Invoke',
                Effect: 'Deny',
                Resource: '*'
            }]
        },
        context: {
            statusCode: statusCode,
            message: message
        }
    };
};
