export type Product = {
  id: string;
  sku?: string;          // Magento SKU — required to add the product to the server cart
  urlKey?: string;       // Magento url_key — used for the product detail page route
  name: string;
  price: number;
  originalPrice?: number;
  category: string;
  image: string;
  badge?: "New" | "Sale" | "Bestseller";
  rating: number;
  reviewCount: number;
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
    href: "/shop?categoryUid=MTg=",
  },
  {
    id: "wheels",
    name: "Alloy Wheels",
    description: "Stylish and engineered alloy wheels",
    image: "https://images.unsplash.com/photo-1616422285623-13ff0162193c?w=800&auto=format&fit=crop&q=80",
    count: 380,
    href: "/shop?categoryUid=MTExNw==",
  },
  {
    id: "batteries",
    name: "Batteries",
    description: "Long-lasting car batteries",
    image: "https://images.unsplash.com/photo-1619642751034-765dfdf7c58e?w=800&auto=format&fit=crop&q=80",
    count: 240,
    href: "/shop?categoryUid=MTExOA==",
  },
  {
    id: "motorcycle",
    name: "Motorcycle Tyres",
    description: "High performance motorcycle tyres",
    image: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=800&auto=format&fit=crop&q=80",
    count: 190,
    href: "/shop?categoryUid=MTExNg==",
  },
];

