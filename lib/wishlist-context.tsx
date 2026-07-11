"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { Product } from "./data";
import { useAuth } from "./auth-context";
import { adaptGqlProduct } from "./magento";
import { useCart } from "./cart-context";

export interface WishlistItem {
  id: string; // The ID of the wishlist item in Magento (needed to delete it)
  product: Product;
}

type WishlistContextType = {
  wishlistItems: WishlistItem[];
  wishlistId: string | null;
  loading: boolean;
  addToWishlist: (product: Product) => Promise<boolean>;
  removeFromWishlist: (sku: string | undefined) => Promise<boolean>;
  isWishlisted: (sku: string | undefined) => boolean;
  moveToCart: (wishlistItemId: string) => Promise<boolean>;
  updateWishlistItem: (itemId: string, quantity: number) => Promise<boolean>;
  refreshWishlist: () => Promise<void>;
};

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const { refresh: refreshCart } = useCart();
  const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
  const [wishlistId, setWishlistId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchWishlist = useCallback(async () => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      setWishlistItems([]);
      setWishlistId(null);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "wishlist", token }),
      });
      const data = await res.json();
      if (data.wishlist) {
        setWishlistId(data.wishlist.id);
        const rawItems = data.wishlist.items_v2?.items || [];
        const adapted: WishlistItem[] = rawItems
          .filter((item: any) => item?.product)
          .map((item: any) => ({
            id: String(item.id),
            product: adaptGqlProduct(item.product),
          }));
        setWishlistItems(adapted);
      }
    } catch (e) {
      console.error("[wishlist] failed to fetch:", e);
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync on login/logout
  useEffect(() => {
    if (isLoggedIn) {
      fetchWishlist();
    } else {
      setWishlistItems([]);
      setWishlistId(null);
    }
  }, [isLoggedIn, fetchWishlist]);

  const addToWishlist = async (product: Product): Promise<boolean> => {
    const token = localStorage.getItem("customer_token");
    if (!token) {
      return false;
    }

    if (wishlistItems.some((item) => item.product.sku === product.sku)) {
      return true; // Already added
    }

    // Optimistic UI update: add a temp item
    const tempId = `temp-${Date.now()}`;
    const tempItem: WishlistItem = { id: tempId, product };
    setWishlistItems((prev) => [...prev, tempItem]);

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "addWishlist",
          token,
          wishlistId: wishlistId || undefined,
          sku: product.sku,
        }),
      });
      const data = await res.json();
      if (data.error) {
        // Rollback
        setWishlistItems((prev) => prev.filter((item) => item.id !== tempId));
        return false;
      }
      if (data.wishlist) {
        setWishlistId(data.wishlist.id);
        const rawItems = data.wishlist.items_v2?.items || [];
        const adapted: WishlistItem[] = rawItems
          .filter((item: any) => item?.product)
          .map((item: any) => ({
            id: String(item.id),
            product: adaptGqlProduct(item.product),
          }));
        setWishlistItems(adapted);
      }
      return true;
    } catch (e) {
      console.error("[wishlist] add failed:", e);
      // Rollback
      setWishlistItems((prev) => prev.filter((item) => item.id !== tempId));
      return false;
    }
  };

  const removeFromWishlist = async (sku: string | undefined): Promise<boolean> => {
    if (!sku) return false;
    const token = localStorage.getItem("customer_token");
    if (!token) return false;

    const itemToRemove = wishlistItems.find((item) => item.product.sku === sku);
    if (!itemToRemove) return false;

    // Optimistic UI update: remove item from local state
    setWishlistItems((prev) => prev.filter((item) => item.product.sku !== sku));

    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "removeWishlist",
          token,
          wishlistId: wishlistId || undefined,
          itemId: itemToRemove.id,
        }),
      });
      const data = await res.json();
      if (data.error) {
        // Rollback
        setWishlistItems((prev) => [...prev, itemToRemove]);
        return false;
      }
      if (data.wishlist) {
        setWishlistId(data.wishlist.id);
        const rawItems = data.wishlist.items_v2?.items || [];
        const adapted: WishlistItem[] = rawItems
          .filter((item: any) => item?.product)
          .map((item: any) => ({
            id: String(item.id),
            product: adaptGqlProduct(item.product),
          }));
        setWishlistItems(adapted);
      }
      return true;
    } catch (e) {
      console.error("[wishlist] remove failed:", e);
      // Rollback
      setWishlistItems((prev) => [...prev, itemToRemove]);
      return false;
    }
  };

  const isWishlisted = (sku: string | undefined): boolean => {
    if (!sku) return false;
    return wishlistItems.some((item) => item.product.sku === sku);
  };

  const moveToCart = async (wishlistItemId: string): Promise<boolean> => {
    const token = localStorage.getItem("customer_token");
    if (!token) return false;

    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "moveWishlistToCart",
          token,
          wishlistId: wishlistId || undefined,
          itemId: wishlistItemId,
        }),
      });
      const data = await res.json();
      if (data.error) {
        return false;
      }
      // Refresh both wishlist and cart states
      if (data.wishlist) {
        setWishlistId(data.wishlist.id);
        const rawItems = data.wishlist.items_v2?.items || [];
        const adapted: WishlistItem[] = rawItems
          .filter((item: any) => item?.product)
          .map((item: any) => ({
            id: String(item.id),
            product: adaptGqlProduct(item.product),
          }));
        setWishlistItems(adapted);
      } else {
        await fetchWishlist();
      }
      await refreshCart();
      return true;
    } catch (e) {
      console.error("[wishlist] move to cart failed:", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateWishlistItem = async (itemId: string, quantity: number): Promise<boolean> => {
    const token = localStorage.getItem("customer_token");
    if (!token) return false;

    setLoading(true);
    try {
      const res = await fetch("/api/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          op: "updateWishlistItem",
          token,
          wishlistId: wishlistId || undefined,
          itemId,
          quantity,
        }),
      });
      const data = await res.json();
      if (data.error) {
        return false;
      }
      if (data.wishlist) {
        setWishlistId(data.wishlist.id);
        const rawItems = data.wishlist.items_v2?.items || [];
        const adapted: WishlistItem[] = rawItems
          .filter((item: any) => item?.product)
          .map((item: any) => ({
            id: String(item.id),
            product: adaptGqlProduct(item.product),
          }));
        setWishlistItems(adapted);
      } else {
        await fetchWishlist();
      }
      return true;
    } catch (e) {
      console.error("[wishlist] update failed:", e);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return (
    <WishlistContext.Provider
      value={{
        wishlistItems,
        wishlistId,
        loading,
        addToWishlist,
        removeFromWishlist,
        isWishlisted,
        moveToCart,
        updateWishlistItem,
        refreshWishlist: fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
