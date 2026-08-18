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

  /** Free-text words a buyer might search: shapes, occasions, materials. */
  keywords: string[];

  fragrance: string;
  waxType: string;
  wickType: string;
  burnTimeHours: number;

  heightCm: number;
  diameterCm: number;
  weightGrams: number;

  basePrice: number;
  /** List price shown struck through. 0 hides it. */
  mrp: number;
  priceTiers: PriceTier[];
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
  /** Instagram username without the @. Powers every enquiry button. */
  instagramHandle: string;
  email: string;
  addressLines: string[];
  currency: string;
  /** Offered on the booking form once an order gets large enough to customise. */
  fragrances: string[];
  termsIntro: string;
  termsSections: TermsSection[];
};

export type Booking = {
  id: string;
  createdAt: string;
  productSlug: string;
  productName: string;
  productImage: string | null;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  fragrance: string | null;
  pincode: string | null;
  state: string | null;
  buyerName: string;
  buyerContact: string;
  phone: string | null;
  note: string | null;
  status: "new" | "contacted" | "confirmed" | "closed";
};
