//scripts
import { fillProductsTable } from './fill-products';
import { fillStocksTable } from './fill-stocks';

//constants
import { IProductWithStock } from "../../types";

const fillTables = async () => {
    try {
        const productsData: IProductWithStock[] = await fillProductsTable();
        await fillStocksTable(productsData);
    } catch (error) {
        console.error(error);
    }
};

fillTables();
