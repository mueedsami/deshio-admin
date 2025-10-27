export interface Product {
  id: number | string;
  name: string;
  attributes: {
    mainImage?: string;
    Image?: string | string[];
    Colour?: string;
    [key: string]: any;
  };
}