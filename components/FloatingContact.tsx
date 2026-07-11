"use client";

import { Phone } from "lucide-react";

const WhatsAppIcon = () => (
  <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.513 2.262 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.5-5.729-1.452L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.864.002-2.637-1.023-5.115-2.89-6.984C16.279 1.89 13.802 1.865 11.2 1.865c-5.437 0-9.863 4.421-9.868 9.868-.001 1.714.452 3.39 1.31 4.877L1.625 21.82l5.022-1.317zm11.393-5.263c-.3-.149-1.772-.875-2.046-.975-.274-.1-.474-.149-.674.15-.2.299-.774.974-.949 1.173-.175.2-.35.224-.65.075-.3-.15-1.263-.465-2.403-1.485-.888-.793-1.488-1.77-1.663-2.07-.175-.3-.019-.461.13-.61.135-.133.3-.349.45-.523.15-.174.2-.299.3-.499.1-.2.05-.375-.025-.524-.075-.15-.675-1.625-.925-2.225-.244-.589-.491-.51-.674-.519-.174-.009-.374-.01-.574-.01-.2 0-.525.075-.8.374-.275.299-1.05 1.024-1.05 2.5 0 1.475 1.075 2.9 1.225 3.1.15.2 2.11 3.22 5.116 4.52.716.31 1.274.496 1.71.636.72.228 1.376.196 1.894.118.578-.087 1.772-.724 2.022-1.424.25-.699.25-1.299.175-1.424-.075-.125-.275-.199-.575-.349z" />
  </svg>
);

export default function FloatingContact() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* WhatsApp Floating Button */}
      <a
        href="https://wa.me/966920017534"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 hover:bg-[#20ba5a] active:scale-95 transition-all duration-200 cursor-pointer"
        aria-label="Contact us on WhatsApp"
      >
        <WhatsAppIcon />
      </a>

      {/* Phone Call Floating Button */}
      <a
        href="tel:920017534"
        className="w-14 h-14 bg-[#0a0a0a] text-white rounded-full flex items-center justify-center shadow-lg shadow-black/20 hover:scale-105 hover:bg-black active:scale-95 transition-all duration-200 cursor-pointer border border-neutral-800"
        aria-label="Call Customer Support"
      >
        <Phone className="w-6 h-6 stroke-[2]" />
      </a>
    </div>
  );
}
