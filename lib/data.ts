export type Product = {
  id: string;
  sku?: string;
  urlKey?: string;
  urlPath?: string;
  typeId?: string;
  name: string;
  displayName?: string;
  itemCode?: string;

  // Pricing
  price: number;
  originalPrice?: number;
  maxPrice?: number;
  currency?: string;

  // Images
  image: string;
  smallImage?: string;
  thumbnail?: string;

  // Descriptions
  descriptionHtml?: string;
  shortDescriptionHtml?: string;

  // Tyre-specific attributes
  brand?: string;
  brandName?: string;    // display name from backend
  brandLogoUrl?: string; // logo image URL from backend
  brandPageUrl?: string; // brand landing page URL from backend
  manufacturer?: string;
  size?: string;
  tyreSize?: string;
  pattern?: string;
  width?: string;
  height?: string;
  rim?: string;
  year?: string;
  origin?: string;
  country?: string;
  warrantyPeriod?: string;

  // Categorisation
  category: string;
  categories?: { id?: number | null; name: string; urlKey?: string }[];

  // Offers — raw Magento option ID; resolve to label via useOfferLabels()
  offersId?: string;

  // Meta
  badge?: "New" | "Sale" | "Bestseller";
  rating: number;
  reviewCount: number;
  inStock?: boolean;
  quantity?: number;

  // DriverReviews (Klever) per-product widget data
  driverReviews?: DriverReviewsData;
};

/** Per-product DriverReviews data (from `driver_reviews` on ProductInterface). */
export type DriverReviewsData = {
  isTyre: boolean;
  manufacturer: string;
  model: string;
  tyreSize: string;
  vehicleType: string;
};

export type Category = {
  id: string;
  name: string;
  description: string;
  image: string;
  count: number;
  href: string;
};

export type HeroSlide = {
  id: string;
  eyebrow: string;
  heading: string;
  sub: string;
  cta: { label: string; href: string };
  secondary: { label: string; href: string };
  image: string;
  badge: string;
};

export type Testimonial = {
  id: string;
  name: string;
  role: string;
  location: string;
  avatar: string;
  rating: number;
  text: string;
};

export type TeamMember = {
  id: string;
  name: string;
  role: string;
  bio: string;
  image: string;
};

export const categories: Category[] = [
  {
    id: "tyres",
    name: "Tyres",
    description: "Premium car, SUV and performance tyres",
    image: "https://images.unsplash.com/photo-1578844251758-2f71da64c96f?w=800&auto=format&fit=crop&q=80",
    count: 1420,
    href: "/",
  },
  {
    id: "wheels",
    name: "Alloy Wheels",
    description: "Stylish and engineered alloy wheels",
    image: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&auto=format&fit=crop&q=80",
    count: 380,
    href: "/",
  },
  {
    id: "batteries",
    name: "Batteries",
    description: "Long-lasting car batteries",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80",
    count: 240,
    href: "/",
  },
  {
    id: "motorcycle",
    name: "Motorcycle Tyres",
    description: "High performance motorcycle tyres",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
    count: 190,
    href: "/",
  },
];

