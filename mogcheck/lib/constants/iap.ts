/**
 * In-App Purchase product definitions.
 * These must match the product IDs configured in App Store Connect.
 */

export interface CoinPack {
  productId: string;
  name: string;
  coins: number;
  price: string;
  bestFor: string;
  isPopular?: boolean;
}

export interface GiftPack {
  productId: string;
  name: string;
  coins: number;
  price: string;
  tagline: string;
}

export const COIN_PACKS: CoinPack[] = [
  {
    productId: 'com.mogcheck.coins.starter',
    name: 'Starter',
    coins: 5,
    price: '$0.99',
    bestFor: 'One roast + one scan',
  },
  {
    productId: 'com.mogcheck.coins.grinder',
    name: 'Grinder',
    coins: 25,
    price: '$3.99',
    bestFor: 'Regular use',
    isPopular: true,
  },
  {
    productId: 'com.mogcheck.coins.chad',
    name: 'Chad Pack',
    coins: 60,
    price: '$7.99',
    bestFor: 'Best value',
  },
  {
    productId: 'com.mogcheck.coins.gigachad',
    name: 'Gigachad Bundle',
    coins: 150,
    price: '$14.99',
    bestFor: 'Power user',
  },
];

export const GIFT_PACKS: GiftPack[] = [
  {
    productId: 'com.mogcheck.gift.starter',
    name: 'Gift - Starter',
    coins: 5,
    price: '$0.99',
    tagline: "You're mid but I care",
  },
  {
    productId: 'com.mogcheck.gift.grinder',
    name: 'Gift - Grinder',
    coins: 25,
    price: '$3.99',
    tagline: 'Ascend, king',
  },
  {
    productId: 'com.mogcheck.gift.chad',
    name: 'Gift - Chad Pack',
    coins: 60,
    price: '$7.99',
    tagline: 'Gigachad energy transfer',
  },
];

export const ALL_PRODUCT_IDS = [
  ...COIN_PACKS.map((p) => p.productId),
  ...GIFT_PACKS.map((p) => p.productId),
];

/**
 * Feature costs in coins.
 */
export const FEATURE_COSTS = {
  roast: 1,
  battle_verdict: 1,
  ascension_plan: 2,
  glow_up: 5,
} as const;
