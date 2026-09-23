"use client";

import React, { useEffect, useState } from "react";

export type SizeStep = "width" | "height" | "rim" | "summary";
export type VehicleType = "car" | "motorcycle";

interface TyreSizeVisualizerProps {
  step: SizeStep;
  width?: string;
  height?: string;
  rim?: string;
  widthLabel?: string;
  heightLabel?: string;
  rimLabel?: string;
  className?: string;
  isCompact?: boolean;
  vehicleType?: VehicleType;
}

export default function TyreSizeVisualizer({
  step,
  width = "",
  height = "",
  rim = "",
  widthLabel,
  heightLabel,
  rimLabel,
  className = "",
  isCompact = false,
  vehicleType = "car",
}: TyreSizeVisualizerProps) {
  const isMoto = vehicleType === "motorcycle";
  const displayWidth = widthLabel || width || "";
  const displayHeight = heightLabel || height || "";
  const rawRim = rimLabel || rim || "";
  const displayRim = rawRim ? (rawRim.startsWith("R") ? rawRim : `R${rawRim}`) : "";

  // Smooth realistic wheel spin state
  const [spinDeg, setSpinDeg] = useState(0);

  useEffect(() => {
    // Spin the tyre wheel realistically upon every step / size change
    setSpinDeg((prev) => prev + 360);
  }, [step, width, height, rim]);

  // 3D Camera Zoom/Pan styles focused with wide margins so no text is ever cropped
  const getCameraStyle = () => {
    switch (step) {
      case "width":
        // Zoom into top tread (Wide framing so SELECT WIDTH is 100% visible without cropping)
        return {
          transform: isCompact
            ? "scale(1.38) translate(0%, 12%)"
            : "scale(1.45) translate(0%, 14%)",
          transition: "transform 750ms cubic-bezier(0.22, 1, 0.36, 1)",
        };
      case "height":
        // Zoom into right sidewall profile curve
        return {
          transform: isCompact
            ? "scale(1.4) translate(-12%, 0%)"
            : "scale(1.48) translate(-14%, 0%)",
          transition: "transform 750ms cubic-bezier(0.22, 1, 0.36, 1)",
        };
      case "rim":
        // Zoom into center alloy wheel rim
        return {
          transform: isCompact
            ? "scale(1.45) translate(0%, 0%)"
            : "scale(1.55) translate(0%, 0%)",
          transition: "transform 750ms cubic-bezier(0.22, 1, 0.36, 1)",
        };
      case "summary":
      default:
        // Full centered tyre view
        return {
          transform: isCompact
            ? "scale(1.0) translate(0%, 0%)"
            : "scale(1.02) translate(0%, 0%)",
          transition: "transform 750ms cubic-bezier(0.22, 1, 0.36, 1)",
        };
    }
  };

  return (
    <div
      className={`relative w-full overflow-hidden rounded-2xl bg-gradient-to-b from-[#16181e] via-[#0e1014] to-[#07080a] border border-white/15 shadow-2xl select-none ${
        isCompact ? "h-40 sm:h-44" : "h-[225px] sm:h-[245px]"
      } ${className}`}
    >
      {/* Background Radial Glow & Precision Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(237,28,36,0.18)_0%,transparent_70%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.1) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />

      {/* ── 3D CAMERA ZOOM/PAN CONTAINER ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
        <div
          className="relative w-56 h-56 sm:w-60 sm:h-60 will-change-transform"
          style={getCameraStyle()}
        >
          {/* ════ LAYER 1: ROTATING 3D TYRE & ALLOY WHEEL (SPINS REALISTICALLY) ════ */}
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              transform: `rotate(${spinDeg}deg)`,
              transition: "transform 900ms cubic-bezier(0.2, 0.85, 0.25, 1)",
            }}
          >
            <svg
              viewBox="0 0 300 300"
              className="w-full h-full drop-shadow-[0_25px_50px_rgba(0,0,0,0.95)]"
            >
              <defs>
                {/* Tread Radial Gradient */}
                <radialGradient id="realTyreTread" cx="50%" cy="50%" r="50%">
                  <stop offset="66%" stopColor="#181a20" />
                  <stop offset="74%" stopColor="#2c323f" />
                  <stop offset="82%" stopColor="#1e2129" />
                  <stop offset="90%" stopColor="#282d38" />
                  <stop offset="97%" stopColor="#111317" />
                  <stop offset="100%" stopColor="#08090b" />
                </radialGradient>

                {/* Sidewall Gradient */}
                <radialGradient id="realSidewall" cx="50%" cy="50%" r="50%">
                  <stop offset="50%" stopColor="#14161b" />
                  <stop offset="65%" stopColor="#242833" />
                  <stop offset="78%" stopColor="#1b1d24" />
                  <stop offset="88%" stopColor="#2c313d" />
                  <stop offset="100%" stopColor="#121418" />
                </radialGradient>

                {/* Alloy Metal Gradient */}
                <linearGradient id="alloyMetal" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#ffffff" />
                  <stop offset="18%" stopColor="#cbd5e1" />
                  <stop offset="38%" stopColor="#64748b" />
                  <stop offset="55%" stopColor="#f8fafc" />
                  <stop offset="75%" stopColor="#475569" />
                  <stop offset="90%" stopColor="#94a3b8" />
                  <stop offset="100%" stopColor="#e2e8f0" />
                </linearGradient>

                {/* Rim Barrel Depth */}
                <radialGradient id="rimBarrelDepth" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#0f172a" />
                  <stop offset="70%" stopColor="#1e293b" />
                  <stop offset="90%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#090d16" />
                </radialGradient>

                {/* ── Motorcycle-specific gradients ── */}
                {/* Moto tyre has a narrower cross-section but taller sidewall */}
                <radialGradient id="motoTyreTread" cx="50%" cy="50%" r="50%">
                  <stop offset="60%" stopColor="#161820" />
                  <stop offset="72%" stopColor="#2a2f3d" />
                  <stop offset="84%" stopColor="#1c1f28" />
                  <stop offset="94%" stopColor="#262b37" />
                  <stop offset="100%" stopColor="#08090b" />
                </radialGradient>
                <radialGradient id="motoSidewall" cx="50%" cy="50%" r="50%">
                  <stop offset="45%" stopColor="#12141a" />
                  <stop offset="60%" stopColor="#20242e" />
                  <stop offset="75%" stopColor="#181b22" />
                  <stop offset="88%" stopColor="#282d38" />
                  <stop offset="100%" stopColor="#0f1117" />
                </radialGradient>
                {/* Spoke gradient for single-sided swingarm disc look */}
                <linearGradient id="motoSpoke" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#94a3b8" />
                  <stop offset="40%" stopColor="#f1f5f9" />
                  <stop offset="100%" stopColor="#475569" />
                </linearGradient>
                {/* Brake disc gradient */}
                <radialGradient id="brakeDisc" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#1e293b" />
                  <stop offset="55%" stopColor="#334155" />
                  <stop offset="80%" stopColor="#475569" />
                  <stop offset="100%" stopColor="#0f172a" />
                </radialGradient>
              </defs>

              {isMoto ? (
                /* ══ MOTORCYCLE TYRE SVG ══
                   Narrower cross-section (r=128 outer, r=86 sidewall inner)
                   Rounded tread crown, knobbly-style tread blocks at 36 positions
                   Single-piece alloy disc + 6 lightening holes + brake disc ring
                */
                <>
                  {/* Outer tread ring — slightly narrower than car tyre */}
                  <circle
                    cx="150" cy="150" r="140"
                    fill="url(#motoTyreTread)"
                    stroke="#2c3040"
                    strokeWidth="2"
                  />

                  {/* 36 Tread grooves (herringbone-style) */}
                  {Array.from({ length: 36 }).map((_, i) => {
                    const a = (i * 360) / 36;
                    const isOdd = i % 2 === 0;
                    return (
                      <g key={i} transform={`rotate(${a} 150 150)`}>
                        {/* Central groove */}
                        <line x1="150" y1="11" x2="150" y2="28" stroke="#080a0d" strokeWidth="4" strokeLinecap="round" />
                        {/* Side sipes */}
                        <line
                          x1={isOdd ? 145 : 155} y1="17"
                          x2={isOdd ? 141 : 159} y2="24"
                          stroke="#12151b" strokeWidth="2" strokeLinecap="round"
                        />
                      </g>
                    );
                  })}

                  {/* Rounded crown shoulder ring — motorcycle tyres are more rounded */}
                  <circle cx="150" cy="150" r="128" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" />

                  {/* Sidewall rubber body — thicker profile */}
                  <circle cx="150" cy="150" r="118" fill="url(#motoSidewall)" stroke="#0c0d12" strokeWidth="3" />
                  {/* Sidewall bead rings */}
                  <circle cx="150" cy="150" r="112" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1.5" strokeDasharray="5 4" />
                  <circle cx="150" cy="150" r="98" fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth="1" />
                  <circle cx="150" cy="150" r="84" fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth="2" />

                  {/* ── Alloy disc wheel (single-piece cast look) ── */}
                  <circle cx="150" cy="150" r="80" fill="url(#rimBarrelDepth)" stroke="#0f172a" strokeWidth="2" />
                  <circle cx="150" cy="150" r="78" fill="none" stroke="url(#alloyMetal)" strokeWidth="3" />
                  <circle cx="150" cy="150" r="74" fill="none" stroke="#2d3a50" strokeWidth="1" />

                  {/* 6 cast alloy spokes (thicker, cast-look) */}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const ang = (i * 360) / 6;
                    return (
                      <g key={i} transform={`rotate(${ang} 150 150)`}>
                        {/* Wide cast spoke body */}
                        <path
                          d="M 143 150 L 140 76 L 160 76 L 157 150 Z"
                          fill="url(#motoSpoke)"
                          stroke="#1e293b"
                          strokeWidth="0.8"
                        />
                        {/* Shadow edge */}
                        <path d="M 143 150 L 140 76 L 146 76 L 149 150 Z" fill="#334155" opacity="0.5" />
                        {/* Highlight edge */}
                        <path d="M 154 150 L 157 76 L 160 76 L 157 150 Z" fill="#e2e8f0" opacity="0.35" />
                        {/* Lightening hole */}
                        <ellipse
                          cx="150" cy="112"
                          rx="5" ry="9"
                          fill="#0d1525"
                          stroke="#1e293b"
                          strokeWidth="1"
                        />
                      </g>
                    );
                  })}

                  {/* Brake disc ring (outer) */}
                  <circle cx="150" cy="150" r="66" fill="none" stroke="#475569" strokeWidth="5" />
                  <circle cx="150" cy="150" r="66" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="2" strokeDasharray="8 6" />

                  {/* Brake disc inner */}
                  <circle cx="150" cy="150" r="55" fill="url(#brakeDisc)" stroke="#0f172a" strokeWidth="1.5" />

                  {/* ── Center hub ── */}
                  <circle cx="150" cy="150" r="28" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                  <circle cx="150" cy="150" r="26" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                  {/* Hub cap with orange accent (motorcycle branding) */}
                  <circle cx="150" cy="150" r="15" fill="#111827" stroke="#f97316" strokeWidth="2.5" />
                  <circle cx="150" cy="150" r="9" fill="#f97316" opacity="0.9" />
                  <circle cx="150" cy="150" r="4.5" fill="#ffffff" />

                  {/* 6 axle bolts */}
                  {Array.from({ length: 6 }).map((_, i) => {
                    const ang = (i * 360) / 6;
                    return (
                      <g key={i} transform={`rotate(${ang} 150 150)`}>
                        <circle cx="150" cy="130" r="3.5" fill="#f8fafc" stroke="#334155" strokeWidth="1.2" />
                        <circle cx="150" cy="130" r="1.2" fill="#64748b" />
                      </g>
                    );
                  })}
                </>
              ) : (
                /* ══ CAR TYRE SVG (original) ══ */
                <>
                  {/* 1. Outer Tyre Tread Ring */}
                  <circle
                    cx="150"
                    cy="150"
                    r="144"
                    fill="url(#realTyreTread)"
                    stroke="#3b4252"
                    strokeWidth="2"
                  />

                  {/* 48 Realistic Tread Blocks (Spins with wheel) */}
                  {Array.from({ length: 48 }).map((_, i) => {
                    const angle = (i * 360) / 48;
                    return (
                      <g key={i} transform={`rotate(${angle} 150 150)`}>
                        <line
                          x1="150"
                          y1="7"
                          x2="150"
                          y2="23"
                          stroke="#090b0e"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                        />
                        <line
                          x1="147"
                          y1="14"
                          x2="153"
                          y2="17"
                          stroke="#1e222a"
                          strokeWidth="1.5"
                        />
                      </g>
                    );
                  })}

                  {/* 2. Sidewall Rubber Body */}
                  <circle cx="150" cy="150" r="122" fill="url(#realSidewall)" stroke="#0d0e12" strokeWidth="3" />
                  <circle cx="150" cy="150" r="115" fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="1.5" strokeDasharray="4 3" />
                  <circle cx="150" cy="150" r="96" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
                  <circle cx="150" cy="150" r="77" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="2" />

                  {/* 3. Alloy Wheel Rim Barrel */}
                  <circle cx="150" cy="150" r="74" fill="url(#rimBarrelDepth)" stroke="#0f172a" strokeWidth="2" />
                  <circle cx="150" cy="150" r="72" fill="none" stroke="url(#alloyMetal)" strokeWidth="3.5" />
                  <circle cx="150" cy="150" r="68" fill="none" stroke="#334155" strokeWidth="1.5" />

                  {/* 5-Spoke Alloy Architecture */}
                  {Array.from({ length: 5 }).map((_, i) => {
                    const angle = (i * 360) / 5;
                    return (
                      <g key={i} transform={`rotate(${angle} 150 150)`}>
                        <path
                          d="M 141 150 L 138 80 L 162 80 L 159 150 Z"
                          fill="url(#alloyMetal)"
                          stroke="#1e293b"
                          strokeWidth="1"
                        />
                        <path
                          d="M 141 150 L 138 80 L 145 80 L 148 150 Z"
                          fill="#475569"
                          opacity="0.6"
                        />
                        <path
                          d="M 155 150 L 158 80 L 162 80 L 159 150 Z"
                          fill="#ffffff"
                          opacity="0.4"
                        />
                      </g>
                    );
                  })}

                  {/* Center Hub & Chrome Lug Nuts */}
                  <circle cx="150" cy="150" r="30" fill="#1e293b" stroke="#0f172a" strokeWidth="2" />
                  <circle cx="150" cy="150" r="28" fill="#0f172a" stroke="#475569" strokeWidth="1" />
                  <circle cx="150" cy="150" r="16" fill="#111827" stroke="#ed1c24" strokeWidth="2" />
                  <circle cx="150" cy="150" r="10" fill="#ed1c24" opacity="0.85" />
                  <circle cx="150" cy="150" r="5" fill="#ffffff" />

                  {Array.from({ length: 5 }).map((_, i) => {
                    const angle = (i * 360) / 5;
                    return (
                      <g key={i} transform={`rotate(${angle} 150 150)`}>
                        <circle
                          cx="150"
                          cy="127"
                          r="4"
                          fill="#f8fafc"
                          stroke="#334155"
                          strokeWidth="1.5"
                        />
                        <circle cx="150" cy="127" r="1.5" fill="#64748b" />
                      </g>
                    );
                  })}
                </>
              )}
            </svg>
          </div>

          {/* ════ LAYER 2: OVERLAY TEXT & MEASUREMENT LINES (STABLE & 100% VISIBLE) ════ */}
          <div className="absolute inset-0 pointer-events-none">
            <svg viewBox="0 0 300 300" className="w-full h-full">
              <defs>
                <filter id="redGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="3.5" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="emeraldGlow" x="-30%" y="-30%" width="160%" height="160%">
                  <feGaussianBlur stdDeviation="4" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
                <filter id="textShadow" x="-30%" y="-30%" width="160%" height="160%">
                  <feDropShadow dx="0" dy="1.5" stdDeviation="2" floodColor="#000000" floodOpacity="0.95" />
                </filter>

                {/* 1. Top Sidewall Arc (for Width Step & Summary Size) */}
                <path
                  id="sidewallTopArc"
                  d="M 44 150 A 106 106 0 0 1 256 150"
                  fill="none"
                />
                {/* 2. Right Sidewall Arc (for Height / Profile Step) */}
                <path
                  id="sidewallRightArc"
                  d="M 150 38 A 112 112 0 0 1 150 262"
                  fill="none"
                />
                {/* 3. Rim Top Arc (for Rim Step) */}
                <path
                  id="rimTopArc"
                  d="M 94 150 A 56 56 0 0 1 206 150"
                  fill="none"
                />
              </defs>

              {/* ── STEP 1: WIDTH VISUALS ── */}
              {step === "width" && (
                <g>
                  {/* Laser Caliper Line at Top Tread */}
                  <g filter="url(#redGlow)" className="animate-pulse">
                    <line x1="105" y1="16" x2="195" y2="16" stroke="#ed1c24" strokeWidth="4" strokeLinecap="round" />
                    <line x1="105" y1="9" x2="105" y2="23" stroke="#ed1c24" strokeWidth="3" strokeLinecap="round" />
                    <line x1="195" y1="9" x2="195" y2="23" stroke="#ed1c24" strokeWidth="3" strokeLinecap="round" />
                  </g>

                  {/* SELECT WIDTH Text (Below the line on top sidewall) */}
                  <text
                    fill="#ffffff"
                    fontSize="14.5"
                    fontWeight="900"
                    letterSpacing="1.5"
                    filter="url(#textShadow)"
                    className="uppercase select-none"
                  >
                    <textPath href="#sidewallTopArc" startOffset="50%" textAnchor="middle">
                      <tspan fill="#ed1c24" fontWeight="900">
                        {displayWidth ? `${displayWidth} MM WIDTH` : "SELECT WIDTH"}
                      </tspan>
                    </textPath>
                  </text>
                </g>
              )}

              {/* ── STEP 2: HEIGHT / PROFILE VISUALS ── */}
              {step === "height" && (
                <g>
                  {/* Laser Caliper Line on Inner Track (Line Niche) */}
                  <g filter="url(#redGlow)" className="animate-pulse">
                    <path
                      d="M 210 95 A 84 84 0 0 1 210 205"
                      fill="none"
                      stroke="#ed1c24"
                      strokeWidth="3.5"
                      strokeLinecap="round"
                    />
                    <line x1="202" y1="95" x2="218" y2="95" stroke="#ed1c24" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="202" y1="205" x2="218" y2="205" stroke="#ed1c24" strokeWidth="2.5" strokeLinecap="round" />
                  </g>

                  {/* SELECT HEIGHT Text on Outer Track (Text Uper) */}
                  <text
                    fill="#ffffff"
                    fontSize="13"
                    fontWeight="900"
                    letterSpacing="1.2"
                    filter="url(#textShadow)"
                    className="uppercase select-none"
                  >
                    <textPath href="#sidewallRightArc" startOffset="50%" textAnchor="middle">
                      <tspan fill="#ed1c24" fontWeight="900">
                        {displayHeight ? `${displayHeight}% HEIGHT` : "SELECT HEIGHT"}
                      </tspan>
                    </textPath>
                  </text>
                </g>
              )}

              {/* ── STEP 3: RIM VISUALS ── */}
              {step === "rim" && (
                <g>
                  {/* Glowing Rim Ring (Line Niche) */}
                  <circle
                    cx="150"
                    cy="150"
                    r="72"
                    fill="none"
                    stroke="#ed1c24"
                    strokeWidth="4"
                    filter="url(#redGlow)"
                    className="animate-pulse"
                  />

                  {/* SELECT RIM Text (Text Uper) */}
                  <text
                    fill="#ffffff"
                    fontSize="12.5"
                    fontWeight="900"
                    letterSpacing="1.2"
                    filter="url(#textShadow)"
                    className="uppercase select-none"
                  >
                    <textPath href="#rimTopArc" startOffset="50%" textAnchor="middle">
                      <tspan fill="#ed1c24" fontWeight="900">
                        {displayRim ? `${displayRim} RIM` : "SELECT RIM"}
                      </tspan>
                    </textPath>
                  </text>
                </g>
              )}

              {/* ── SUMMARY: COMPLETE CURVED SPECIFICATION ── */}
              {step === "summary" && (
                <g>
                  <circle
                    cx="150"
                    cy="150"
                    r="144"
                    fill="none"
                    stroke="#10b981"
                    strokeWidth="2"
                    className="transition-all duration-500"
                  />
                  <text
                    fill="#ffffff"
                    fontSize="18"
                    fontWeight="900"
                    letterSpacing="2"
                    filter="url(#emeraldGlow)"
                    className="uppercase select-none"
                  >
                    <textPath href="#sidewallTopArc" startOffset="50%" textAnchor="middle">
                      {displayWidth ? (
                        <>
                          <tspan fill="#ffffff" fontWeight="900">
                            {displayWidth}
                          </tspan>
                          {displayHeight && <tspan fill="#34d399"> / </tspan>}
                          {displayHeight && (
                            <tspan fill="#ffffff" fontWeight="900">
                              {displayHeight}
                            </tspan>
                          )}
                          {displayRim && <tspan fill="#34d399"> </tspan>}
                          {displayRim && (
                            <tspan fill="#10b981" fontWeight="900">
                              {displayRim}
                            </tspan>
                          )}
                        </>
                      ) : (
                        <tspan fill="#ffffff">TYRES WORLD</tspan>
                      )}
                    </textPath>
                  </text>
                </g>
              )}
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
}
