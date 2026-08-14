export const COUNTRY_NAMES: Record<number, string> = {
  3842: "Japan",
  3833: "Brazil",
  3834: "China",
  3835: "England",
  3836: "Europe",
  3850: "France",
  3837: "Germany",
  3838: "Great Britain",
  3851: "Hungary",
  3839: "India",
  3840: "Indonesia",
  3841: "Italy",
  3852: "Luxembourg",
  3843: "Malaysia",
  3853: "Mexico",
  3854: "Netherlands",
  3855: "Philippines",
  3856: "Poland",
  3857: "Portugal",
  3858: "Romania",
  3859: "Russia",
  3844: "Saudi Arabia",
  3860: "Serbia",
  3861: "Slovakia",
  3845: "Slovenia",
  3862: "South Africa",
  3846: "South Korea",
  3847: "Spain",
  3866: "Taiwan",
  3848: "Thailand",
  3849: "Turkey",
  3863: "United Kingdom",
  3864: "United States",
  3865: "Vietnam",
  3831: "Canada",
  3832: "Czech Republic"
};

export const ORIGIN_NAMES: Record<number, string> = {
  3810: "Japan",
  3804: "Germany",
  3802: "Europe",
  3829: "United States",
  3811: "South Korea",
  3826: "Thailand",
  3798: "China",
  3816: "Poland",
  3797: "Brazil",
  3800: "Canada",
  3801: "Czech Republic",
  3803: "France",
  3806: "Hungary",
  3807: "India",
  3808: "Indonesia",
  3809: "Italy",
  3812: "Luxembourg",
  3813: "Mexico",
  3814: "Netherlands",
  3815: "Philippines",
  3817: "Portugal",
  3818: "Romania",
  3820: "Serbia",
  3821: "Slovakia",
  3822: "Slovenia",
  3823: "South Africa",
  3824: "Spain",
  3827: "Turkey",
  3830: "Vietnam",
  3805: "Great Britain",
  3819: "Russia",
  3825: "Taiwan",
  3828: "United Kingdom"
};

export const WARRANTY_PERIODS: Record<number, string> = {
  571: "1 Year Warranty",
  4138: "3 Years Warranty",
  3936: "5 Years Warranty",
  1984: "18 Months Warranty",
  1985: "12 Months Warranty",
  2699: "Lifetime Warranty",
  4907: "2 Years Warranty",
  4908: "4 Years Warranty"
};

export function resolveCountry(val?: string | number | null): string | null {
  if (val == null || val === "") return null;
  const num = Number(val);
  if (isNaN(num)) return String(val); // fallback to raw string if it's already a text label
  return COUNTRY_NAMES[num] ?? String(val);
}

export function resolveOrigin(val?: string | number | null): string | null {
  if (val == null || val === "") return null;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return ORIGIN_NAMES[num] ?? String(val);
}

export function resolveWarranty(val?: string | number | null): string | null {
  if (val == null || val === "") return null;
  const num = Number(val);
  if (isNaN(num)) return String(val);
  return WARRANTY_PERIODS[num] ?? String(val);
}
