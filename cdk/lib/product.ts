import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

import { Construct } from 'constructs';
import * as path from "path";

export class ProductStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const distPath = path.resolve(__dirname, '../../services/product/lambda');

    const productsTable = new dynamodb.Table(this, 'ProductsTable', {
      tableName: 'products',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING }
    });

    const stocksTable = new dynamodb.Table(this, 'StocksTable', {
      tableName: 'stocks',
      partitionKey: { name: 'product_id', type: dynamodb.AttributeType.STRING }
    });

    const getProductsList = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(distPath),
      handler: 'getProductsList.handler',
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    const getProductsById = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(distPath),
      handler: 'getProductsById.handler',
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    const createProduct = new lambda.Function(this, 'createProduct', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(distPath),
      handler: 'createProduct.handler',
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
        STOCKS_TABLE_NAME: stocksTable.tableName,
      },
    });

    const dynamoDbPolicy = new iam.PolicyStatement({
      actions: ['dynamodb:Scan', 'dynamodb:GetItem', 'dynamodb:PutItem', 'dynamodb:TransactWriteItems'],
      resources: [productsTable.tableArn, stocksTable.tableArn],
    });

    getProductsList.addToRolePolicy(dynamoDbPolicy);
    getProductsById.addToRolePolicy(dynamoDbPolicy);
    createProduct.addToRolePolicy(dynamoDbPolicy);

    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Product Service',
    });

    const products = api.root.addResource('products');

    products.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));
    products.addMethod('POST', new apigateway.LambdaIntegration(createProduct));

    const productById = products.addResource('{productId}');
    productById.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));

    const catalogItemsQueue = new sqs.Queue(this, 'CatalogItemsQueue', {
      visibilityTimeout: cdk.Duration.seconds(300),
      receiveMessageWaitTime: cdk.Duration.seconds(20),
    });

    const catalogBatchProcessFunction = new lambda.Function(this, 'CatalogBatchProcessFunction', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(distPath),
      handler: 'catalogBatchProcess.handler',
      environment: {
        PRODUCTS_TABLE_NAME: productsTable.tableName,
      },
    });

    productsTable.grantReadWriteData(catalogBatchProcessFunction);

    catalogBatchProcessFunction.addEventSource(new SqsEventSource(catalogItemsQueue, {
      batchSize: 5,
    }));

    const importFileParser = new lambda.Function(this, 'importFileParser', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset(distPath),
      handler: 'importFileParser.handler',
      environment: {
        SQS_QUEUE_URL: catalogItemsQueue.queueUrl,
      },
    });

    const sqsPolicy = new iam.PolicyStatement({
      actions: ['sqs:SendMessage'],
      resources: [catalogItemsQueue.queueArn],
    });

    importFileParser.addToRolePolicy(sqsPolicy);
  }
}
