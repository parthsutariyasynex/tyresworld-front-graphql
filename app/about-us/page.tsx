"use client";

import { usePathname } from "next/navigation";
import PageHeroBanner from "@/components/PageHeroBanner";

export default function AboutUsPage() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";

  return (
    <div className="bg-white" dir="ltr">
      <PageHeroBanner
        title="About Us"
        breadcrumbLabel="About Us"
        description="Learn more about TyresWorld — your trusted destination for genuine tyres, professional fitting, and automotive care in the UAE."
      />

      {/* ── Main Content ── */}
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14">
        <div className="max-w-4xl space-y-8 text-gray-700">

          {/* Section 1: Welcome to TyresWorld */}
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase text-gray-950 tracking-tight mb-3">
              WELCOME TO TYRESWORLD
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              At TyresWorld, we're here to make buying tyres easier and more convenient for everyone in the UAE. As an online retailer, we offer a seamless way to shop for tyres from the comfort of your home, paired with expert fitment services through our trusted network of partner installers. We're dedicated to keeping your journeys smooth and hassle-free, offering everything you need for your vehicle in one place.
            </p>
          </div>

          {/* Section 2: More Than A Tyre Shop */}
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase text-gray-950 tracking-tight mb-3">
              MORE THAN A TYRE SHOP
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              TyresWorld isn't just about selling tyres; it's about creating a better experience for car owners. TyresWorld is operated by DSP Trade Hub FZ-LLC, registered in Ras Al Khaimah, UAE (License No. 5033149 | TRN 105036835400003). Our professional team handles everything from tyre replacements to full car repairs and services. Whether it's a simple tune-up, major vehicle repairs, or specialised services like alloy wheel installations, we've got you covered. We also offer a range of premium car batteries from top brands to keep your vehicle powered and reliable. Whether you choose our mobile van service or visit one of our workshops, you'll find quality, convenience, and care every step of the way.
            </p>
          </div>

          {/* Section 3: What Makes Us Different */}
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase text-gray-950 tracking-tight mb-4">
              WHAT MAKES US DIFFERENT
            </h2>
            <ul className="space-y-2.5 text-xs sm:text-sm text-gray-600 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <strong className="text-gray-900 font-bold">Branded Tyres You Can Trust</strong>
                  {" — "}
                  A wide selection of premium tyres from globally recognised brands, built for quality, durability, and safety on every journey.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <strong className="text-gray-900 font-bold">High-Quality Batteries</strong>
                  {" — "}
                  Choose from top car battery brands, built for lasting performance and reliability.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <strong className="text-gray-900 font-bold">Alloy Wheels for Every Style</strong>
                  {" — "}
                  Stylish, durable alloy wheels to match your vehicle, in every type we stock.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <strong className="text-gray-900 font-bold">Comprehensive Car Care</strong>
                  {" — "}
                  From tyre replacements to full repairs and servicing, our team covers it all.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <strong className="text-gray-900 font-bold">Convenience at Its Best</strong>
                  {" — "}
                  Shop tyres online, book fitting at your nearest partner installer, or let our mobile van come to you.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <strong className="text-gray-900 font-bold">Affordable Excellence</strong>
                  {" — "}
                  Competitive pricing paired with top-quality products and service, for genuine value.
                </span>
              </li>

              <li className="flex items-start gap-2">
                <span className="text-gray-900 font-bold shrink-0 mt-0.5">•</span>
                <span>
                  <strong className="text-gray-900 font-bold">Customer-Focused Support</strong>
                  {" — "}
                  Our team is always ready to help you choose the right tyres, batteries, or services for your needs.
                </span>
              </li>
            </ul>

            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed mt-4">
              At TyresWorld, we make it simple to find high-quality branded tyres, car batteries, alloy wheels, and reliable service — so you can drive with confidence wherever the road takes you.
            </p>
          </div>

          {/* Section 4: A Partner You Can Rely On */}
          <div>
            <h2 className="text-base sm:text-lg font-black uppercase text-gray-950 tracking-tight mb-3">
              A PARTNER YOU CAN RELY ON
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 leading-relaxed">
              At TyresWorld, we're passionate about delivering top-quality tyres and genuinely helpful service. Whether you're replacing worn-out tyres, upgrading your vehicle, or looking for expert car care, we're here to help. Join the growing number of drivers across the UAE who trust us to keep their vehicles safe and road-ready.
            </p>

            <p className="text-xs sm:text-sm font-bold text-gray-900 mt-4">
              Drive smarter with TyresWorld. We've got you covered.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
