"use client";

import { useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { usePrefersReducedMotion } from "@/lib/usePrefersReducedMotion";

/**
 * "Testimonial" — customer quotes over a faint tyre-track pattern.
 *
 * Two cards per view on desktop (the theme sizes slides at 598px against a
 * ~1280px container), one on mobile. Order matches the theme's
 * data-swiper-slide-index sequence.
 */
const TESTIMONIALS = [
  {
    id: "ali-al-zaabi",
    name: "Ali Al Zaabi",
    quote:
      "I recently purchased tyres from TyresWorld online, and the process was seamless. Their website is user-friendly, with a great selection of top brands at unbeatable prices. The team even coordinated installation at a partner service center near me. Highly recommended for anyone in the UAE looking for quality tyres and hassle-free service!",
  },
  {
    id: "curtis",
    name: "Curtis",
    quote:
      "I visited TyresWorld's shop in Dubai for brake repairs, and I was blown away by their professionalism. The staff explained the issue clearly and completed the work efficiently. They even performed a complimentary car inspection, which was a pleasant surprise. It's my go-to place for all car repairs now!",
  },
  {
    id: "nicola-montezemolo",
    name: "Nicola Montezemolo",
    quote:
      "TyresWorld made replacing my worn-out tyres a breeze. I ordered online, and their team ensured the tyres were perfectly fitted at their Dubai service center. The service was fast, and the technicians were knowledgeable. My car feels brand new again!",
  },
  {
    id: "abdullah-h",
    name: "Abdullah H.",
    quote:
      "Finding quality tyres at affordable prices isn't easy, but TyresWorld made it possible. Their online deals are fantastic, and the customer support team was super helpful in guiding me to the right choice for my SUV. I also had my AC serviced at their Dubai shop, and it's working perfectly now. Excellent service!",
  },
  {
    id: "hamza-al-khatib",
    name: "Hamza Al-khatib",
    quote:
      "TyresWorld is more than just a tyre shop; it's a complete car care solution. I had my tyres replaced, an oil change, and a car wash all in one visit. The convenience and quality of service are unmatched. Thanks to the TyresWorld team for always delivering top-notch service!",
  },
];

/** The theme's quote mark — a chat bubble with two comma glyphs. */
function QuoteIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" aria-hidden="true" focusable="false">
      <path d="M183.1 143.1c-30.93 0-56 25.07-56 56s25.07 56 56 56c8.627 0 16.7-2.111 24-5.596V256c0 26.47-21.53 48-48 48c-8.844 0-16 7.156-16 16s7.156 15.1 15.1 15.1C204.1 335.1 240 300.1 240 256L239.1 199.1C239.1 169.1 214.9 143.1 183.1 143.1zM184 224C170.8 224 160 213.2 160 200C160 186.8 170.8 176 184 176c13.23 0 24 10.77 24 24C208 213.2 197.2 224 184 224zM256 31.1c-141.4 0-255.1 93.13-255.1 208c0 47.62 19.91 91.25 52.91 126.3c-14.87 39.5-45.87 72.88-46.37 73.25c-6.623 7-8.373 17.25-4.623 26C5.816 474.3 14.38 480 24 480c61.49 0 109.1-25.75 139.1-46.25c28.1 9 60.16 14.25 92.9 14.25c141.4 0 255.1-93.13 255.1-207.1S397.4 31.1 256 31.1zM256 416c-28.25 0-56.24-4.25-83.24-12.75c-9.516-3.068-19.92-1.461-28.07 4.338c-22.1 16.25-58.54 35.29-102.7 39.66c11.1-15.12 29.75-40.5 40.74-69.63l.1289-.3398c4.283-11.27 1.791-23.1-6.43-32.82C47.51 313.1 32.06 277.6 32.06 240c0-97 100.5-176 223.1-176c123.5 0 223.1 79 223.1 176S379.5 416 256 416zM327.1 143.1c-30.93 0-56 25.07-56 56s25.07 56 56 56c8.627 0 16.7-2.111 24-5.596V256c0 26.47-21.53 48-48 48C295.2 304 288 311.2 288 320s7.156 15.1 15.1 15.1C348.1 335.1 384 300.1 384 256l-.0001-56C383.1 169.1 358.9 143.1 327.1 143.1zM328 224c-13.23 0-24-10.77-24-24c0-13.23 10.77-24 24-24C341.2 176 352 186.8 352 200C352 213.2 341.2 224 328 224z" />
    </svg>
  );
}

export default function Testimonials() {
  const swiperRef = useRef<SwiperType | null>(null);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <section className="section section-padding testimonial">
      <div className="container">

        {/* ── Section title ───────────────────────────────────── */}
        <div className="section-heading">
          <h2>Testimonial</h2>
          <p>What Our Customer Say?</p>
        </div>

        {/* ── Slider ──────────────────────────────────────────── */}
        <div className="testimonial-slider">
          <Swiper
            onSwiper={(s) => { swiperRef.current = s; }}
            modules={[Autoplay, Pagination]}
            /* Hover pausing is off deliberately — see OffersSection. */
            autoplay={
              reducedMotion
                ? false
                : {
                    delay: 6000,
                    disableOnInteraction: false,
                    pauseOnMouseEnter: false,
                    stopOnLastSlide: false,
                    waitForTransition: true,
                  }
            }
            speed={700}
            spaceBetween={24}
            loop
            pagination={{ clickable: true, el: ".testimonial-slider-pagination" }}
            breakpoints={{
              320: { slidesPerView: 1 },
              992: { slidesPerView: 2 },
            }}
          >
            {TESTIMONIALS.map((item) => (
              <SwiperSlide key={item.id}>
                <figure className="content-wrap">
                  <div className="content-inner">
                    <div className="icon">
                      <QuoteIcon />
                    </div>

                    <blockquote>
                      <p>{item.quote}</p>
                    </blockquote>

                    <figcaption className="author">
                      <span className="avtar">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src="/images/home/author.png"
                          alt=""
                          aria-hidden="true"
                          width={50}
                          height={50}
                          loading="lazy"
                          decoding="async"
                        />
                      </span>
                      <span className="name">
                        <h3>{item.name}</h3>
                      </span>
                    </figcaption>
                  </div>
                </figure>
              </SwiperSlide>
            ))}
          </Swiper>

          {/* Pagination bullets */}
          <div className="testimonial-slider-pagination" />
        </div>

      </div>
    </section>
  );
}
