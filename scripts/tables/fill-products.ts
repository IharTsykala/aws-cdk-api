import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';
import { v4 as uuidv4 } from 'uuid';

//types and interfaces
import { IProductWithStock } from "../../types";

//constants
import {Product, REGIONS_NAME, TABLES_NAME} from "../../constants";

const client = new DynamoDBClient({
    region: REGIONS_NAME.EU_CENTRAL_1,
});

export const fillProductsTable = async () => {
    const clonedProductsData: IProductWithStock[] = structuredClone(Product);

    for (const product of clonedProductsData) {
        const id = uuidv4();
        product.id = id;
        const params = {
            TableName: TABLES_NAME.PRODUCTS,
            Item: {
                id: { S: id },
                title: { S: product.title },
                description: { S: product.description },
                price: { N: product.price.toString() },
            },
        };
        const command: PutItemCommand = new PutItemCommand(params);
        await client.send(command);
        console.log(`Inserted product: ${product.title} with id: ${id}`);
    }

    return clonedProductsData;
};
