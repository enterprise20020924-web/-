export interface StoreItem {
  key: string;
  id?: string;
  name: string;
  category: string;
  shelf: string;
  price: number;
  salePrice?: number;
  description: string;
  effectText?: string;
  icon?: string;
  grade?: string;
  slot?: string;
  gender?: string;
  bonuses?: Record<string, number>;
  effect?: Record<string, any>;
}
