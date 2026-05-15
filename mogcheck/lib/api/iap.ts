import { COIN_PACKS, GIFT_PACKS } from '../constants/iap';

export type Product = {
  id: string;
  displayPrice: string;
};

export async function initIAP(): Promise<boolean> {
  return false;
}

export async function cleanupIAP(): Promise<void> {}

export async function loadProducts(): Promise<Product[]> {
  return [...COIN_PACKS, ...GIFT_PACKS].map((pack) => ({
    id: pack.productId,
    displayPrice: pack.price,
  }));
}

export async function purchaseCoinPack(_productId: string): Promise<void> {
  throw new Error('In-app purchases are disabled in this stabilization build.');
}
