import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

//types and interfaces
import { IProductWithStock } from "../../types";

//constants
import {REGIONS_NAME, TABLES_NAME} from "../../constants";

const client = new DynamoDBClient({
    region: REGIONS_NAME.EU_CENTRAL_1,
});

export const fillStocksTable = async (clonedProductsData: IProductWithStock[]) => {
    for (const product of clonedProductsData) {
        const params = {
            TableName: TABLES_NAME.STOCKS,
            Item: {
                product_id: { S: product.id },
                count: { N: product.stock.count.toString() },
            },
        };
        const command = new PutItemCommand(params);
        await client.send(command);
        console.log(`Inserted stock for product_id: ${product.id}`);
    }
};
