import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';

import { Construct } from 'constructs';
import * as path from 'path';

export class ImportStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const bucket = new s3.Bucket(this, 'ImportBucket', {
            bucketName: 'import-csv-rss',
            versioned: true,
            removalPolicy: cdk.RemovalPolicy.DESTROY,
            autoDeleteObjects: true,
            cors: [
                {
                    allowedOrigins: ['*'],
                    allowedHeaders: ['*'],
                    allowedMethods: [
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD,
                    ],
                    maxAge: 3000,
                },
            ],
        });

        const distPath = path.resolve(__dirname, '../../services/import/dist/lambda');

        const importFunction = new NodejsFunction(this, 'ImportFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'importProductsFile.handler',
            code: lambda.Code.fromAsset(distPath),
            environment: {
                BUCKET_NAME: bucket.bucketName,
            },
        });

        const queueArn = cdk.Fn.importValue('CatalogItemsQueueArn');
        const queueUrl = cdk.Fn.importValue('CatalogItemsQueueUrl');

        const importFileParserFunction = new NodejsFunction(this, 'ImportParserFunction', {
            runtime: lambda.Runtime.NODEJS_20_X,
            handler: 'handler',
            entry: path.join(distPath, 'importFileParser.js'),
            environment: {
                BUCKET_NAME: bucket.bucketName,
                SQS_QUEUE_URL: queueUrl,
            },
        });

        importFileParserFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['sqs:SendMessage', 'sqs:GetQueueAttributes', 'sqs:GetQueueUrl'],
            resources: [queueArn],
        }));

        bucket.grantRead(importFunction);
        bucket.grantReadWrite(importFileParserFunction);

        bucket.addEventNotification(
            s3.EventType.OBJECT_CREATED,
            new s3n.LambdaDestination(importFileParserFunction),
            { prefix: 'uploaded/' }
        );

        importFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:CopyObject', 's3:DeleteObject'],
            resources: [bucket.bucketArn, `${bucket.bucketArn}/*`],
        }));

        importFileParserFunction.addToRolePolicy(new iam.PolicyStatement({
            actions: ['s3:GetObject', 's3:PutObject', 's3:ListBucket', 's3:CopyObject', 's3:DeleteObject'],
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

        api.root.addCorsPreflight({
            allowOrigins: apigateway.Cors.ALL_ORIGINS,
            allowHeaders: apigateway.Cors.DEFAULT_HEADERS,
            allowMethods: apigateway.Cors.ALL_METHODS,
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
