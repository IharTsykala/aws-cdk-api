import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import { Construct } from 'constructs';
// import { join } from 'path';

export class ProductStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const getProductsList = new lambda.Function(this, 'getProductsList', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../services/product/dist'),
      handler: 'getProductsList.handler',
    });

    const getProductsById = new lambda.Function(this, 'getProductsById', {
      runtime: lambda.Runtime.NODEJS_20_X,
      code: lambda.Code.fromAsset('../services/product/dist'),
      handler: 'getProductsById.handler',
    });

    const api = new apigateway.RestApi(this, 'ProductApi', {
      restApiName: 'Product Service',
    });

    const products = api.root.addResource('products');

    products.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS,
      allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    });

    products.addMethod('GET', new apigateway.LambdaIntegration(getProductsList));

    const productById = products.addResource('{productId}');
    productById.addMethod('GET', new apigateway.LambdaIntegration(getProductsById));
  }
}
