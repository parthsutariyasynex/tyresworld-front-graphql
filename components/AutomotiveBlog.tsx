"use client";

import Link from "next/link";

type BlogPost = {
  id: string;
  image: string;
  date: string;
  title: string;
  description: string;
  href: string;
};

const BLOG_POSTS: BlogPost[] = [
  {
    id: "post-1",
    image: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?w=600&auto=format&fit=crop&q=80",
    date: "February 27, 2026",
    title: "PROFESSIONAL TIRE INSTALLATION ERRORS THA...",
    description: "Many drivers often blame poor tire quality when they notice premature wear, but the real culprit could be...",
    href: "/"
  },
  {
    id: "post-2",
    image: "https://images.unsplash.com/photo-1616788494707-ec28f08d05a1?w=600&auto=format&fit=crop&q=80",
    date: "February 27, 2026",
    title: "BEST TIRES FOR DAILY CITY DRIVING IN RIYADH &...",
    description: "Navigating the streets of Riyadh and Jeddah can be tough with the heavy traffic, constant stops, and the...",
    href: "/"
  },
  {
    id: "post-3",
    image: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=600&auto=format&fit=crop&q=80",
    date: "February 23, 2026",
    title: "HOW INCORRECT TIRE SIZE IMPACTS FUEL EFFICIENCY...",
    description: "Many drivers in Saudi Arabia end up with tires that don't match their vehicle's required size, often witho...",
    href: "/"
  },
  {
    id: "post-4",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=600&auto=format&fit=crop&q=80",
    date: "February 23, 2026",
    title: "WHICH TIRE BRANDS HANDLE SAUDI HIGHWAYS BEST FO...",
    description: "When it comes to daily commuting on the highways of Saudi Arabia, selecting the right tires can make al...",
    href: "/"
  }
];

export default function AutomotiveBlog() {
  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="container max-w-[1380px] mx-auto px-4">
        
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl lg:text-[34px] font-black uppercase tracking-tight text-black mb-3">
            AUTOMOTIVE <span className="text-[#ed1c24]">BLOG</span>
          </h2>
          <p className="text-xs sm:text-sm font-semibold text-black tracking-wide">
            New Offer and News
          </p>
        </div>

        {/* Blog Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {BLOG_POSTS.map((post) => (
            <div
              key={post.id}
              className="group flex flex-col bg-gray-50/50 rounded-2xl border border-gray-200/60 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-md"
            >
              {/* Blog Image */}
              <Link href={post.href} className="relative aspect-[16/10] w-full block overflow-hidden bg-gray-150">
                <img
                  src={post.image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </Link>

              {/* Blog Content */}
              <div className="flex-1 p-5 flex flex-col text-left">
                <span className="text-gray-400 text-[10px] sm:text-[11px] font-bold uppercase tracking-wider mb-2">
                  {post.date}
                </span>
                
                <h3 className="text-black font-black text-[13px] sm:text-[14px] leading-snug mb-3 line-clamp-2 uppercase group-hover:text-[#ed1c24] transition-colors">
                  <Link href={post.href}>{post.title}</Link>
                </h3>
                
                <p className="text-gray-500 text-[11px] sm:text-[12px] leading-relaxed line-clamp-3">
                  {post.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* All Blog Button */}
        <div className="flex justify-center mt-12">
          <Link
            href="/blog"
            className="inline-flex items-center justify-center bg-black hover:bg-neutral-900 text-white font-bold text-xs uppercase tracking-wider rounded-full px-8 py-3.5 shadow-lg shadow-black/25 hover:scale-[1.02] active:scale-[0.98] transition-all duration-200 cursor-pointer border border-neutral-800"
          >
            All Blog
          </Link>
        </div>

      </div>
    </section>
  );
}
