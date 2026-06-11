const stats = [
  { value: "40K+", label: "Happy customers" },
  { value: "98%", label: "Satisfaction rate" },
  { value: "500+", label: "Curated products" },
  { value: "12", label: "Countries shipped" },
];

export default function BrandStrip() {
  return (
    <section className="py-16 border-y border-ink/5">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-0 lg:divide-x divide-ink/8">
          {stats.map(({ value, label }) => (
            <div key={label} className="text-center lg:px-8">
              <p className="font-display text-4xl lg:text-5xl text-ink tracking-tight">
                {value}
              </p>
              <p className="text-sm text-ink/50 mt-2">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
