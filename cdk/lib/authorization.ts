import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';

import { Construct } from 'constructs';
import * as path from 'path';

export class AuthorizationServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const basicAuthorizer = new lambda.Function(this, 'BasicAuthorizerFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'basicAuthorizer.handler',
            code: lambda.Code.fromAsset(path.join(__dirname, '../../services/authorization-service/lambda')),
            environment: {
                GITHUB_ACCOUNT_LOGIN: process.env.GITHUB_ACCOUNT_LOGIN ?? ""
            }
        });
    }
}
