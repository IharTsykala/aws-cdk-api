export interface IProduct {
    id: string;
    title: string;
    description: string;
    price: number;
}

export interface IStock {
    product_id: string;
    count: number;
}

export interface IProductWithStock extends IProduct {
    stock: {
        count: number;
    };
}

export interface IProductWithCount extends IProduct {
    count: number;
}
