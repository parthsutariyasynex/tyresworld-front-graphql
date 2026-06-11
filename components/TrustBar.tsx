import { Truck, RefreshCcw, ShieldCheck, Leaf } from "lucide-react";

const items = [
  {
    icon: Truck,
    title: "Free shipping",
    sub: "On orders over $75",
  },
  {
    icon: RefreshCcw,
    title: "60-day returns",
    sub: "Hassle-free, no questions",
  },
  {
    icon: ShieldCheck,
    title: "Secure checkout",
    sub: "256-bit SSL encryption",
  },
  {
    icon: Leaf,
    title: "Sustainably sourced",
    sub: "Ethical supply chain",
  },
];

export default function TrustBar() {
  return (
    <section className="border-y border-ink/5 py-6">
      <div className="container">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-0 lg:divide-x divide-ink/8">
          {items.map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="flex items-center gap-3 lg:justify-center lg:px-8"
            >
              <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Icon size={16} className="text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-ink">{title}</p>
                <p className="text-xs text-ink/50 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
