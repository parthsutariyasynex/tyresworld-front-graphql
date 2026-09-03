"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Mail, Clock, ArrowUp } from "lucide-react";

export default function Footer() {
  const pathname = usePathname();
  const locale = pathname?.split("/")[1] === "ar" ? "ar" : "en";
  const isAr = locale === "ar";

  const [showTop, setShowTop] = useState(false);

  /* Reveal the back-to-top control once the user has scrolled a screenful. */
  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 600);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <footer className="section site-footer page-footer bg-[#121011] text-[#a0a0a0] pt-14 pb-0 relative">
      <div className="container custom-width max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 pb-12">
          
          {/* Column 1: PRODUCT INFORMATION */}
          <div className="widget-col footer-links">
            <div className="widget">
              <div className="widget-title mb-5">
                <h3 className="text-white text-base sm:text-[17px] font-black uppercase tracking-wider m-0">
                  {isAr ? "معلومات " : "PRODUCT "}
                  <span className="text-[#ed1c24] theme_color">
                    {isAr ? "المنتجات" : "INFORMATION"}
                  </span>
                </h3>
              </div>
              <div className="menu-footer-nav1-container">
                <ul className="menu list-none p-0 m-0 flex flex-col gap-2.5 text-sm">
                  <li>
                    <Link href={`/${locale}/special-offers`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "عروض الإطارات المميزة" : "Special Tyre Offers"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/tyres/cars`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "البحث حسب المركبة" : "Search by Vehicle"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/tyres/size`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "البحث حسب المقاس" : "Search by Tyre size"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/brands`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "ماركات الإطارات" : "Tyre Brands"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/electric-vehicle-tyres-uae`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "إطارات السيارات الكهربائية" : "EV Tyres Online"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/car-battery-replacement`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "استبدال بطارية السيارة" : "Car Battery Replacement"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/rim-protectors`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "حماة الجنوط Alloygator" : "Alloygator Rim Protectors"}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 2: PREMIUM TYRE */}
          <div className="widget-col footer-links">
            <div className="widget">
              <div className="widget-title mb-5">
                <h3 className="text-white text-base sm:text-[17px] font-black uppercase tracking-wider m-0">
                  {isAr ? "إطارات " : "PREMIUM "}
                  <span className="text-[#ed1c24] theme_color">
                    {isAr ? "فاخرة" : "TYRE"}
                  </span>
                </h3>
              </div>
              <div className="menu-footer-nav1-container">
                <ul className="menu list-none p-0 m-0 flex flex-col gap-2.5 text-sm">
                  <li>
                    <Link href={`/${locale}/tyres/brand/pirelli`} className="hover:text-[#ed1c24] transition-colors">
                      Pirelli
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/tyres/brand/continental`} className="hover:text-[#ed1c24] transition-colors">
                      Continental
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/tyres/brand/michelin`} className="hover:text-[#ed1c24] transition-colors">
                      Michelin
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/tyres/brand/goodyear`} className="hover:text-[#ed1c24] transition-colors">
                      Goodyear
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/tyres/brand/bridgestone`} className="hover:text-[#ed1c24] transition-colors">
                      Bridgestone
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/tyres/brand/hankook`} className="hover:text-[#ed1c24] transition-colors">
                      Hankook
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/tyres/brand/kumho`} className="hover:text-[#ed1c24] transition-colors">
                      Kumho
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 3: Why tyresworld.ae? */}
          <div className="widget-col footer-links">
            <div className="widget">
              <div className="widget-title mb-5">
                <h3 className="text-white text-base sm:text-[17px] font-black uppercase tracking-wider m-0">
                  {isAr ? "لماذا " : "Why "}
                  <span className="text-[#ed1c24] theme_color">
                    tyresworld.ae?
                  </span>
                </h3>
              </div>
              <div className="menu-footer-nav1-container">
                <ul className="menu list-none p-0 m-0 flex flex-col gap-2.5 text-sm">
                  <li>
                    <Link href={`/${locale}/about-us`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "من نحن" : "About Us"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/car-service`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "خدمة السيارات" : "Car Service"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/contact`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "اتصل بنا" : "Contact Us"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/fitting-installation-partner`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "شركاء التركيب والتركيب" : "Fitting & Installation Partner"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/blog`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "المدونة" : "Blog"}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 4: Website Information */}
          <div className="widget-col footer-links">
            <div className="widget">
              <div className="widget-title mb-5">
                <h3 className="text-white text-base sm:text-[17px] font-black uppercase tracking-wider m-0">
                  {isAr ? "معلومات " : "Website "}
                  <span className="text-[#ed1c24] theme_color">
                    {isAr ? "الموقع" : "Information"}
                  </span>
                </h3>
              </div>
              <div className="menu-footer-nav1-container">
                <ul className="menu list-none p-0 m-0 flex flex-col gap-2.5 text-sm">
                  <li>
                    <Link href={`/${locale}/terms-conditions`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "الشروط والأحكام" : "Terms & Conditions"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/returns-exchanges`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "الإرجاع والاسترداد" : "Returns & Refund"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/warranty`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "الضمان" : "Warranty"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/privacy-policy`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                    </Link>
                  </li>
                  <li>
                    <Link href={`/${locale}/shipping-and-delivery-policy`} className="hover:text-[#ed1c24] transition-colors">
                      {isAr ? "سياسة الشحن والتوصيل" : "Shipping Policy"}
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Column 5: Get In Touch */}
          <div className="widget-col footer-contact">
            <div className="widget_text widget">
              <div className="widget-title mb-5">
                <h3 className="text-white text-base sm:text-[17px] font-black uppercase tracking-wider m-0">
                  {isAr ? "تواصل " : "Get In "}
                  <span className="text-[#ed1c24] theme_color">
                    {isAr ? "معنا" : "Touch"}
                  </span>
                </h3>
              </div>
              <div className="textwidget custom-html-widget text-xs leading-relaxed">
                <ul className="list-none p-0 m-0 flex flex-col gap-3">
                  <li className="text-white/70">
                    <b className="text-white block text-sm mb-1">DSP Trade Hub FZ-LLC</b>
                    Compass Building, Al Shohada Road,
                    AL Hamra Industrial Zone-FZ, 
                    Ras Al Khaimah,
                    United Arab Emirates
                    <br />
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://maps.app.goo.gl/tcDkQJXipiVixvZj8"
                      className="text-[#ed1c24] hover:underline font-semibold block mt-1 text-sm"
                    >
                      {isAr ? "عرض على الخريطة" : "View on Map"}
                    </a>
                    <span className="block mt-1">License: 5033149</span>
                    <span className="block">TRN: 105036835400003</span>
                  </li>

                  <li>
                    <a href="mailto:info@tyresworld.ae" className="flex items-center gap-2 hover:text-[#ed1c24] transition-colors text-sm">
                      <Mail size={15} className="text-[#ed1c24] flex-shrink-0" />
                      info@tyresworld.ae
                    </a>
                  </li>

                  <li>
                    <a
                      target="_blank"
                      rel="noopener noreferrer"
                      href="https://api.whatsapp.com/send/?phone=971505069575&text=Hi%20tyresworld.ae"
                      className="flex items-center gap-2 hover:text-[#ed1c24] transition-colors text-sm font-semibold"
                    >
                      <svg className="w-4 h-4 fill-[#25D366] flex-shrink-0" viewBox="0 0 24 24" aria-hidden="true">
                        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.115-2.89-6.984C16.279 1.89 13.802 1.865 11.2 1.865c-5.437 0-9.863 4.421-9.868 9.868-.001 1.714.452 3.39 1.31 4.877L1.625 21.82l5.022-1.317zm11.393-5.263c-.3-.149-1.772-.875-2.046-.975-.274-.1-.474-.149-.674.15-.2.299-.774.974-.949 1.173-.175.2-.35.224-.65.075-.3-.15-1.263-.465-2.403-1.485-.888-.793-1.488-1.77-1.663-2.07-.175-.3-.019-.461.13-.61.135-.133.3-.349.45-.523.15-.174.2-.299.3-.499.1-.2.05-.375-.025-.524-.075-.15-.675-1.625-.925-2.225-.244-.589-.491-.51-.674-.519-.174-.009-.374-.01-.574-.01-.2 0-.525.075-.8.374-.275.299-1.05 1.024-1.05 2.5 0 1.475 1.075 2.9 1.225 3.1.15.2 2.11 3.22 5.116 4.52.716.31 1.274.496 1.71.636.72.228 1.376.196 1.894.118.578-.087 1.772-.724 2.022-1.424.25-.699.25-1.299.175-1.424-.075-.125-.275-.199-.575-.349z" />
                      </svg>
                      +971 50 506 9575
                    </a>
                  </li>

                  <li className="flex items-start gap-2 text-white/70">
                    <Clock size={15} className="text-[#ed1c24] flex-shrink-0 mt-0.5" />
                    <span>
                      Mon to Sat: 8:30 am - 6:00 pm
                      <br />
                      Sunday: Closed
                    </span>
                  </li>
                </ul>
              </div>

              {/* Social links */}
              <div className="social-links hover-circle mt-5">
                <div className="icon-lists list-custom flex items-center gap-3">
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ed1c24] flex items-center justify-center transition-colors"
                    href="https://www.facebook.com/tyresworld.ae/"
                    aria-label="Facebook"
                  >
                    <svg fill="#fff" className="w-4 h-4" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                      <path d="M21.95 5.005l-3.306-.004c-3.206 0-5.277 2.124-5.277 5.415v2.495H10.05v4.515h3.317l-.004 9.575h4.641l.004-9.575h3.806l-.003-4.514h-3.803v-2.117c0-1.018.241-1.533 1.566-1.533l2.366-.001.01-4.256z"></path>
                    </svg>
                  </a>
                  <a
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-8 h-8 rounded-full bg-white/10 hover:bg-[#ed1c24] flex items-center justify-center transition-colors"
                    href="https://www.instagram.com/tyresworld.ae/"
                    aria-label="Instagram"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" clipRule="evenodd" d="M12 18C15.3137 18 18 15.3137 18 12C18 8.68629 15.3137 6 12 6C8.68629 6 6 8.68629 6 12C6 15.3137 8.68629 18 12 18ZM12 16C14.2091 16 16 14.2091 16 12C16 9.79086 14.2091 8 12 8C9.79086 8 8 9.79086 8 12C8 14.2091 9.79086 16 12 16Z" fill="#fff"></path>
                      <path d="M18 5C17.4477 5 17 5.44772 17 6C17 6.55228 17.4477 7 18 7C18.5523 7 19 6.55228 19 6C19 5.44772 18.5523 5 18 5Z" fill="#fff"></path>
                      <path fillRule="evenodd" clipRule="evenodd" d="M1.65396 4.27606C1 5.55953 1 7.23969 1 10.6V13.4C1 16.7603 1 18.4405 1.65396 19.7239C2.2292 20.8529 3.14708 21.7708 4.27606 22.346C5.55953 23 7.23969 23 10.6 23H13.4C16.7603 23 18.4405 23 19.7239 22.346C20.8529 21.7708 21.7708 20.8529 22.346 19.7239C23 18.4405 23 16.7603 23 13.4V10.6C23 7.23969 23 5.55953 22.346 4.27606C21.7708 3.14708 20.8529 2.2292 19.7239 1.65396C18.4405 1 16.7603 1 13.4 1H10.6C7.23969 1 5.55953 1 4.27606 1.65396C3.14708 2.2292 2.2292 3.14708 1.65396 4.27606ZM13.4 3H10.6C8.88684 3 7.72225 3.00156 6.82208 3.0751C5.94524 3.14674 5.49684 3.27659 5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404C3.27659 5.49684 3.14674 5.94524 3.0751 6.82208C3.00156 7.72225 3 8.88684 3 10.6V13.4C3 15.1132 3.00156 16.2777 3.0751 17.1779C3.14674 18.0548 3.27659 18.5032 3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564C5.49684 20.7234 5.94524 20.8533 6.82208 20.9249C7.72225 20.9984 8.88684 21 10.6 21H13.4C15.1132 21 16.2777 20.9984 17.1779 20.9249C18.0548 20.8533 18.5032 20.7234 18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816C20.7234 18.5032 20.8533 18.0548 20.9249 17.1779C20.9984 16.2777 21 15.1132 21 13.4V10.6C21 8.88684 20.9984 7.72225 20.9249 6.82208C20.8533 5.94524 20.7234 5.49684 20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597C18.5032 3.27659 18.0548 3.14674 17.1779 3.0751C16.2777 3.00156 15.1132 3 13.4 3Z" fill="#fff"></path>
                    </svg>
                  </a>
                </div>
              </div>

            </div>
          </div>

        </div>
      </div>

      {/* Copyright strip — three columns (copyright · links · payment), mirroring
          the theme's .footer-copyright. Extra bottom padding keeps it above the
          sticky TyreFinder. */}
      <div className="footer-copyright bg-[#1e1e20] pt-5 pb-20 sm:pb-24 border-t border-white/5">
        <div className="container custom-width max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col xl:flex-row items-center justify-between gap-4 xl:gap-6 text-center xl:text-left">

            {/* Copyright */}
            <div className="copyright">
              <span className="text-xs text-white/50 leading-relaxed">
                Copyright © {new Date().getFullYear()} tyresworld.ae (DSP Trade Hub FZ LLC). All rights reserved.
              </span>
            </div>

            {/* Quick links */}
            <ul className="copyright-links list-none flex flex-wrap items-center justify-center gap-x-5 gap-y-1 m-0 p-0">
              <li>
                <Link href={`/${locale}/tyres`} className="text-xs text-white/60 hover:text-[#ed1c24] transition-colors">
                  Car Tyres
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/contact`} className="text-xs text-white/60 hover:text-[#ed1c24] transition-colors">
                  Contact
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/faq`} className="text-xs text-white/60 hover:text-[#ed1c24] transition-colors">
                  FAQs
                </Link>
              </li>
              <li>
                <Link href={`/${locale}/sitemap`} className="text-xs text-white/60 hover:text-[#ed1c24] transition-colors">
                  Sitemap
                </Link>
              </li>
            </ul>

            {/* Accepted payment methods */}
            <div className="payment-method">
              <ul className="list-none flex items-center justify-center xl:justify-end gap-2 m-0 p-0">
                {/* Visa */}
                <li aria-label="Visa" title="Visa">
                  <svg viewBox="0 0 48 32" width="40" height="26" role="img" aria-hidden="true">
                    <rect width="48" height="32" rx="4" fill="#ffffff" />
                    <text x="24" y="21" textAnchor="middle" fontFamily="Kanit, Arial, sans-serif" fontWeight="700" fontStyle="italic" fontSize="13" letterSpacing="0.5" fill="#1A1F71">VISA</text>
                  </svg>
                </li>
                {/* Mastercard */}
                <li aria-label="Mastercard" title="Mastercard">
                  <svg viewBox="0 0 48 32" width="40" height="26" role="img" aria-hidden="true">
                    <rect width="48" height="32" rx="4" fill="#ffffff" />
                    <circle cx="20" cy="16" r="8.5" fill="#EB001B" />
                    <circle cx="28" cy="16" r="8.5" fill="#F79E1B" />
                    <path d="M24 9.6a8.5 8.5 0 0 0 0 12.8 8.5 8.5 0 0 0 0-12.8Z" fill="#FF5F00" />
                  </svg>
                </li>
                {/* Amazon Pay */}
                <li aria-label="Amazon Pay" title="Amazon Pay">
                  <svg viewBox="0 0 48 32" width="40" height="26" role="img" aria-hidden="true">
                    <rect width="48" height="32" rx="4" fill="#ffffff" />
                    <text x="24" y="15" textAnchor="middle" fontFamily="Kanit, Arial, sans-serif" fontWeight="700" fontSize="8" fill="#232F3E">amazon</text>
                    <text x="24" y="25" textAnchor="middle" fontFamily="Kanit, Arial, sans-serif" fontWeight="700" fontSize="9" fill="#FF9900">pay</text>
                  </svg>
                </li>
                {/* Apple Pay */}
                <li aria-label="Apple Pay" title="Apple Pay">
                  <svg viewBox="0 0 48 32" width="40" height="26" role="img" aria-hidden="true">
                    <rect width="48" height="32" rx="4" fill="#ffffff" />
                    <path d="M13.6 11.9c.5-.6.8-1.4.7-2.2-.7 0-1.5.5-2 1.1-.4.5-.8 1.3-.7 2.1.8 0 1.5-.4 2-1Zm.7 1.1c-1.1-.1-2 .6-2.5.6-.5 0-1.3-.6-2.2-.6-1.1 0-2.2.7-2.7 1.7-1.2 2-.3 5 .8 6.6.6.8 1.2 1.7 2.1 1.7.8 0 1.1-.5 2.1-.5s1.3.5 2.2.5c.9 0 1.5-.8 2.1-1.6.6-.9.9-1.8.9-1.9 0 0-1.7-.7-1.7-2.6 0-1.6 1.3-2.4 1.4-2.4-.8-1.1-2-1.2-2.4-1.2Z" fill="#000000" />
                    <text x="30" y="21" textAnchor="middle" fontFamily="Kanit, Arial, sans-serif" fontWeight="600" fontSize="11" fill="#000000">Pay</text>
                  </svg>
                </li>
              </ul>
            </div>

          </div>
        </div>
      </div>

      {/* Back to top */}
      <button
        type="button"
        className={`fixed bottom-20 right-6 z-40 w-10 h-10 rounded-full bg-[#ed1c24] text-white flex items-center justify-center shadow-lg transition-all duration-300 hover:bg-[#c6181d] hover:scale-110 ${
          showTop ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
        onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        aria-label="Back to top"
      >
        <ArrowUp size={18} />
      </button>
    </footer>
  );
}
