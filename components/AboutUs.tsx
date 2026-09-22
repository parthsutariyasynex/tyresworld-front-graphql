"use client";

import { useEffect, useState } from "react";
import type { KleverHomeAbout } from "@/lib/services/homepage.service";

interface AboutUsProps {
  locale?: string;
}

interface ContentItem {
  prefix?: string;
  text: string;
}

const DEFAULT_CONTENT_EN: ContentItem[] = [
  {
    text: "TyresWorld.ae is an online tyre marketplace with a partner installation network across the UAE, we help you choose tires that match your vehicle, your driving habits, and your budget. Whether you drive on rough backroads or highways, you can find the right tyre from our online tyre shop - no matter where you are in the Emirates.",
  },
  {
    prefix: "Browse By Size, Brand, and Vehicle Type:",
    text: "Not sure which tyres fit your vehicle? Browse tyre options using search filters and explore tyre options by tyre sizes, 50+ tyres brands and vehicle types. We have premium options for all your vehicle types, whether you drive a city car, an SUV, or a heavy-duty 4x4. With precise matching, we make your tyre shopping experience straightforward and stress-free.",
  },
  {
    prefix: "Find Tyres Built For UAE’s Unique Conditions:",
    text: "An ordinary car tyre can lose grip and fail when the temperature soars. That’s why at TyresWorld we offer tyres engineered specifically for the UAE’s unique climate and roads. We offer tyres made with heat-resistant materials and rugged tread designs so you can drive safely and confidently in the unpredictable desert terrains, and your tyres last and perform better.",
  },
  {
    prefix: "Shop As Per Your Driving Needs:",
    text: "If you mostly drive on city roads, a regular all-season car tyre is your best fit. But if you often take your vehicle off-road or on challenging drives, we are here to help. Just give us a call, and our experts will help you choose and buy tires online with ease.",
  },
  {
    prefix: "Get Quality At The Best Price:",
    text: "We are committed to providing you with premium quality tyres from the best tyres brand in UAE at the most competitive prices. With our exclusive deals, you can shop top-notch tyres without compromising quality for affordability. Shop from our top tyre shop Abu Dhabi and experience the perfect balance of quality and value.",
  },
  {
    prefix: "Expert Tyre Care Guidance:",
    text: "At TyresWorld, our goal is to help you provide ongoing expert advice and support to maintain your tyres for longer life and optimal performance. Whether you need tyre care tips or seek assistance for rotation schedules and wear monitoring, we are here to help you get the most out of your investment.",
  },
];

function parseParagraph(raw: string): ContentItem {
  const cleaned = raw
    .replace(/TyresCart\.ae/gi, "TyresWorld.ae")
    .replace(/TyresCart/gi, "TyresWorld")
    .trim();

  // Check if paragraph starts with a label followed by a colon
  const colonIdx = cleaned.indexOf(":");
  if (colonIdx > 0 && colonIdx < 60) {
    return {
      prefix: cleaned.slice(0, colonIdx + 1).trim(),
      text: cleaned.slice(colonIdx + 1).trim(),
    };
  }

  return { text: cleaned };
}

export default function AboutUs({ locale = "en" }: AboutUsProps) {
  const [aboutData, setAboutData] = useState<KleverHomeAbout | null>(null);

  useEffect(() => {
    let active = true;
    fetch(`/api/homepage?locale=${locale}`)
      .then((res) => res.json())
      .then((data) => {
        if (active) setAboutData(data?.about ?? null);
      })
      .catch(() => {
        /* use defaults */
      });
    return () => {
      active = false;
    };
  }, [locale]);

  const contentItems: ContentItem[] =
    aboutData?.paragraphs && aboutData.paragraphs.length > 0
      ? aboutData.paragraphs.map(parseParagraph)
      : DEFAULT_CONTENT_EN;

  return (
    <section className="section section-padding site-details bg-[#f8f9fa] py-14 lg:py-16 border-t border-b border-gray-200/70">
      <div className="container custom-width max-w-5xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="mb-7 text-center">
          <h2 className="font-sans text-2xl sm:text-3xl lg:text-[32px] font-black uppercase tracking-tight text-gray-950 m-0 leading-tight">
            {"THE UAE’S PREMIER DESTINATION FOR "}{" "}
            <span className="text-[#ed1c24] theme_color">
              {"TYRES ONLINE"}
            </span>
          </h2>
        </div>

        {/* Text Content */}
        <div className="text-content max-w-4xl mx-auto space-y-4 text-left">
          {contentItems.map((item, i) => (
            <p
              key={i}
              className="text-[#2c2c2c] text-sm sm:text-[14.5px] leading-[1.85] font-normal m-0"
            >
              {item.prefix && (
                <strong className="font-bold text-gray-950 mr-1.5">
                  {item.prefix}
                </strong>
              )}
              {item.text}
            </p>
          ))}
        </div>
      </div>
    </section>
  );
}
