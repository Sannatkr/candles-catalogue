export type PriceTier = {
  minQty: number;
  price: number;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  collectionSlug: string;
  tagline: string;
  description: string;
  images: string[];
  sizeChartImage: string | null;

  fragrance: string;
  waxType: string;
  wickType: string;
  burnTimeHours: number;

  heightCm: number;
  diameterCm: number;
  weightGrams: number;

  basePrice: number;
  priceTiers: PriceTier[];
  moq: number;
  packaging: string;

  inStock: boolean;
  featured: boolean;
  sortOrder: number;
};

export type Collection = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  coverImage: string;
  sortOrder: number;
};

export type TermsSection = {
  heading: string;
  body: string[];
};

export type SiteSettings = {
  businessName: string;
  tagline: string;
  aboutBlurb: string;
  whatsappNumber: string;
  email: string;
  phone: string;
  addressLines: string[];
  currency: string;
  termsIntro: string;
  termsSections: TermsSection[];
};
