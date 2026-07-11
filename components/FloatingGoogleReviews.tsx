"use client";

export default function FloatingGoogleReviews() {
  return (
    <div className="fixed bottom-3.5 left-3.5 z-[999] select-none cursor-pointer">
      <div className="bg-white text-black px-4 py-2.5 rounded-lg flex flex-col shadow-[0_6px_12px_rgba(0,0,0,0.1)] border border-gray-200/50 w-fit">
        {/* Top Part: G Logo + Text */}
        <div className="flex items-center gap-2">
          <img
            src="https://upload.wikimedia.org/wikipedia/commons/c/c1/Google_%22G%22_logo.svg"
            alt="Google Logo"
            className="w-4.5 h-4.5 shrink-0"
          />
          <span className="text-black font-semibold text-[13px] tracking-tight">Google Reviews</span>
        </div>
        
        {/* Bottom Part: Rating + Stars */}
        <div className="flex items-center gap-1.5 mt-1.5">
          <span className="text-black font-black text-lg leading-none tracking-tight">4.9</span>
          <div className="flex text-amber-400 gap-0.5">
            {[...Array(5)].map((_, i) => (
              <svg key={i} className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
