"use client";

import { Fragment, useState } from "react";

/* ─── Icons — all stroke/fill use currentColor ────────────────────
   Parent sets text-white (default) or text-[#ed1c24] (hover),
   which flows into SVG via currentColor.
──────────────────────────────────────────────────────────────────── */
function TyreIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <circle cx="24" cy="24" r="19" />
      <circle cx="24" cy="24" r="9" />
      <circle cx="24" cy="24" r="3.5" fill="currentColor" stroke="none" />
      <line x1="24" y1="5"    x2="24" y2="15" />
      <line x1="24" y1="33"   x2="24" y2="43" />
      <line x1="5"  y1="24"   x2="15" y2="24" />
      <line x1="33" y1="24"   x2="43" y2="24" />
      <line x1="10.8" y1="10.8" x2="17.4" y2="17.4" />
      <line x1="30.6" y1="30.6" x2="37.2" y2="37.2" />
      <line x1="37.2" y1="10.8" x2="30.6" y2="17.4" />
      <line x1="17.4" y1="30.6" x2="10.8" y2="37.2" />
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="5" y="9" width="38" height="34" rx="3" />
      <line x1="5"  y1="19" x2="43" y2="19" />
      <line x1="15" y1="9"  x2="15" y2="19" />
      <line x1="33" y1="9"  x2="33" y2="19" />
      <rect x="10" y="25" width="6" height="5" rx="1" fill="currentColor" stroke="none" />
      <rect x="21" y="25" width="6" height="5" rx="1" fill="currentColor" stroke="none" />
      <rect x="32" y="25" width="6" height="5" rx="1" fill="currentColor" stroke="none" />
      <rect x="10" y="33" width="6" height="5" rx="1" fill="currentColor" stroke="none" />
      <rect x="21" y="33" width="6" height="5" rx="1" fill="currentColor" stroke="none" />
      <rect x="32" y="33" width="6" height="5" rx="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function PayIcon() {
  return (
    <svg width="42" height="44" viewBox="0 0 48 48" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden>
      <rect x="11" y="3" width="26" height="42" rx="4" />
      <line x1="11" y1="12" x2="37" y2="12" />
      <line x1="11" y1="37" x2="37" y2="37" />
      <circle cx="24" cy="42" r="1.5" fill="currentColor" stroke="none" />
      {/* Payment screen */}
      <rect x="15" y="18" width="18" height="12" rx="2" fill="none" />
      <line x1="15" y1="23"   x2="33" y2="23" />
      <line x1="17" y1="27"   x2="22" y2="27" strokeWidth="1.5" />
      <line x1="24" y1="27"   x2="28" y2="27" strokeWidth="1.5" />
    </svg>
  );
}

function InstallIcon() {
  return (
    <svg width="44" height="44" viewBox="0 0 48 48" fill="none"
      stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M10 17 Q9 8 18 8" />
      <path d="M38 17 Q39 8 30 8" />
      <line x1="18" y1="8" x2="30" y2="8" />
      <path d="M7 32 L7 25 L12 19 L36 19 L41 25 L41 32 Z" />
      <line x1="7" y1="27" x2="41" y2="27" />
      <circle cx="15" cy="35" r="5" />
      <circle cx="33" cy="35" r="5" />
      <circle cx="15" cy="35" r="2" fill="currentColor" stroke="none" />
      <circle cx="33" cy="35" r="2" fill="currentColor" stroke="none" />
    </svg>
  );
}

/* ─── Arrow components ───────────────────────────────────────────── */
function ArrowRight({ active }: { active: boolean }) {
  return (
    <svg width="40" height="18" viewBox="0 0 40 18" fill="none" aria-hidden>
      <path
        d="M2 9 H34 M26 2 L38 9 L26 16"
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          stroke: active ? "#ff2020" : "#c01018",
          transition: "stroke 0.3s ease-in-out",
        }}
      />
    </svg>
  );
}

function ArrowDown() {
  return (
    <svg width="18" height="40" viewBox="0 0 18 40" fill="none" aria-hidden>
      <path d="M9 2 V34 M2 26 L9 38 L16 26"
        stroke="#ed1c24" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Step data ──────────────────────────────────────────────────── */
const STEPS = [
  { id: "1", icon: <TyreIcon />,     title: "CHOOSE YOUR TYRES",    desc: "From top brands online"   },
  { id: "2", icon: <CalendarIcon />, title: "PICK INSTALLER & TIME", desc: "Anywhere across the KSA"  },
  { id: "3", icon: <PayIcon />,      title: "PAY SECURELY ONLINE",   desc: "Fast and safe checkout"   },
  { id: "4", icon: <InstallIcon />,  title: "GET TYRES INSTALLED",   desc: "At your chosen location"  },
];

/* ═══════════════════════════════════════════════════════════════════
   HOW IT WORKS
   Hover effects:
     • Card lifts  -8px  (translateY)
     • Outer ring  scales 1.08
     • Icon        rotates 8deg + flips white→red
     • Circle bg   flips red→white
     • Title       turns red
     • Desc        brightens
     • Arrow       slides +6px right and brightens
   All 300ms ease-in-out
═══════════════════════════════════════════════════════════════════ */
export default function HowItWorks() {
  const [hoveredStep, setHoveredStep] = useState<string | null>(null);

  return (
    <section className="py-16 lg:py-20 bg-black">
      <div className="container">

        {/* Title */}
        <div className="text-center mb-12 lg:mb-16">
          <h2 className="text-2xl lg:text-3xl font-black uppercase tracking-widest text-white">
            HOW IT <span className="text-[#ed1c24]">WORKS</span>
          </h2>
          <p className="text-white/55 mt-2 text-sm">Quick, easy, and convenient.</p>
        </div>

        {/* ── Desktop (sm+) ─────────────────────────────────────────── */}
        <div className="hidden sm:flex items-start justify-center">
          {STEPS.map((step, i) => {
            const isActive = hoveredStep === step.id;

            return (
              <Fragment key={step.id}>

                {/* ── Step card ── */}
                <div
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="flex flex-col items-center text-center w-44 lg:w-52 flex-shrink-0 cursor-default"
                  style={{
                    transform: isActive ? "translateY(-8px)" : "translateY(0px)",
                    transition: "transform 0.3s ease-in-out",
                  }}
                >
                  <div
                    className="w-[84px] h-[84px] rounded-full flex items-center justify-center mb-5"
                    style={{
                      backgroundColor: isActive ? "#ffffff" : "#ed1c24",
                      transform: isActive ? "scale(1.08) rotate(8deg)" : "scale(1) rotate(0deg)",
                      boxShadow: isActive ? "0 12px 30px rgba(237, 28, 36, 0.25)" : "none",
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    <div style={{
                      color: isActive ? "#ed1c24" : "#ffffff",
                      transition: "color 0.3s ease-in-out",
                    }}>
                      {step.icon}
                    </div>
                  </div>

                  <h3 className="text-[12px] lg:text-[13px] font-black uppercase tracking-wide leading-snug text-white">
                    {step.title}
                  </h3>
                  <p className="text-[11px] lg:text-[12px] mt-1.5 leading-snug text-white/55">
                    {step.desc}
                  </p>
                </div>

                {/* ── Arrow between step i and i+1 ──
                    Moves +6px right and brightens when step i is hovered */}
                {i < STEPS.length - 1 && (
                  <div
                    className="flex-shrink-0 mt-[33px] mx-2 lg:mx-4"
                    style={{
                      transform: isActive ? "translateX(6px)" : "translateX(0px)",
                      transition: "transform 0.3s ease-in-out",
                    }}
                  >
                    <ArrowRight active={isActive} />
                  </div>
                )}

              </Fragment>
            );
          })}
        </div>

        {/* ── Mobile: vertical stack ────────────────────────────────── */}
        <div className="sm:hidden flex flex-col items-center gap-5">
          {STEPS.map((step, i) => {
            const isActive = hoveredStep === step.id;
            return (
              <Fragment key={step.id}>
                <div
                  onMouseEnter={() => setHoveredStep(step.id)}
                  onMouseLeave={() => setHoveredStep(null)}
                  className="flex flex-col items-center text-center max-w-[240px] cursor-default"
                  style={{
                    transform: isActive ? "translateY(-8px)" : "translateY(0px)",
                    transition: "transform 0.3s ease-in-out",
                  }}
                >
                  <div
                    className="w-[72px] h-[72px] rounded-full flex items-center justify-center mb-4"
                    style={{
                      backgroundColor: isActive ? "#ffffff" : "#ed1c24",
                      transform: isActive ? "scale(1.08) rotate(8deg)" : "scale(1) rotate(0deg)",
                      boxShadow: isActive ? "0 12px 30px rgba(237, 28, 36, 0.25)" : "none",
                      transition: "all 0.3s ease-in-out",
                    }}
                  >
                    <div style={{
                      color: isActive ? "#ed1c24" : "#ffffff",
                      transition: "color 0.3s ease-in-out",
                    }}>
                      {step.icon}
                    </div>
                  </div>

                  <h3 className="text-[13px] font-black uppercase tracking-wide leading-snug text-white">
                    {step.title}
                  </h3>
                  <p className="text-[12px] mt-1 text-white/55">
                    {step.desc}
                  </p>
                </div>
                {i < STEPS.length - 1 && <ArrowDown />}
              </Fragment>
            );
          })}
        </div>

      </div>
    </section>
  );
}
