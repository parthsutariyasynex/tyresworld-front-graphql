import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Leaf, Heart, Zap, Globe } from "lucide-react";

/* Presentational team content (no product/API source). */
const teamMembers = [
  { id: "tm1", name: "Khalid Rahman", role: "Founder & CEO", bio: "Built the store to make quality tyres accessible across the UAE." },
  { id: "tm2", name: "Mariam Saleh", role: "Head of Operations", bio: "Keeps fitting, delivery and stock running like clockwork." },
  { id: "tm3", name: "Daniel Osei", role: "Lead Fitter", bio: "20 years on the workshop floor — every fit done right." },
  { id: "tm4", name: "Aisha Noor", role: "Customer Care", bio: "Here to help you find the perfect match for your vehicle." },
];

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export const metadata: Metadata = {
  title: "About Us",
  description:
    "Learn about Maison — our story, our values, and the people behind the brand.",
};

const stats = [
  { value: "2018", label: "Founded" },
  { value: "40K+", label: "Happy customers" },
  { value: "500+", label: "Curated products" },
  { value: "12", label: "Countries shipped" },
];

const values = [
  {
    icon: Leaf,
    title: "Sustainably Sourced",
    desc: "Every material we use is chosen for its environmental footprint as much as its quality. We partner only with suppliers who share our commitment to the planet.",
  },
  {
    icon: Heart,
    title: "Made with Craft",
    desc: "We believe objects made by skilled hands, with care and intention, outlast anything mass-produced. Quality that you can feel and see every single day.",
  },
  {
    icon: Zap,
    title: "Designed to Last",
    desc: "We reject the throwaway culture. Every Maison product is designed to be used daily for years — and to look better with age, not worse.",
  },
  {
    icon: Globe,
    title: "Globally Minded",
    desc: "Our sourcing team travels the world to discover the best makers — small studios, family workshops, and artisans who deserve a global audience.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-ink py-24 lg:py-36">
        <div className="absolute inset-0">
          <Image
            src="https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80&auto=format&fit=crop"
            alt="Maison studio"
            fill
            priority
            className="object-cover opacity-25"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-ink/60 to-ink/90" />
        </div>
        <div className="relative container text-center max-w-3xl mx-auto">
          <span className="eyebrow text-white/40 mb-5 justify-center block">
            <span className="w-5 h-px bg-white/20" />
            Our story
          </span>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl text-white tracking-tight leading-[1.04] mb-6">
            Designed for the life you actually live
          </h1>
          <p className="text-white/60 text-lg leading-relaxed max-w-xl mx-auto">
            Maison was born from a simple frustration: why is it so hard to find
            beautiful, functional, honest products that don&apos;t cost a fortune or
            harm the planet?
          </p>
        </div>
      </section>

      {/* Stats */}
      <section className="border-b border-ink/5">
        <div className="container">
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-ink/5">
            {stats.map(({ value, label }) => (
              <div key={label} className="text-center py-10 lg:py-14 px-6">
                <p className="font-display text-5xl text-ink tracking-tight mb-2">
                  {value}
                </p>
                <p className="text-sm text-ink/45">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="grid lg:grid-cols-2 gap-14 lg:gap-20 items-center">
            <div className="relative">
              <div className="aspect-[4/5] rounded-2xl overflow-hidden">
                <Image
                  src="https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&q=80&auto=format&fit=crop"
                  alt="Maison showroom"
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
              </div>
              {/* Floating card */}
              <div className="absolute -right-4 -bottom-4 bg-white rounded-2xl shadow-cardHover p-5 max-w-[200px]">
                <p className="font-display text-4xl text-ink mb-1">8+</p>
                <p className="text-xs text-ink/50 leading-snug">
                  Years of considered design and honest curation
                </p>
              </div>
            </div>

            <div>
              <span className="eyebrow mb-5 block">
                <span className="w-5 h-px bg-ink-muted" />
                The Maison story
              </span>
              <h2 className="section-title mb-6">
                Started with a sofa, grown into a philosophy
              </h2>
              <div className="space-y-4 text-ink/65 leading-relaxed">
                <p>
                  In 2018, our founder Claire Fontaine was renovating her Paris
                  apartment and couldn&apos;t find what she was looking for anywhere:
                  products that were genuinely beautiful, actually functional, and
                  made with materials she could feel good about.
                </p>
                <p>
                  So she started sourcing them herself — from small studios in
                  Scandinavia, family workshops in Portugal, artisans in Japan. What
                  began as a personal project became a community of people who felt
                  exactly the same way.
                </p>
                <p>
                  Today, Maison is a team of 28 people across four countries, united
                  by the belief that the objects in your home should make your life
                  better — not just your Instagram feed.
                </p>
              </div>

              <Link href="/" className="btn-primary text-sm px-8 py-3.5 mt-10 inline-flex">
                Explore the collection
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="py-20 lg:py-28 bg-cream">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="eyebrow mb-4 justify-center block">
              <span className="w-5 h-px bg-ink-muted" />
              What we stand for
            </span>
            <h2 className="section-title">Our values</h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map(({ icon: Icon, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 shadow-card">
                <div className="w-11 h-11 rounded-xl bg-accent/10 flex items-center justify-center mb-5">
                  <Icon size={20} className="text-accent" />
                </div>
                <h3 className="font-semibold text-ink mb-3">{title}</h3>
                <p className="text-sm text-ink/55 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-20 lg:py-28">
        <div className="container">
          <div className="text-center max-w-xl mx-auto mb-14">
            <span className="eyebrow mb-4 justify-center block">
              <span className="w-5 h-px bg-ink-muted" />
              The people
            </span>
            <h2 className="section-title">Meet the team</h2>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {teamMembers.map((member) => (
              <div key={member.id} className="group text-center">
                <div className="aspect-[4/5] rounded-2xl overflow-hidden bg-gradient-to-br from-ink/10 to-ink/5 mb-4 relative flex items-center justify-center">
                  <span className="font-display text-4xl text-ink/30 group-hover:scale-105 transition-transform duration-500">
                    {initials(member.name)}
                  </span>
                </div>
                <h3 className="font-semibold text-ink text-sm">{member.name}</h3>
                <p className="text-xs text-accent font-medium mt-0.5 mb-2">{member.role}</p>
                <p className="text-xs text-ink/50 leading-relaxed max-w-[180px] mx-auto">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-cream py-20 lg:py-24 border-t border-ink/5">
        <div className="container text-center max-w-xl mx-auto">
          <h2 className="section-title mb-5">Ready to bring Maison home?</h2>
          <p className="text-ink/55 mb-9">
            Browse our full collection of considered goods, or reach out — we&apos;d
            love to hear from you.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/" className="btn-primary text-sm px-8 py-3.5">
              Shop the collection <ArrowRight size={15} />
            </Link>
            <Link href="/contact" className="btn-secondary text-sm px-8 py-3.5">
              Get in touch
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
