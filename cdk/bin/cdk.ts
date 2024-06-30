#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';

//stacks
import { ProductStack } from '../lib/product';
import { ImportStack } from "../lib/import";
import { DocsStack } from "../lib/docs";

const app = new cdk.App();
new ProductStack(app, 'ProductStack', {});
new ImportStack(app, 'ImportStack');
new DocsStack(app, 'DocsStack');
