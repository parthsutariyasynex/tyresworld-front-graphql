"use client";

import { useState } from "react";

type FaqItem = { id: string; question: string; answer: string };

const FAQ_DATA: FaqItem[] = [
  // Left Column (6 items)
  {
    id: "faq-1",
    question: "How do I know if my tyres need replacement?",
    answer: "You should replace your tyres if the tread depth is below 1.6mm (the legal limit), if you see visible cracks or bulges in the sidewall, if the tyres are over 5 years old, or if you notice unusual vibration or loss of traction while driving."
  },
  {
    id: "faq-2",
    question: "When should I check my tyre pressure?",
    answer: "It is recommended to check your tyre pressure at least once a month and before any long road trips. Always check the pressure when the tyres are \"cold\" (before driving) for the most accurate reading."
  },
  {
    id: "faq-3",
    question: "How can I choose the right tyres for my vehicle?",
    answer: "You can search by your vehicle make, model, year, and trim using our tyre finder, or check the tyre size placard inside your driver's door or your current tyre's sidewall for specifications (Width, Height, Rim Size, Load Index, and Speed Rating)."
  },
  {
    id: "faq-4",
    question: "What are the benefits of buying tyres online from TyresWorld?",
    answer: "TyresWorld offers a wide selection of genuine global brands at distributor-direct prices, free delivery to major cities, certified installation options (both mobile fitting and local service centers), and manufacturer-backed warranties."
  },
  {
    id: "faq-5",
    question: "How do I read my tyre size?",
    answer: "A tyre size looks like 245/45 R18. \"245\" is the section width in millimeters, \"45\" is the aspect ratio (sidewall height as a percentage of width), \"R\" means radial construction, and \"18\" is the rim diameter in inches."
  },
  {
    id: "faq-6",
    question: "Which tyre brands do you offer?",
    answer: "We offer a comprehensive range of premium and budget brands including Pirelli, Michelin, Continental, Bridgestone, BFGoodrich, Goodyear, Dunlop, Hankook, Nexen, Kumho, Yokohama, Falken, Toyo, and more."
  },
  // Right Column (4 items)
  {
    id: "faq-7",
    question: "How long do tyres usually last?",
    answer: "Most tyres last between 40,000 to 60,000 kilometers, or about 3 to 5 years, depending on your driving habits, road conditions, wheel alignment, and how well they are maintained (proper rotation and inflation)."
  },
  {
    id: "faq-8",
    question: "Is there a maximum age limit for tyres in Saudi Arabia?",
    answer: "Yes, in Saudi Arabia, SASO regulations state that tyres should not be sold if they are more than 2 years old from the manufacture date (DOT) for passenger vehicles, and should be replaced once they reach 5 years of age."
  },
  {
    id: "faq-9",
    question: "Where can I find the best tyre deals in Saudi Arabia?",
    answer: "You can check our \"Special Offers\" section on the homepage for active promotions, seasonal discounts, and bundle deals (like Buy 3 Get 1 Free) on leading tyre brands."
  },
  {
    id: "faq-10",
    question: "What does the tyre price include?",
    answer: "Our listed prices are transparent and typically include delivery to your selected location, tyre mounting/fitting, computer balancing, standard valve replacement, and disposal of your old tyres."
  }
];

export default function FaqSection() {
  const [openId, setOpenId] = useState<string | null>(null);

  const toggle = (id: string) => {
    setOpenId(openId === id ? null : id);
  };

  const leftCol = FAQ_DATA.slice(0, 6);
  const rightCol = FAQ_DATA.slice(6);

  return (
    <section id="faq" className="py-16 lg:py-20 bg-white border-t border-gray-100">
      <div className="container max-w-[1380px] mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-black uppercase tracking-widest text-black">
            FAQ´S
          </h2>
        </div>

        {/* 2-Column Accordion Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
          
          {/* Left Column (6 items) */}
          <div className="flex flex-col gap-4">
            {leftCol.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-gray-200 border-l-[5px] border-l-[#ed1c24] rounded-[4px] bg-white overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggle(faq.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-sans font-black text-black text-[13px] sm:text-[14px] hover:text-[#ed1c24] transition-colors outline-none"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <span className="text-xl font-light text-gray-400 shrink-0 select-none">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-[300px] opacity-100 border-t border-gray-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    <p className="px-5 py-4 text-[12px] sm:text-[13px] text-gray-600 leading-relaxed bg-gray-50/50">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column (4 items) */}
          <div className="flex flex-col gap-4">
            {rightCol.map((faq) => {
              const isOpen = openId === faq.id;
              return (
                <div
                  key={faq.id}
                  className="border border-gray-200 border-l-[5px] border-l-[#ed1c24] rounded-[4px] bg-white overflow-hidden transition-all duration-300"
                >
                  <button
                    onClick={() => toggle(faq.id)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left font-sans font-black text-black text-[13px] sm:text-[14px] hover:text-[#ed1c24] transition-colors outline-none"
                  >
                    <span className="pr-4">{faq.question}</span>
                    <span className="text-xl font-light text-gray-400 shrink-0 select-none">
                      {isOpen ? "−" : "+"}
                    </span>
                  </button>
                  <div
                    className={`transition-all duration-300 ease-in-out ${
                      isOpen ? "max-h-[300px] opacity-100 border-t border-gray-100" : "max-h-0 opacity-0 pointer-events-none"
                    }`}
                  >
                    <p className="px-5 py-4 text-[12px] sm:text-[13px] text-gray-600 leading-relaxed bg-gray-50/50">
                      {faq.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>
    </section>
  );
}
