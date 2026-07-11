"use client";
export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { useCompare } from "@/lib/compare-context";
import { useCart } from "@/lib/cart-context";
import { useParams, useRouter } from "next/navigation";
import ProductImage from "@/components/ProductImage";
import { Trash2, ShoppingCart, MessageCircle, ArrowLeft, Star, X } from "lucide-react";
import { t, type Locale } from "@/lib/i18n";
import { Money } from "@/components/Price";

export default function ComparePage() {
  const { comparedProducts, removeFromCompare, clearCompare } = useCompare();
  const { addItem } = useCart();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || "en";
  const isAr = locale === "ar";

  const getTyreSize = (p: any) => {
    if (p.tyreSize) return p.tyreSize;
    if (p.size) return p.size;
    if (p.width && p.height && p.rim) return `${p.width}/${p.height} R${p.rim}`;
    const m = p.name.match(/\d{3}\/\d{2,3}\s*R\d{2}(\s+\d{2,3}[A-Z]{1,2})?/i);
    return m ? m[0].trim() : "";
  };

  const resolveTypeLabel = (p: any) => {
    const cats = (p.categories ?? []).map((c: any) => c.name);
    const match = cats.find((c: any) =>
      /run.?flat/i.test(c) || /on.?road/i.test(c) || /off.?road/i.test(c) || /ev.?tir/i.test(c)
    );
    if (match) {
      return match
        .replace(/tires?|tyres?/gi, "")
        .replace(/\s+/g, "-")
        .replace(/-{2,}/g, "-")
        .replace(/^-|-$/g, "")
        .toUpperCase();
    }
    if (/run.?flat/i.test(p.category)) return "RUN-FLAT";
    if (/on.?road/i.test(p.category)) return "ON-ROAD";
    if (/off.?road/i.test(p.category)) return "OFF-ROAD";
    return p.category ? p.category.toUpperCase() : "-";
  };

  const fmtPrice = (p: any) => {
    const currency = p.currency || "SAR";
    if (p.price <= 0 || p.inStock === false) {
      return t(locale as Locale, "listing.priceOnContact");
    }
    return <Money value={p.price} currency={currency} />;
  };

  if (comparedProducts.length === 0) {
    return (
      <div className="container py-24 flex flex-col items-center justify-center text-center">
        <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-gray-400">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {isAr ? "قائمة المقارنة فارغة" : "Your Compare List is Empty"}
        </h1>
        <p className="text-gray-500 mb-8 max-w-md">
          {isAr
            ? "لم تقم بإضافة أي إطارات للمقارنة بعد. تصفح منتجاتنا وأضف بعض الإطارات هنا."
            : "You haven't added any tyres to compare yet. Browse our collection and add some products here."}
        </p>
        <Link
          href={`/${locale}/tyres`}
          className="bg-[#ed1c24] hover:bg-[#c6181d] text-white font-bold py-3.5 px-8 rounded-xl transition-colors text-sm uppercase tracking-wider shadow-lg shadow-red-500/20"
        >
          {isAr ? "تصفح الإطارات" : "Browse Tyres"}
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen py-12" dir={isAr ? "rtl" : "ltr"}>
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link
              href={`/${locale}/tyres`}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#ed1c24] hover:text-[#c6181d] transition-colors uppercase tracking-wider mb-2"
            >
              <ArrowLeft size={14} className={isAr ? "rotate-185" : ""} />
              {isAr ? "العودة للتسوق" : "Back to Shopping"}
            </Link>
            <h1 className="text-2xl sm:text-3xl font-black text-gray-900 uppercase tracking-wide">
              {isAr ? "مقارنة الإطارات" : "Compare Tyres"}
            </h1>
          </div>
          <button
            onClick={clearCompare}
            className="text-xs font-bold text-gray-500 hover:text-[#ed1c24] transition-colors uppercase tracking-wider flex items-center gap-1.5 border border-gray-200 bg-white hover:border-[#ed1c24]/20 py-2.5 px-4 rounded-lg shadow-sm"
          >
            <Trash2 size={14} />
            {isAr ? "مسح الكل" : "Clear All"}
          </button>
        </div>

        {/* Comparison Table / Matrix */}
        <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-x-auto">
          <table className="w-full table-fixed min-w-[700px] border-collapse">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-[180px] p-6 text-left font-bold text-gray-400 text-xs uppercase tracking-wider bg-gray-50/50">
                  {isAr ? "الميزات" : "Features"}
                </th>
                {comparedProducts.map((p) => (
                  <th key={p.id} className="p-6 relative text-center align-top border-l border-gray-100">
                    <button
                      onClick={() => removeFromCompare(p.id)}
                      className="absolute top-4 right-4 text-gray-400 hover:text-red-500 transition-colors p-1 hover:bg-red-50 rounded-full"
                      title={isAr ? "إزالة" : "Remove"}
                    >
                      <X size={16} />
                    </button>
                    <div className="relative w-28 h-28 mx-auto mb-4 bg-white">
                      <ProductImage
                        src={p.image}
                        alt={p.name}
                        fill
                        className="object-contain p-2"
                      />
                    </div>
                    <Link
                      href={`/${locale}/product/${p.urlKey}`}
                      className="block text-sm font-bold text-gray-900 hover:text-[#ed1c24] transition-colors leading-snug line-clamp-2 px-2"
                    >
                      {p.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Brand */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "العلامة التجارية" : "Brand"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 text-center text-sm font-medium text-gray-700 border-l border-gray-100">
                    {p.brandName || p.brand || "-"}
                  </td>
                ))}
              </tr>

              {/* Size */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "المقاس" : "Size"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 text-center text-sm font-semibold text-gray-900 border-l border-gray-100">
                    {getTyreSize(p) || "-"}
                  </td>
                ))}
              </tr>

              {/* Type */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "النوع" : "Type"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 text-center text-sm border-l border-gray-100">
                    <span className="inline-block bg-gray-100 text-gray-800 text-[10px] font-black uppercase px-2 py-0.5 rounded">
                      {resolveTypeLabel(p)}
                    </span>
                  </td>
                ))}
              </tr>

              {/* Origin */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "بلد المنشأ" : "Country of Origin"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 text-center text-sm text-gray-700 border-l border-gray-100">
                    {p.country || p.origin || "-"}
                  </td>
                ))}
              </tr>

              {/* Year */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "السنة" : "Year"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 text-center text-sm font-semibold text-gray-900 border-l border-gray-100">
                    {p.year || "-"}
                  </td>
                ))}
              </tr>

              {/* Warranty */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "الضمان" : "Warranty"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 text-center text-sm text-gray-700 border-l border-gray-100">
                    {p.warrantyPeriod || "5 Years Warranty"}
                  </td>
                ))}
              </tr>

              {/* Rating */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "التقييم" : "Rating"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 border-l border-gray-100">
                    <div className="flex items-center justify-center gap-1 text-sm font-bold text-gray-900">
                      <Star size={16} fill="#c026d3" stroke="#c026d3" />
                      <span>{p.rating ? p.rating.toFixed(1) : "-"}</span>
                      {p.reviewCount > 0 && (
                        <span className="text-xs font-normal text-gray-400">
                          ({p.reviewCount})
                        </span>
                      )}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Price */}
              <tr className="border-b border-gray-100 hover:bg-gray-50/30 transition-colors">
                <td className="p-4 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "السعر" : "Price"}
                </td>
                {comparedProducts.map((p) => (
                  <td key={p.id} className="p-4 text-center text-lg font-black text-gray-900 border-l border-gray-100">
                    {fmtPrice(p)}
                  </td>
                ))}
              </tr>

              {/* Actions */}
              <tr className="hover:bg-gray-50/30 transition-colors">
                <td className="p-6 font-bold text-gray-900 text-sm bg-gray-50/50">
                  {isAr ? "الإجراءات" : "Actions"}
                </td>
                {comparedProducts.map((p) => {
                  const isOutOfStock = p.inStock === false;
                  const showPriceOnContact = p.price <= 0 || isOutOfStock;
                  const waUrl = `https://wa.me/966500000000?text=${encodeURIComponent(`Hi, I'm interested in: ${p.name}`)}`;

                  return (
                    <td key={p.id} className="p-6 text-center border-l border-gray-100">
                      {showPriceOnContact ? (
                        <a
                          href={waUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center gap-2 w-full bg-[#128c7e] hover:bg-[#0b665c] text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-green-500/10"
                        >
                          <MessageCircle size={15} />
                          {t(locale as Locale, "listing.contactUs")}
                        </a>
                      ) : (
                        <button
                          onClick={() => addItem(p, 1)}
                          className="inline-flex items-center justify-center gap-2 w-full bg-[#ed1c24] hover:bg-[#c6181d] text-white py-3 px-4 rounded-xl font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-red-500/10"
                        >
                          <ShoppingCart size={15} />
                          {isAr ? "إضافة للسلة" : "Add to Cart"}
                        </button>
                      )}
                    </td>
                  );
                })}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
