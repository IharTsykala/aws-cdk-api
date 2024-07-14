import { APIGatewayAuthorizerResult, APIGatewayTokenAuthorizerEvent, Context, Callback } from 'aws-lambda';
import * as dotenv from 'dotenv';
import * as base64 from 'base-64';

dotenv.config();

export const handler = (event: APIGatewayTokenAuthorizerEvent, context: Context, callback: Callback<APIGatewayAuthorizerResult>): void => {
    if (!event.authorizationToken) {
        callback('Unauthorized');
        return;
    }

    const token = event.authorizationToken.split(' ')[1];
    const decodedToken = base64.decode(token);
    const [username, password] = decodedToken.split(':');

    const storedPassword = process.env[username];

    if (storedPassword === password) {
        const policy = generatePolicy('user', 'Allow', event.methodArn);
        callback(null, policy);
    } else {
        callback('Unauthorized');
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
