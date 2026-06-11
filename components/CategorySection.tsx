import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { categories } from "@/lib/data";

export default function CategorySection() {
  return (
    <section className="py-20 lg:py-28">
      <div className="container">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-12">
          <div>
            <span className="eyebrow mb-3 block">
              <span className="w-5 h-px bg-ink-muted" />
              Browse by category
            </span>
            <h2 className="section-title">Shop the collection</h2>
          </div>
          <a
            href="/shop"
            className="inline-flex items-center gap-2 text-sm font-medium text-ink/60 hover:text-ink transition-colors group"
          >
            View all
            <ArrowRight
              size={15}
              className="group-hover:translate-x-0.5 transition-transform"
            />
          </a>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {categories.map((cat, i) => (
            <a
              key={cat.id}
              href={cat.href}
              className={`group relative overflow-hidden rounded-2xl bg-cream ${i === 0 ? "row-span-2 col-span-2 lg:col-span-1 lg:row-span-1" : ""
                }`}
            >
              {/* Image */}
              <div
                className={`relative w-full overflow-hidden ${i === 0
                  ? "h-64 sm:h-80 lg:h-72"
                  : "h-40 sm:h-48 lg:h-72"
                  }`}
              >
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/60 via-ink/10 to-transparent" />
              </div>

              {/* Label */}
              <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-5">
                <p className="text-white font-display text-lg sm:text-xl leading-tight">
                  {cat.name}
                </p>
                <p className="text-white/60 text-xs mt-0.5">
                  {cat.count} items
                </p>
              </div>

              {/* Arrow chip */}
              <div className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ArrowRight size={14} className="text-white" />
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
