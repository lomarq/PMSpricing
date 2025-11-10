export enum UserRole {
  EDITOR = 'Editor',
  OBSERVER = 'Observer',
}

export interface PriceTier {
  pounds: number;
  pricePerPound: number;
}

export interface Product {
  id: string;
  colorName: string;
  priceTiers: PriceTier[];
  tariff?: number; // Optional tariff percentage
}

export interface AppState {
  products: Product[];
  password?: string;
  logo?: string | null;
}
