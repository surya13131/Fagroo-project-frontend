export interface Product {
  _id: string; 
  name: string;
  description: string;
  price: number;
  category: string;
  image?: string;         // Changed from imageUrl
  availableQty: number;   // Changed from stock
  minimumQty: number;     // New
  discount: number;       // New (%)
  seller: string;         // New
  location: string;       // New
  active: boolean;        // New
  createdAt?: string;
}

export interface CalculationResult {
  basePrice: number;
  discountApplied: number;
  discountedPricePerUnit: number;
  totalOrderValue: number;
}