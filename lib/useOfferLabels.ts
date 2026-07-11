"use client";

import { useState, useEffect } from "react";

// Module-level cache shared across all component instances.
// Populated on the first fetch and reused for every subsequent render.
let _cache: Record<string, string> | null = null;
let _pending: Promise<Record<string, string>> | null = null;

function load(store: string): Promise<Record<string, string>> {
  if (_cache) return Promise.resolve(_cache);
  if (!_pending) {
    _pending = fetch(`/api/offer-options?store=${store}`)
      .then(r => r.json())
      .then(d => {
        _cache = (d.options as Record<string, string>) ?? {};
        return _cache;
      })
      .catch(() => {
        _pending = null; // allow retry on next mount if the request failed
        return {} as Record<string, string>;
      });
  }
  return _pending;
}

/**
 * Returns a mapping of Magento offer option IDs → label strings.
 * e.g. { "4898": "Buy 3 Get 1 Free", "4895": "Budget Deals", ... }
 *
 * The fetch is deduped at module level — only one network request per session.
 * Pass product.offersId as the key to resolve a label:
 *   const labels = useOfferLabels();
 *   const offerLabel = product.offersId ? labels[product.offersId] : undefined;
 */
export function useOfferLabels(store = "default"): Record<string, string> {
  const [labels, setLabels] = useState<Record<string, string>>(_cache ?? {});

  useEffect(() => {
    if (_cache) {
      setLabels(_cache);
      return;
    }
    load(store).then(m => setLabels(m));
  }, [store]);

  return labels;
}
