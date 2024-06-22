//scripts
import { fillProductsTable } from './fill-products';
import { fillStocksTable } from './fill-stocks';

//constants
import {ProductWithStock} from "../../types";

const fillTables = async () => {
    try {
        const productsData: ProductWithStock[] = await fillProductsTable();
        await fillStocksTable(productsData);
    } catch (error) {
        console.error(error);
    }
};

fillTables();
