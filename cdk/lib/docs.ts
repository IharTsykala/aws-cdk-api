import * as cdk from 'aws-cdk-lib';
import { Bucket, BlockPublicAccess } from 'aws-cdk-lib/aws-s3';
import { Construct } from 'constructs';
import * as s3deploy from 'aws-cdk-lib/aws-s3-deployment';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class DocsStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const bucket = new Bucket(this, 'ProductDocsBucket', {
            websiteIndexDocument: 'index.html',
            publicReadAccess: true,
            blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
        });

        bucket.addCorsRule({
            allowedMethods: [s3.HttpMethods.GET],
            allowedOrigins: ['*'],
            allowedHeaders: ['*'],
        });

        new s3deploy.BucketDeployment(this, 'DeploySwaggerDocs', {
            sources: [s3deploy.Source.asset('../docs')],
            destinationBucket: bucket,
            destinationKeyPrefix: '',
        });

        new cdk.CfnOutput(this, 'BucketURL', {
            value: bucket.bucketWebsiteUrl,
        });
    }
}
