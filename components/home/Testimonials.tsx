/* Presentational testimonial content (no product/API source). */
const testimonials = [
  {
    id: "t1",
    name: "Omar Al Maktoum",
    role: "Fleet Manager",
    location: "Dubai",
    rating: 5,
    text: "Ordered a full set for our fleet — competitive prices, genuine stock, and fitting sorted the same week. Exactly what we needed.",
  },
  {
    id: "t2",
    name: "Sara Haddad",
    role: "Daily Commuter",
    location: "Sharjah",
    rating: 5,
    text: "The size finder made it effortless to get the right tyres for my SUV. Delivery was quick and the prices beat the local shops.",
  },
  {
    id: "t3",
    name: "James Carter",
    role: "Weekend Driver",
    location: "Abu Dhabi",
    rating: 4,
    text: "Great range of premium brands and clear specs on every product. Happy with the grip and the warranty options.",
  },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function Stars({ count }: { count: number }) {
  return (
    <div className="flex gap-0.5">
      {[...Array(5)].map((_, i) => (
        <svg
          key={i}
          width="13"
          height="13"
          viewBox="0 0 12 12"
          fill={i < count ? "#FF6B35" : "#E5E7EB"}
        >
          <path d="M6 1l1.4 2.8 3.1.4-2.2 2.2.5 3.1L6 8.1l-2.8 1.4.5-3.1L1.5 4.2l3.1-.4z" />
        </svg>
      ))}
    </div>
  );
}

export default function Testimonials() {
  return (
    <section className="py-20 lg:py-28 bg-cream">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-xl mx-auto mb-14">
          <span className="eyebrow mb-4 justify-center">
            <span className="w-5 h-px bg-ink-muted" />
            What customers say
          </span>
          <h2 className="section-title">Loved by 40,000+ customers</h2>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={t.id}
              className={`bg-white rounded-2xl p-6 shadow-card hover:shadow-cardHover transition-shadow duration-300 flex flex-col gap-4 ${
                i === 0 ? "md:col-span-2 lg:col-span-1" : ""
              }`}
            >
              {/* Stars */}
              <Stars count={t.rating} />

              {/* Quote */}
              <p className="text-sm text-ink/70 leading-relaxed flex-1">
                &ldquo;{t.text}&rdquo;
              </p>

              {/* Author */}
              <div className="flex items-center gap-3 pt-2 border-t border-ink/5">
                <div className="w-10 h-10 rounded-full bg-ink/8 text-ink/70 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                  {initials(t.name)}
                </div>
                <div>
                  <p className="text-sm font-semibold text-ink">{t.name}</p>
                  <p className="text-xs text-ink/45">
                    {t.role} · {t.location}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
