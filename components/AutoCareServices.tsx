"use client";

import React from "react";
import Link from "next/link";

interface AutoCareServicesProps {
  locale?: string;
}

export default function AutoCareServices({ locale = "en" }: AutoCareServicesProps) {
  const isAr = locale === "ar";

  const services = [
    {
      title: isAr ? "إطارات السيارات" : "Car Tyres",
      desc: isAr
        ? "استكشف مجموعة واسعة من أفضل ماركات الإطارات مع التركيب ومحاذاة العجلات في جميع أنحاء الإمارات."
        : "Explore a wide range of top-brand tyres with expert fitting, balancing, and alignment across the UAE.",
      // href: `/${locale}/tyres/cars`,
      href: "#",
      img: "/images/home/car-tyres.png",
      alt: "car-tyres",
    },
    {
      title: isAr ? "تأمين السيارات" : "Car Insurance",
      desc: isAr
        ? "خيارات تأمين سيارات مريحة تناسب السائقين في الإمارات مع معالجة سريعة وشركاء موثوقين."
        : "Convenient car insurance options designed to suit UAE drivers, with quick processing and trusted partners.",
      // href: `/${locale}/car-insurance`,
      href: "#",
      img: "/images/home/car-insurance.png",
      alt: "car-insurance",
    },
    {
      title: isAr ? "الجنوط / العجلات" : "Rims/Wheels",
      desc: isAr
        ? "من الجنوط الرياضية إلى الترقيات، عزز مظهر وأمان سيارتك مع خبرائنا في الإمارات."
        : "From alloy wheels to rim upgrades, enhance both style and safety with our UAE-based wheel specialists.",
      // href: `/${locale}/car-wheels?product_list_dir=desc`,
      href: "#",
      img: "/images/home/car-rim.png",
      alt: "car-rim",
    },
    {
      title: isAr ? "بطاريات السيارات" : "Battery",
      desc: isAr
        ? "فحص واستبدال البطاريات باستخدام أفضل الماركات المناسبة لمناخ الإمارات."
        : "Battery testing, replacement, and fitment services using reliable battery brands suited for UAE weather conditions.",
      // href: `/${locale}/car-battery`,
      href: "#",
      img: "/images/home/car-battery.png",
      alt: "car-battery",
    },
    {
      title: isAr ? "خدمات السيارات" : "Car Service",
      desc: isAr
        ? "باقات صيانة مرنة وبأسعار مناسبة للحفاظ على سيارتك بحالة ممتازة طوال العام."
        : "Affordable and flexible service packages to keep your vehicle in excellent condition year-round.",
      // href: `/${locale}/car-service`,
      href: "#",
      img: "/images/home/car-service.png",
      alt: "car-service",
    },
    {
      title: isAr ? "إطارات الدراجات النارية" : "Motorbike Tyres",
      desc: isAr
        ? "إطارات عالية الجودة لجميع أنواع الدراجات النارية لضمان أفضل ثبات وسلامة على الطريق."
        : "High-quality tyres for all types of motorbikes, installed by experts to ensure top grip and road safety in UAE climates.",
      // href: `/${locale}/motorcycle-tyre`,
      href: "#",
      img: "/images/home/motorbike.png",
      alt: "motorbike",
    },
  ];

  return (
    <section className="section section-padding tyres-finder-box bg-[#f6f6f6] py-14 lg:py-18">
      <div className="container custom-width max-w-7xl mx-auto px-4">
        {/* Section Title */}
        <div className="section-title mb-12 text-center title-span-block max-w-3xl mx-auto">
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-wide text-gray-900 mb-4 leading-tight">
            {isAr ? "وجهتك الموثوقة " : "Your Trusted One-Stop "}
            <span className="text-[#ed1c24] theme_color">
              {isAr ? "للعناية بالسيارات" : "Shop for Auto Care"}
            </span>
          </h2>
          <p className="font-sans text-gray-700 text-sm sm:text-[15px] leading-relaxed font-medium">
            {isAr
              ? "في TyresWorld، نوفر مجموعة واسعة من إطارات السيارات والدراجات النارية في جميع أنحاء الإمارات. يستخدم فنيونا ذوو الخبرة أحدث المعدات والمنتجات عالية الجودة للمساعدة في الحفاظ على سلامة مركبتك وجاهزيتها للطريق. سواء كنت في دبي، أبوظبي، أو أي مكان في الإمارات، نحن هنا لتلبية جميع احتياجاتك."
              : "At TyresWorld, we provide a wide range of car and motorcycle tyres across the UAE. Our experienced technicians use modern equipment and quality products to help keep your vehicle safe, smooth, and road-ready. Whether you’re in Dubai, Abu Dhabi, or anywhere across the UAE, we’re here to take care of all your tyre needs."}
          </p>
        </div>

        {/* 6 Services Grid */}
        <div className="tyres-finder-inner">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-x-6 gap-y-9 lg:gap-4">
            {services.map((service) => (
              <div key={service.title} className="finder-box flex flex-col items-center text-center group">
                <div className="box-image mb-4">
                  <Link
                    href={service.href}
                    className="w-[130px] h-[130px] sm:w-[150px] sm:h-[150px] rounded-full border border-black outline outline-1 outline-[#ed1c24] outline-offset-3 p-1 inline-flex items-center justify-center overflow-hidden transition-transform duration-500 bg-white"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={service.img}
                      alt={service.alt}
                      width={150}
                      height={150}
                      className="w-full h-full object-cover object-center rounded-full transition-transform duration-500 group-hover:scale-110"
                      loading="lazy"
                    />
                  </Link>
                </div>
                <div className="text-wrap">
                  <h3 className="text-sm sm:text-base font-bold text-gray-900 m-0">
                    <Link
                      href={service.href}
                      className="group-hover:text-[#ed1c24] transition-colors capitalize"
                    >
                      {service.title}
                    </Link>
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
