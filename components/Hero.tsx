import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Hero() {
  return (
    <section className="bg-cream overflow-hidden">
      <div className="container">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-0 items-center min-h-[88vh] py-16 lg:py-0">
          {/* Text */}
          <div className="flex flex-col items-start max-w-xl">
            <span className="eyebrow mb-6">
              <span className="w-5 h-px bg-ink-muted" />
              Spring Collection 2026
            </span>

            <h1 className="section-title font-display text-5xl sm:text-6xl lg:text-7xl mb-6 text-ink">
              Objects worth{" "}
              <em className="not-italic text-accent">living</em> with
            </h1>

            <p className="text-ink/60 text-lg leading-relaxed mb-10 max-w-md">
              Considered goods designed for the way you actually live. Premium
              materials, timeless forms — no compromises.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
              <a href="/shop" className="btn-primary text-sm px-8 py-3.5">
                Shop the collection
                <ArrowRight size={15} />
              </a>
              <a href="/stories" className="btn-secondary text-sm px-8 py-3.5">
                Our story
              </a>
            </div>

            {/* Social proof */}
            <div className="mt-14 flex items-center gap-4">
              <div className="flex -space-x-2">
                {[
                  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=48&h=48&q=80&auto=format&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=48&h=48&q=80&auto=format&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=48&h=48&q=80&auto=format&fit=crop&crop=face",
                  "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=48&h=48&q=80&auto=format&fit=crop&crop=face",
                ].map((src, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full border-2 border-cream overflow-hidden relative"
                  >
                    <Image src={src} alt="Customer" fill className="object-cover" />
                  </div>
                ))}
              </div>
              <div>
                <div className="flex gap-0.5 mb-0.5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="11" height="11" viewBox="0 0 12 12" fill="#FF6B35">
                      <path d="M6 1l1.4 2.8 3.1.4-2.2 2.2.5 3.1L6 8.1l-2.8 1.4.5-3.1L1.5 4.2l3.1-.4z" />
                    </svg>
                  ))}
                </div>
                <p className="text-xs text-ink/50">
                  <strong className="text-ink font-semibold">40,000+</strong> happy customers
                </p>
              </div>
            </div>
          </div>

          {/* Image */}
          <div className="relative lg:h-[88vh] h-[50vw] min-h-[320px]">
            {/* Main image */}
            <div className="absolute inset-0 lg:inset-y-0 lg:right-[-2rem] lg:left-8 rounded-2xl lg:rounded-none overflow-hidden">
              <Image
                src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=85&auto=format&fit=crop"
                alt="Modern living room with premium furniture"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 1024px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/20 via-transparent to-transparent" />
            </div>

            {/* Floating card */}
            <div className="absolute bottom-6 left-6 lg:bottom-12 lg:left-14 bg-white rounded-2xl shadow-cardHover p-4 flex items-center gap-3 max-w-[220px]">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FF6B35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 12 20 22 4 22 4 12" />
                  <rect x="2" y="7" width="20" height="5" />
                  <line x1="12" y1="22" x2="12" y2="7" />
                  <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
                  <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-ink">Free gift wrapping</p>
                <p className="text-[11px] text-ink/50 mt-0.5">On all orders this month</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
