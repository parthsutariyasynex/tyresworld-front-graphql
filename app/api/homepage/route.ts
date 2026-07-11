import { NextResponse } from "next/server";

export async function GET() {
  const homepageData = {
    services: [
      {
        id: "car-tyres",
        title: "CAR TYRES",
        description:
          "Premium car tires with expert installation, balancing, and alignment for safer, smoother, and long-lasting performance.",
        image:     "/YourTrustedAutoCare/service-sample.jpg",
        iconImage: "/car-tyres.png",
      },
      {
        id: "rims-wheels",
        title: "RIMS/WHEELS",
        description:
          "Stylish alloy wheels and durable rims professionally fitted for enhanced appearance, stability, and driving control.",
        image:     "/YourTrustedAutoCare/car-rim.jpg",
        iconImage: "/car-rim-icon.png",
      },
      {
        id: "battery",
        title: "BATTERY",
        description:
          "High-performance car batteries with fast testing and installation for dependable power and longer battery life.",
        image:     "/YourTrustedAutoCare/car-battery.jpg",
        iconImage: "/car-battery-icons.png",
      },
      {
        id: "car-service",
        title: "CAR SERVICE",
        description:
          "Complete car maintenance including oil change, brakes, diagnostics, and routine servicing for safe and efficient driving.",
        image:     "/YourTrustedAutoCare/car-service-img.jpg",
        iconImage: "/car-service-icon.png",
      },
      {
        id: "motorbike-tyres",
        title: "MOTORBIKE TYRES",
        description:
          "Durable motorbike tires with professional fitting for improved grip, stability, enhanced performance, and maximum road safety.",
        image:     "/YourTrustedAutoCare/motorbike-tyre.jpg",
        iconImage: "/motorbike-tyre-icon.png",
      },
    ],
    deliveryBanners: [
      {
        id: "db-1",
        badge: "New",
        title: "WIDE RANGE\nOFF ROAD\nTIRES",
        cta: "Shop Now",
        href: "/",
        image: "/YourTrustedAutoCare/service-sample.jpg",
      },
      {
        id: "db-2",
        title: "STAY SAFE AND\nSAVE TIME",
        cta: "Click here",
        href: "/#search",
        image: "/heropage-banner/banner2_2.jpg",
      },
      {
        id: "db-3",
        title: "WE ARE HERE TO\nHELP",
        cta: "Contact Us",
        href: "/contact",
        image: "/heropage-banner/ev-tire.webp",
      },
    ],
    banners: [
      {
        id: "slide-1",
        badge: "EV Tyres",
        eyebrow: "High-Performance EV Tyres",
        heading: "HIGH-PERFORMANCE\nEV TYRES",
        sub: "Available with leading brands and sizes: Pirelli, Michelin, Continental, Goodyear, Hankook & more.",
        cta: { label: "Search EV Tyres", href: "/#search" },
        secondary: { label: "Browse All", href: "/" },
        image: "/heropage-banner/ev-tire.webp",
      },
      {
        id: "slide-2",
        badge: "Continental",
        eyebrow: "Premium German Engineering",
        heading: "CONTINENTAL TYRES\nFOR EVERY ROAD",
        sub: "Premium German engineering for your driving comfort. Get professional mounting and balancing included.",
        cta: { label: "View Continental tyres", href: "/#search" },
        secondary: { label: "Browse All", href: "/" },
        image: "/heropage-banner/banner-continetal.jpg",
      },
      {
        id: "slide-3",
        badge: "Online Store 2026",
        eyebrow: "Genuine Stock & Warranty",
        heading: "2026 TYRES ONLINE\nDIRECT DISTRIBUTOR PRICES",
        sub: "Guaranteed fresh stock (DOT) with 5 years manufacturer-backed warranty on all passenger, SUV & truck tyres.",
        cta: { label: "Find your size", href: "/#search" },
        secondary: { label: "Contact Sales", href: "/contact" },
        image: "/heropage-banner/2026-tyres-online_1.webp",
      },
      {
        id: "slide-4",
        badge: "Online Store 2026",
        eyebrow: "Genuine Stock & Warranty",
        heading: "2026 TYRES ONLINE\nDIRECT DISTRIBUTOR PRICES",
        sub: "Guaranteed fresh stock (DOT) with 5 years manufacturer-backed warranty on all passenger, SUV & truck tyres.",
        cta: { label: "Find your size", href: "/#search" },
        secondary: { label: "Contact Sales", href: "/contact" },
        image: "/heropage-banner/banner1_3.jpg",
      },
    ],
    categories: [
      {
        id: "tyres",
        name: "Car Tyres",
        description: "Premium car, SUV and performance tyres",
        image: "/heropage-banner/banner1_3.jpg",
        count: 2539,
        href: "/",
      },
      {
        id: "wheels",
        name: "Alloy Wheels",
        description: "Stylish and engineered alloy wheels",
        image: "/heropage-banner/banner2_2.jpg",
        count: 450,
        href: "/",
      },
      {
        id: "batteries",
        name: "Car Batteries",
        description: "Long-lasting car batteries with warranty",
        image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80",
        count: 320,
        href: "/",
      },
      {
        id: "motorcycle",
        name: "Motorcycle Tyres",
        description: "High performance motorcycle tyres",
        image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
        count: 180,
        href: "/",
      },
    ],
    howItWorks: [
      {
        id: "how-1",
        step: "01",
        title: "Search by Size or Vehicle",
        description: "Enter your tyre width, height, and rim, or type in your car make, model, and year to find tyres that fit your vehicle.",
      },
      {
        id: "how-2",
        step: "02",
        title: "Book Mobile Fitting or Center",
        description: "Choose our signature mobile fitting service at your home/office driveway, or pick a partner installation center near you.",
      },
      {
        id: "how-3",
        step: "03",
        title: "Get Installed Safely",
        description: "Our certified tyre technicians deliver, fit, balance, and check your new tyres using state-of-the-art mobile machinery.",
      },
    ],
    whyChooseUs: [
      {
        id: "why-1",
        title: "Exceptional Value on Trusted Tyre Brands",
        description: "At PowerTyre, we bring you competitive pricing on premium and reliable tyre brands, ensuring you get durability, performance, and value with every purchase across KSA.",
      },
      {
        id: "why-2",
        title: "Hassle-Free Tyre Installation Options",
        description: "From major cities to surrounding regions in Saudi Arabia, our trusted fitment partners make tyre installation quick and convenient. Prefer home delivery? We've got that covered too.",
      },
      {
        id: "why-3",
        title: "Safe & Confident Online Buying Experience",
        description: "Shop with peace of mind. PowerTyre uses advanced security standards to protect your personal information and payment details at every step of your online journey.",
      },
      {
        id: "why-4",
        title: "Tyres for Every Vehicle & Driving Style",
        description: "Whether you drive a sedan, SUV, 4x4, or performance vehicle, PowerTyre offers a broad selection of tyre sizes and patterns to match Saudi road conditions perfectly.",
      },
      {
        id: "why-5",
        title: "Fast & Reliable Delivery Across KSA",
        description: "Enjoy smooth logistics and timely delivery throughout Saudi Arabia. On qualifying tyre orders, delivery is included—no hidden surprises.",
      },
      {
        id: "why-6",
        title: "A Tyre Partner You Can Trust",
        description: "PowerTyre is built on transparency, reliability, and customer-first service. Our dedicated team is always ready to guide you before and after your purchase, ensuring complete satisfaction.",
      },
    ],
    faq: [
      {
        id: "faq-1",
        question: "How does the mobile tyre fitting service work?",
        answer: "Once you purchase tyres on our site and choose 'Mobile Fitting', we'll schedule a time. A certified tyre specialist will drive a fully-equipped mobile van to your home or office, remove your old tyres, fit the new ones, balance them, and check alignment. All on the spot in 30-45 minutes.",
      },
      {
        id: "faq-2",
        question: "Are the prices listed on the website inclusive of installation?",
        answer: "Yes, our pricing is fully transparent. The tyre price includes delivery, mounting, computer balancing, standard valve replacement, and disposal of your old tyres. No hidden fees are added at checkout.",
      },
      {
        id: "faq-3",
        question: "How can I verify the manufacturing date (DOT) of the tyres?",
        answer: "We guarantee fresh inventory (typically within 6 to 12 months from factory date). The manufacturing week and year are stamped on the sidewall of each tyre (e.g. '1225' means 12th week of 2025). You are welcome to inspect this with our technicians upon delivery.",
      },
      {
        id: "faq-4",
        question: "What areas do you cover for same-day delivery and mobile fitting?",
        answer: "We provide mobile fitting services and fast delivery across Dubai, Abu Dhabi, Sharjah, and Ajman. Same-day fitting is available for orders placed before 12:00 PM (noon), subject to tyre availability.",
      },
    ],
    cmsInfo: {
      heading: "Your One-Stop Solution for Tyres in the UAE",
      description: "PowerTyre is the UAE's premier online store for tyres, alloy wheels, and car batteries. We offer direct access to global top-tier brands including Michelin, Bridgestone, Continental, Pirelli, Hankook, Kumho, Nexen, Yokohama, and Dunlop at competitive prices. Supported by a fleet of mobile tyre fitting workshops and local centers, we deliver safety, quality, and convenience directly to your driveway.",
    },
    footer: {
      copyright: "© 2026 PowerTyre. All rights reserved.",
      companyLinks: [
        { label: "About PowerTyre", href: "/about" },
        { label: "Mobile Fitting", href: "/about" },
        { label: "Partner Centers", href: "/about" },
        { label: "Contact Us", href: "/contact" },
      ],
      supportLinks: [
        { label: "FAQ & Help", href: "/#faq" },
        { label: "Tyre Warranty", href: "/about" },
        { label: "Terms & Conditions", href: "/about" },
        { label: "Privacy Policy", href: "/about" },
      ],
      social: [
        { label: "Instagram", href: "#" },
        { label: "Facebook", href: "#" },
        { label: "Twitter", href: "#" },
        { label: "YouTube", href: "#" },
      ],
    },
  };

  return NextResponse.json(homepageData, {
    headers: { "Cache-Control": "s-maxage=3600, stale-while-revalidate=600" },
  });
}
