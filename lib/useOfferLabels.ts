"use client";

import { useState, useEffect } from "react";

// Per-store cache shared across all component instances.
const _caches: Record<string, Record<string, string>> = {};
const _pendings: Record<string, Promise<Record<string, string>>> = {};

function load(store: string): Promise<Record<string, string>> {
  if (_caches[store]) return Promise.resolve(_caches[store]);
  if (!_pendings[store]) {
    _pendings[store] = fetch(`/api/offer-options?store=${encodeURIComponent(store)}`)
      .then(r => r.json())
      .then(d => {
        _caches[store] = (d.options as Record<string, string>) ?? {};
        return _caches[store];
      })
      .catch(() => {
        delete _pendings[store];
        return {} as Record<string, string>;
      });
  }
  return _pendings[store];
}

/**
 * Returns a mapping of Magento offer option IDs → label strings.
 * e.g. { "4898": "Buy 3 Get 1 Free", "4895": "Budget Deals", ... }
 *
 * Pass product.offersId as the key to resolve a label:
 *   const labels = useOfferLabels(locale);
 *   const offerLabel = product.offersId ? labels[product.offersId] : undefined;
 */
export function useOfferLabels(store = "default"): Record<string, string> {
  const [labels, setLabels] = useState<Record<string, string>>(_caches[store] ?? {});

  useEffect(() => {
    if (_caches[store]) {
      setLabels(_caches[store]);
      return;
    }
    load(store).then(m => setLabels(m));
  }, [store]);

  return labels;
}
