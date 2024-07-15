import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as iam from 'aws-cdk-lib/aws-iam';
import {NodejsFunction} from "aws-cdk-lib/aws-lambda-nodejs";

import { Construct } from 'constructs';
import * as path from 'path';

export class AuthorizationServiceStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const distPath = path.resolve(__dirname, '../../services/authorization-service/dist/lambda');

        const basicAuthorizer = new NodejsFunction(this, 'BasicAuthorizerFunction', {
            functionName: 'BasicAuthorizerFunction',
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'basicAuthorizer.handler',
            code: lambda.Code.fromAsset(distPath),
            environment: {
                GITHUB_ACCOUNT_LOGIN: process.env.GITHUB_ACCOUNT_LOGIN ?? "IharTsykala",
                TEST_PASSWORD: process.env.TEST_PASSWORD ?? "TEST_PASSWORD"
            },
        });

        new cdk.CfnOutput(this, 'BasicAuthorizerFunctionArn', {
            value: basicAuthorizer.functionArn,
            exportName: 'BasicAuthorizerFunctionArn',
        });
    }
}
