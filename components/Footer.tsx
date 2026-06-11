import { Instagram, Twitter, Youtube } from "lucide-react";

const links = {
  Shop: ["New Arrivals", "Living", "Kitchen", "Bedroom", "Apparel", "Sale"],
  Company: ["Our Story", "Sustainability", "Press", "Careers"],
  Support: ["FAQ", "Shipping & Returns", "Track Order", "Contact Us"],
};

export default function Footer() {
  return (
    <footer className="bg-white border-t border-ink/5">
      <div className="container py-16 lg:py-20">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-2">
            <a href="/" className="flex items-center gap-1 mb-5">
              <span className="font-display text-2xl tracking-tight text-ink">
                Maison
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-accent mb-1 self-end" />
            </a>
            <p className="text-sm text-ink/50 leading-relaxed max-w-xs">
              Considered goods designed for the way you actually live. Premium
              materials, timeless forms.
            </p>

            {/* Social */}
            <div className="flex gap-2 mt-7">
              {[
                { Icon: Instagram, label: "Instagram" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Youtube, label: "YouTube" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="w-9 h-9 rounded-full border border-ink/10 flex items-center justify-center text-ink/40 hover:text-ink hover:border-ink/30 transition-colors"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(links).map(([heading, items]) => (
            <div key={heading} className="col-span-1">
              <p className="text-xs font-semibold uppercase tracking-widest text-ink mb-5">
                {heading}
              </p>
              <ul className="flex flex-col gap-3">
                {items.map((item) => (
                  <li key={item}>
                    <a
                      href="#"
                      className="text-sm text-ink/50 hover:text-ink transition-colors"
                    >
                      {item}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-14 pt-7 border-t border-ink/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ink/35">
          <p>© 2026 Maison. All rights reserved.</p>
          <div className="flex items-center gap-5">
            <a href="#" className="hover:text-ink transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-ink transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-ink transition-colors">Accessibility</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
