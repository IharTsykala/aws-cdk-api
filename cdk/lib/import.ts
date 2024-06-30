import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import path from "path";

export class ImportStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const bucket = new s3.Bucket(this, 'ImportBucket', {
            bucketName: 'import-csv-rss',
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
        });

        const distPath = path.resolve(__dirname, '../../services/import/dist/lambda');

        const importFunction = new lambda.Function(this, 'ImportFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'importProductsFile.handler',
            code: lambda.Code.fromAsset(distPath),
            environment: {
                BUCKET_NAME: bucket.bucketName,
            },
        });

        importFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket'],
            resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        }));

        const api = new apigateway.RestApi(this, 'ImportApi', {
            restApiName: 'Import Service',
        });

        const importIntegration = new apigateway.LambdaIntegration(importFunction);

        const importResource = api.root.addResource('import');
        importResource.addMethod('GET', importIntegration, {
            requestParameters: {
                'method.request.querystring.name': true,
            },
        });

        api.addGatewayResponse('MissingNameQueryParam', {
            type: apigateway.ResponseType.DEFAULT_4XX,
            responseHeaders: {
                'Access-Control-Allow-Origin': "'*'",
                'Access-Control-Allow-Headers': "'*'",
            },
            statusCode: '400',
            templates: {
                'application/json': JSON.stringify({ message: 'Missing name query parameter' }),
            },
        });

        importResource.addCorsPreflight({
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowHeaders: ['*'],
            allowMethods: ['GET', 'OPTIONS'],
        });
    }
}
