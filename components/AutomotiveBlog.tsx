"use client";

import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";

interface AutomotiveBlogProps {
  locale?: string;
}

type BlogPost = {
  slug: string;
  title: string;
  titleAr: string;
  date: string;
  dateAr: string;
  excerpt: string;
  excerptAr: string;
  image: string;
};

const BLOG_POSTS: BlogPost[] = [
  {
    slug: "low-rolling-resistance-tyres",
    title: "Low Rolling Resistance Tyres Explained: Benefits, Fuel Savings, and How They Work",
    titleAr: "شرح إطارات المقاومة المنخفضة للدوران: الفوائد وتوفير الوقود وكيفية عملها",
    date: "Aug 12, 2026",
    dateAr: "12 أغسطس 2026",
    excerpt:
      "Rising fuel costs have made many drivers look for ways to improve fuel efficiency. One simple solution is switching to low rolling resistance tyres for car, which help reduce the energy needed to keep...",
    excerptAr:
      "دفعت تكاليف الوقود المتزايدة العديد من السائقين للبحث عن طرق لتحسين كفاءة استهلاك الوقود. أحد الحلول البسيطة هو التبديل إلى إطارات منخفضة المقاومة...",
    image: "/blog/low-rolling-resistance-tyre.webp",
  },
  {
    slug: "goodyear-eagle-f1-review-abu-dhabi",
    title: "Goodyear Eagle F1 Review: How It Performs on Abu Dhabi Highways",
    titleAr: "مراجعة إطارات Goodyear Eagle F1: كيف تؤدي على طرق أبوظبي السريعة",
    date: "Jun 25, 2026",
    dateAr: "25 يونيو 2026",
    excerpt:
      "Tyres face unique challenges on Abu Dhabi's highways. Long-distance high-speed roads, high temperatures during summer seasons, and daily commuting demands tyres that provide stability, comfort, grip a...",
    excerptAr:
      "تواجه الإطارات تحديات فريدة على طرق أبوظبي السريعة. تتطلب الطرق الطويلة عالية السرعة ودرجات الحرارة المرتفعة إطارات توفر الثبات والراحة...",
    image: "/blog/goodyear-eagle-f1-review-abu-dhabi_.webp",
  },
  {
    slug: "ev-wheel-alignment-battery-range-tyre-wear",
    title: "Wheel Alignment for EVs: Protecting Battery Range and Preventing Uneven Tyre Wear",
    titleAr: "محاذاة العجلات للسيارات الكهربائية: حماية مدى البطارية ومنع تآكل الإطارات",
    date: "Jun 19, 2026",
    dateAr: "19 يونيو 2026",
    excerpt:
      "Is your EV car pulling slightly to one side or are the tyres wearing out sooner than expected? While many drivers assume this is normal wear but it may be an early sign of wheel alignment issues. ...",
    excerptAr:
      "هل تنحرف سيارتك الكهربائية قليلاً إلى جانب واحد أو تتآكل الإطارات أسرع من المتوقع؟ قد يكون هذا علامة مبكرة على مشاكل محاذاة العجلات...",
    image: "/blog/ev-wheel-alignment-battery-range-tyre-wear.webp",
  },
  {
    slug: "read-tyre-size-code",
    title: "How to Read Your Tyre Size Code: A UAE Driver’s Visual Guide",
    titleAr: "كيفية قراءة رمز مقاس الإطارات: دليل مرئي لسائقي الإمارات",
    date: "Jun 11, 2026",
    dateAr: "11 يونيو 2026",
    excerpt:
      "All tyres have a sequence of letters and figures imprinted on their sidewalls. Most drivers are aware of these markings, but very few of them know what they entail. The code of tyre size is significan...",
    excerptAr:
      "تحتوي جميع الإطارات على سلسلة من الحروف والأرقام المطبوعة على الجدران الجانبية. رمز مقاس الإطار مهم جداً عند شراء إطارات جديدة...",
    image: "/blog/read-tyre-size-code.png",
  },
];

export default function AutomotiveBlog({ locale = "en" }: AutomotiveBlogProps) {
  const isAr = locale === "ar";

  return (
    <section className="section section-padding blogs py-14 lg:py-18 bg-white">
      <div className="container custom-width max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Title */}
        <div className="section-title mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-[32px] font-black uppercase tracking-wide text-black m-0">
            {isAr ? "مدونة " : "Automotive "}
            <span className="text-[#ed1c24] theme_color">
              {isAr ? "السيارات" : "Blog"}
            </span>
          </h2>
        </div>

        {/* Blog Slider */}
        <div className="blog-slider relative">
          <Swiper
            modules={[Autoplay, Pagination]}
            autoplay={{
              delay: 4500,
              disableOnInteraction: false,
              pauseOnMouseEnter: true,
            }}
            speed={600}
            spaceBetween={20}
            slidesPerView={1}
            pagination={{
              clickable: true,
              bulletClass: "swiper-pagination-bullet !w-3 !h-3 !bg-gray-300 !opacity-100 transition-all cursor-pointer",
              bulletActiveClass: "!bg-[#ed1c24] !w-6 !rounded-full",
            }}
            breakpoints={{
              540: { slidesPerView: 2, spaceBetween: 16 },
              768: { slidesPerView: 3, spaceBetween: 18 },
              1024: { slidesPerView: 4, spaceBetween: 20 },
            }}
            className="pb-10"
          >
            {BLOG_POSTS.map((post) => {
              const href = `/${locale}/blog/${post.slug}`;
              const title = isAr ? post.titleAr : post.title;
              const date = isAr ? post.dateAr : post.date;
              const excerpt = isAr ? post.excerptAr : post.excerpt;

              return (
                <SwiperSlide key={post.slug} className="h-auto">
                  <div className="box flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 group">
                    <Link
                      href={href}
                      className="image-wrap block relative w-full aspect-[16/10] overflow-hidden bg-gray-100"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={post.image}
                        alt={title}
                        width={600}
                        height={375}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        loading="lazy"
                      />
                    </Link>

                    <div className="content flex flex-col flex-1 p-5">
                      <div className="post-info mb-2">
                        <span className="text-xs font-semibold text-gray-500">
                          {date}
                        </span>
                      </div>

                      <h3 className="title text-sm sm:text-[15px] font-bold text-black leading-snug mb-2.5 line-clamp-2">
                        <Link
                          href={href}
                          className="text-black group-hover:text-[#ed1c24] transition-colors"
                        >
                          {title}
                        </Link>
                      </h3>

                      <p className="text-xs sm:text-[13px] text-gray-600 leading-relaxed line-clamp-3 m-0">
                        {excerpt}
                      </p>
                    </div>
                  </div>
                </SwiperSlide>
              );
            })}
          </Swiper>
        </div>

        {/* All Blog CTA Button */}
        <div className="blog-more text-center mt-4">
          <Link
            href={`/${locale}/blog`}
            className="button button-primary inline-flex items-center justify-center px-8 py-2.5 rounded-full bg-[#ed1c24] text-white text-xs sm:text-sm font-bold uppercase tracking-wider hover:bg-[#c6181d] transition-all shadow-md hover:scale-105 active:scale-95"
          >
            <span>{isAr ? "جميع المقالات" : "All Blog"}</span>
          </Link>
        </div>

      </div>
    </section>
  );
}
