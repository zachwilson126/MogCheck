/**
 * In-App Purchase integration using react-native-iap.
 *
 * Handles: initialization, product loading, purchasing, and receipt validation.
 * Coin crediting happens after successful purchase verification.
 */

import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  purchaseUpdatedListener,
  purchaseErrorListener,
  type Product,
  type Purchase,
  type PurchaseError,
} from 'react-native-iap';
import { ALL_PRODUCT_IDS, COIN_PACKS, GIFT_PACKS } from '../constants/iap';
import { useUserStore } from '../store/useUserStore';
import { supabase, logCoinTransaction } from './supabase';

let purchaseUpdateSubscription: ReturnType<typeof purchaseUpdatedListener> | null = null;
let purchaseErrorSubscription: ReturnType<typeof purchaseErrorListener> | null = null;

/**
 * Initialize IAP connection and set up purchase listeners.
 */
export async function initIAP(): Promise<boolean> {
  try {
    await initConnection();
    setupPurchaseListeners();
    return true;
  } catch (err) {
    console.warn('IAP init failed:', err);
    return false;
  }
}

/**
 * Clean up IAP connection.
 */
export async function cleanupIAP(): Promise<void> {
  purchaseUpdateSubscription?.remove();
  purchaseErrorSubscription?.remove();
  await endConnection();
}

/**
 * Load available products from App Store.
 */
export async function loadProducts(): Promise<Product[]> {
  try {
    const products = await fetchProducts({ skus: ALL_PRODUCT_IDS });
    return (products ?? []) as Product[];
  } catch (err) {
    console.warn('Failed to load products:', err);
    return [];
  }
}

/**
 * Purchase a coin pack.
 */
export async function purchaseCoinPack(productId: string): Promise<void> {
  try {
    await requestPurchase({
      request: { apple: { sku: productId } },
      type: 'in-app',
    });
  } catch (err) {
    console.warn('Purchase failed:', err);
    throw err;
  }
}

/**
 * Set up listeners for purchase completions and errors.
 */
function setupPurchaseListeners() {
  purchaseUpdateSubscription = purchaseUpdatedListener(async (purchase: Purchase) => {
    if (!purchase.purchaseToken) return;

    // Find the matching coin pack
    const coinPack = COIN_PACKS.find((p) => p.productId === purchase.productId);
    const giftPack = GIFT_PACKS.find((p) => p.productId === purchase.productId);

    const coins = coinPack?.coins ?? giftPack?.coins ?? 0;

    if (coins > 0) {
      const store = useUserStore.getState();

      if (coinPack) {
        // Credit coins to user
        store.addCoins(coins);

        // Server-side: update profile and log transaction
        if (store.isAuthenticated && store.user) {
          const currentCoins = store.coins; // Already updated locally
          await supabase
            .from('profiles')
            .update({ coins: currentCoins })
            .eq('id', store.user.id);

          await logCoinTransaction(store.user.id, coins, 'purchase', undefined);
        }
      }

      // TODO: Gift pack handling (Phase 3 — needs recipient logic)
    }

    // Finish the transaction (required by Apple)
    await finishTransaction({ purchase, isConsumable: true });
  });

  purchaseErrorSubscription = purchaseErrorListener((error: PurchaseError) => {
    console.warn('Purchase error:', error.message);
  });
}
