const messages = [
  "Free shipping on orders over $75",
  "New arrivals every Thursday",
  "60-day hassle-free returns",
  "Sustainably sourced materials",
  "Join 40,000+ happy customers",
];

export default function AnnouncementBar() {
  const repeated = [...messages, ...messages];

  return (
    <div className="bg-ink text-white text-[11px] font-medium tracking-widest uppercase overflow-hidden h-9 flex items-center">
      <div className="flex animate-marquee whitespace-nowrap">
        {repeated.map((msg, i) => (
          <span key={i} className="flex items-center gap-8 px-8">
            {msg}
            <span className="w-1 h-1 rounded-full bg-accent inline-block" />
          </span>
        ))}
      </div>
    </div>
  );
}
