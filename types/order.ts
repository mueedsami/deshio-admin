// types/order.ts

export interface Customer {
  name: string;
  email: string;
  phone: string;
  socialId?: string;
}

export interface DeliveryAddress {
  division: string;
  district: string;
  city: string;
  zone: string;
  area: string;
  address: string;
  postalCode: string;
}

export interface Product {
  id: number;
  productId?: number;
  productName: string;
  size: string;
  qty: number;
  price: number;
  discount: number;
  amount: number;
  barcodes?: string[]; // Added barcodes field
}

export interface Amounts {
  subtotal: number;
  totalDiscount: number;
  vat: number;
  vatRate: number;
  transportCost: number;
  total: number;
}

export interface Payments {
  sslCommerz: number;
  advance: number;
  transactionId: string;
  totalPaid: number;
  due: number;
}

export interface Order {
  id: number;
  salesBy: string;
  date: string;
  customer: Customer;
  deliveryAddress: DeliveryAddress;
  products: Product[];
  subtotal: number;
  amounts: Amounts;
  payments: Payments;
  createdAt: string;
  updatedAt?: string;
}