"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Minus, Plus, ShoppingBag, Check, ArrowLeft, Truck, ShieldCheck, Star, Loader2, AlertCircle } from "lucide-react";
import ProductImage from "@/components/ProductImage";
import { useCart } from "@/lib/cart-context";
import type { ProductDetail } from "@/lib/magento";
import type { Product } from "@/lib/data";

type State =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ok"; product: ProductDetail };

function Stars({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${rating} out of 5`}>
      {[...Array(5)].map((_, i) => (
        <Star key={i} size={14} className={i < Math.round(rating) ? "fill-accent text-accent" : "text-ink/15"} />
      ))}
    </div>
  );
}

export default function ProductDetailPage() {
  const params = useParams();
  const urlKey = decodeURIComponent(String(params.urlKey ?? ""));
  const { addItem, loading: cartBusy } = useCart();

  const [state, setState] = useState<State>({ status: "loading" });
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    fetch(`/api/product?urlKey=${encodeURIComponent(urlKey)}`, { cache: "no-store" })
      .then((r) => r.json())
      .then((j) => {
        if (!active) return;
        if (j.product) setState({ status: "ok", product: j.product });
        else setState({ status: "error", message: j.error ?? "Product not found." });
      })
      .catch(() => active && setState({ status: "error", message: "Failed to load product." }));
    return () => { active = false; };
  }, [urlKey]);

  const product = state.status === "ok" ? state.product : null;
  const money = (v: number) => `${product?.currency ?? "AED"} ${v.toLocaleString()}`;

  const cartProduct: Product | null = useMemo(
    () =>
      product && {
        id: product.uid, sku: product.sku, urlKey: product.urlKey, name: product.name,
        price: product.price, originalPrice: product.originalPrice, category: product.category,
        image: product.image, rating: product.rating, reviewCount: product.reviewCount,
      },
    [product]
  );

  async function handleAdd() {
    if (!cartProduct || adding) return;
    setAdding(true);
    setAddError(null);
    try {
      const result = await addItem(cartProduct, qty);
      if (result.error) {
        setAddError(result.error);
        setTimeout(() => setAddError(null), 5000);
      } else {
        setAdded(true);
        setTimeout(() => setAdded(false), 2500);
      }
    } finally {
      setAdding(false);
    }
  }

  /* ── Loading ─────────────────────────────────────────────────── */
  if (state.status === "loading") {
    return (
      <div className="container py-10 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14">
          <div className="aspect-square rounded-2xl bg-ink/5 animate-pulse" />
          <div className="space-y-4">
            <div className="h-4 w-24 bg-ink/10 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-ink/10 rounded animate-pulse" />
            <div className="h-6 w-32 bg-ink/10 rounded animate-pulse" />
            <div className="h-24 w-full bg-ink/5 rounded animate-pulse" />
            <div className="h-12 w-48 bg-ink/10 rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  /* ── Error / not found ───────────────────────────────────────── */
  if (state.status === "error") {
    return (
      <div className="container py-24 text-center max-w-md mx-auto">
        <h1 className="font-display text-3xl text-ink mb-3">Product not found</h1>
        <p className="text-ink/50 mb-8">{state.message}</p>
        <Link href="/shop" className="btn-primary text-sm px-8 py-3.5">
          <ArrowLeft size={15} /> Back to shop
        </Link>
      </div>
    );
  }

  /* ── Detail ──────────────────────────────────────────────────── */
  const p = state.product;
  const discount = p.discountPercent ?? (p.originalPrice ? Math.round((1 - p.price / p.originalPrice) * 100) : 0);

  return (
    <>
      {/* Breadcrumb */}
      <div className="bg-cream border-b border-ink/5 py-6">
        <div className="container">
          <p className="text-xs text-ink/40">
            <Link href="/" className="hover:text-ink transition-colors">Home</Link>
            {" / "}
            <Link href="/shop" className="hover:text-ink transition-colors">Shop</Link>
            {" / "}
            <span className="text-ink/70">{p.name}</span>
          </p>
        </div>
      </div>

      <div className="container py-10 lg:py-14">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-14 items-start">
          {/* Gallery */}
          <div className="lg:sticky lg:top-24">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-cream">
              <ProductImage
                src={p.gallery[activeImg]?.url ?? p.image}
                alt={p.gallery[activeImg]?.label || p.name}
                fill
                className="object-contain"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              {discount > 0 && (
                <span className="absolute top-4 left-4 text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded-full bg-accent text-white z-10">
                  −{discount}%
                </span>
              )}
            </div>
            {p.gallery.length > 1 && (
              <div className="flex gap-3 mt-4 overflow-x-auto hide-scrollbar">
                {p.gallery.map((g, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImg(i)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden bg-cream flex-shrink-0 border-2 transition-colors ${
                      i === activeImg ? "border-ink" : "border-transparent hover:border-ink/20"
                    }`}
                    aria-label={`View image ${i + 1}`}
                  >
                    <ProductImage src={g.url} alt={g.label} fill className="object-contain" sizes="80px" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-widest text-ink/35 mb-2">{p.category}</p>
            <h1 className="font-display text-3xl lg:text-4xl text-ink leading-tight mb-3">{p.name}</h1>

            <div className="flex items-center gap-3 mb-5">
              <Stars rating={p.rating} />
              <span className="text-sm text-ink/40">({p.reviewCount} reviews)</span>
              <span className="text-ink/15">·</span>
              <span className="text-xs text-ink/40 font-mono">SKU: {p.sku}</span>
            </div>

            <div className="flex items-center gap-3 mb-5">
              <span className="text-3xl font-bold text-ink">{money(p.price)}</span>
              {p.originalPrice && p.originalPrice > p.price && (
                <span className="text-lg text-ink/30 line-through">{money(p.originalPrice)}</span>
              )}
            </div>

            <div className="mb-6">
              {p.inStock ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                  <Check size={15} /> In stock
                </span>
              ) : (
                <span className="text-sm font-medium text-red-500">Out of stock</span>
              )}
            </div>

            {p.shortDescriptionHtml && (
              <div
                className="text-sm text-ink/65 leading-relaxed mb-7 prose-sm max-w-none [&_p]:mb-2"
                dangerouslySetInnerHTML={{ __html: p.shortDescriptionHtml }}
              />
            )}

            {/* Qty + add to cart */}
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <div className="flex items-center gap-1 border border-ink/10 rounded-xl p-1">
                <button onClick={() => setQty((q) => Math.max(1, q - 1))} className="w-9 h-9 rounded-lg hover:bg-cream flex items-center justify-center text-ink/60 hover:text-ink transition-colors" aria-label="Decrease quantity">
                  <Minus size={15} />
                </button>
                <span className="w-10 text-center text-sm font-medium text-ink">{qty}</span>
                <button onClick={() => setQty((q) => q + 1)} className="w-9 h-9 rounded-lg hover:bg-cream flex items-center justify-center text-ink/60 hover:text-ink transition-colors" aria-label="Increase quantity">
                  <Plus size={15} />
                </button>
              </div>

              <button
                onClick={handleAdd}
                disabled={!p.inStock || cartBusy || adding}
                className={`flex-1 min-w-[200px] flex items-center justify-center gap-2 text-sm font-semibold py-3.5 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                  added
                    ? "bg-emerald-500 text-white"
                    : addError
                    ? "bg-red-500 text-white"
                    : "btn-accent"
                }`}
              >
                {added ? (
                  <><Check size={16} /> Added to cart!</>
                ) : adding ? (
                  <><Loader2 size={16} className="animate-spin" /> Adding…</>
                ) : addError ? (
                  <><AlertCircle size={16} /> Failed — try again</>
                ) : (
                  <><ShoppingBag size={16} /> Add to cart</>
                )}
              </button>
            </div>

            {addError && (
              <p className="text-sm text-red-500 flex items-center gap-1.5 -mt-2">
                <AlertCircle size={14} className="flex-shrink-0" />
                {addError}
              </p>
            )}

            <Link href="/cart" className="text-sm text-ink/50 hover:text-ink transition-colors">
              View cart →
            </Link>

            {/* Trust */}
            <div className="mt-7 pt-6 border-t border-ink/6 flex flex-col gap-2.5">
              {[
                { icon: Truck, text: "Free shipping available across the UAE" },
                { icon: ShieldCheck, text: "Genuine product with warranty" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-2 text-xs text-ink/50">
                  <Icon size={14} className="text-ink/30 flex-shrink-0" />
                  {text}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Full description */}
        {p.descriptionHtml && (
          <div className="mt-14 max-w-3xl">
            <h2 className="section-title text-2xl mb-5">Description</h2>
            <div
              className="text-sm text-ink/70 leading-relaxed [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-3 [&_li]:mb-1 [&_h2]:font-semibold [&_h2]:text-ink [&_h2]:mt-4 [&_h2]:mb-2"
              dangerouslySetInnerHTML={{ __html: p.descriptionHtml }}
            />
          </div>
        )}
      </div>
    </>
  );
}
