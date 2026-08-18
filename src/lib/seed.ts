import type { Collection, PriceTier, Product, SiteSettings } from "./types";

const COLLECTION = "festive-candles";

const img = (slug: string, n = 1) => `/products/${slug}/${slug}-${n}.jpg`;

/**
 * Slabs are the same shape on every product: a single-piece rate, then the
 * four bulk steps. Dummy rates for now — Sannat is replacing them with real
 * ones, and each can be edited per product in the admin.
 */
/** List price, ~Rs 25 above the selling rate, rounded so it reads naturally. */
const listPrice = (base: number) => Math.round((base + 25) / 5) * 5;

const tiers = (base: number): PriceTier[] => [
  { minQty: 1, price: base },
  { minQty: 10, price: Math.round((base * 0.9) / 5) * 5 },
  { minQty: 25, price: Math.round((base * 0.82) / 5) * 5 },
  { minQty: 50, price: Math.round((base * 0.73) / 5) * 5 },
  { minQty: 100, price: Math.round((base * 0.65) / 5) * 5 },
];

export const seedSettings: SiteSettings = {
  businessName: "Sugandha Candles",
  tagline: "100% natural soy wax. Smokeless burn. Imported fragrance.",
  aboutBlurb:
    "Every candle here is poured by hand in 100% natural soy wax — never paraffin. Soy burns cool, clean and smokeless, so it throws scent instead of soot, and it lasts far longer for the same size. The fragrance oils are imported, skin-safe and IFRA-grade. Buy one piece or a thousand.",
  instagramHandle: "sugandha_candles_",
  email: "sugandha.workspace@gmail.com",
  addressLines: ["Sugandha Candles", "Gaur City, Greater Noida", "Uttar Pradesh 201009, India"],
  currency: "INR",
  fragrances: [
    "Rose",
    "British Rose",
    "Sandalwood",
    "Kesar Chandan",
    "White Oud",
    "Black Oud",
    "Mogra",
    "Jasmine",
    "Ginger",
    "Mulberry",
    "Phool Chameli",
    "Bela",
    "Rajnigandha",
    "Lavender",
    "Lemongrass",
    "Citronella",
    "Eucalyptus",
    "Camphor",
    "Wood",
    "Orange",
    "Mango",
    "Pineapple",
    "Strawberry",
    "Blueberry",
    "Green Apple",
    "Fruit Basket",
    "French Vanilla",
    "Cotton Candy",
    "Sweet Candy",
    "Blue Ocean",
    "One Million",
    "Oscar",
    "Poems",
  ],
  termsIntro:
    "Everything about ordering, in plain words. If something here does not suit your order, just ask — most of it has room in it.",
  termsSections: [
    {
      heading: "Payment",
      body: [
        "65% advance to confirm the order. The remaining 35% before dispatch.",
        "Payment by UPI, IMPS, NEFT or RTGS. Details are shared once you confirm.",
        "For repeat buyers with three or more completed orders, we can move to 50% advance.",
        "We do not accept cash on delivery or post-dated cheques.",
      ],
    },
    {
      heading: "Order size",
      body: [
        "There is no minimum order. A single piece is welcome, and so is a bulk order.",
        "Rates step down at 10, 25, 50 and 100 pieces. The step applies on its own — you do not have to ask.",
        "Slabs are counted per design, so buying more of one design is what brings the rate down.",
        "You may mix designs and fragrances freely within one order.",
      ],
    },
    {
      heading: "Fragrance",
      body: [
        "Every candle ships in our house fragrance for that design unless you choose otherwise.",
        "Orders of 50 pieces and above can pick any fragrance from our list, free of charge.",
        "All oils are imported, IFRA-grade and skin-safe. We do not use industrial-grade perfume.",
        "Tell us if the candles are for a temple, a hospital or a closed room and we will suggest a lighter throw.",
      ],
    },
    {
      heading: "Wax and burn",
      body: [
        "100% natural soy wax. No paraffin, no blends, no hardener.",
        "Soy burns cool and smokeless, so it does not blacken walls, jars or brass.",
        "For the cleanest burn, trim the wick to about 5 mm before every light.",
        "First burn should run until the top layer melts fully to the edge. That is what stops tunnelling.",
      ],
    },
    {
      heading: "Lead time",
      body: [
        "Ready designs: 5 to 7 working days from advance payment.",
        "Custom fragrance, colour or vessel: 12 to 18 working days.",
        "Festive season (September to November) adds roughly a week. Plan backwards from your date.",
      ],
    },
    {
      heading: "Customisation",
      body: [
        "Private label with your own printed label and box is available from 500 pieces per design.",
        "Custom colour matching needs a reference shade and 500 pieces minimum.",
        "Corporate and wedding orders can have a printed insert card added at cost.",
      ],
    },
    {
      heading: "Samples",
      body: [
        "Samples are charged at the single-piece rate plus actual courier.",
        "Sample cost is adjusted against your first bulk order of the same design.",
        "Samples ship in 3 to 4 working days.",
      ],
    },
    {
      heading: "Packing and shipping",
      body: [
        "Every piece is bubble-wrapped and packed in corrugated cartons with corner protection.",
        "Brass and glass pieces are foam-nested on top of that.",
        "Freight is at your account, or we arrange it and bill at actuals.",
        "Transit insurance is available on request and worth it on brass urli orders.",
      ],
    },
    {
      heading: "Breakage and returns",
      body: [
        "Report transit breakage within 48 hours of delivery with photographs of the outer carton and the damaged pieces.",
        "Verified breakage is replaced free in your next dispatch.",
        "We do not accept returns for change of mind, or on custom and private-label production.",
      ],
    },
    {
      heading: "Colour and finish",
      body: [
        "These are hand-poured, hand-finished products. Slight variation in colour and surface between batches is normal and is not a defect.",
        "Natural soy may develop a light frosted pattern on the surface over time. It does not affect burn or scent.",
      ],
    },
  ],
};

export const seedCollections: Collection[] = [
  {
    id: "c1",
    slug: COLLECTION,
    name: "Festive Candles",
    tagline: "Diwali, weddings, gifting",
    description:
      "Brass urlis, lotus ponds, diya sets and gift boxes — the pieces that sell through the festive season and carry a brand well. All poured in 100% natural soy wax with imported fragrance.",
    coverImage: img("peacock-urli-candle"),
    sortOrder: 1,
  },
];

type Draft = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  keywords: string[];
  fragrance: string;
  burn: number;
  h: number;
  d: number;
  g: number;
  price: number;
  packaging: string;
  featured?: boolean;
};

const drafts: Draft[] = [
  {
    slug: "peacock-urli-candle",
    name: "Peacock Urli Candle",
    tagline: "Our best seller, and it shows",
    description:
      "An ornate gold peacock urli with a deep teal centre pool, a hand-sculpted lotus floating in it, and small diya wells around the rim each holding a rose. It photographs beautifully on a Diwali table, which is exactly why it moves the way it does.",
    keywords: ["peacock", "urli", "brass", "gold", "lotus", "diya", "diwali", "rangoli", "gifting", "pooja"],
    fragrance: "Jasmine, White Oud, French Vanilla",
    burn: 22,
    h: 5.08,
    d: 19.05,
    g: 620,
    price: 699,
    packaging: "Foam-nested in a printed carton",
    featured: true,
  },
  {
    slug: "lotus-pond-urli-candle",
    name: "Lotus Pond Urli Candle",
    tagline: "A whole pond, in wax",
    description:
      "A scalloped brass urli filled with a still blue water pool, with hand-shaped lotus blooms and lily pads resting on the surface. The water effect is solid wax throughout, so nothing spills and nothing needs topping up.",
    keywords: ["lotus", "pond", "urli", "water", "blue", "brass", "diwali", "centrepiece", "gifting", "pooja"],
    fragrance: "White Oud, Black Oud",
    burn: 24,
    h: 3.81,
    d: 11.43,
    g: 700,
    price: 399,
    packaging: "Foam-nested in a printed carton",
    featured: true,
  },
  {
    slug: "mithai-box-candle",
    name: "Mithai Box Candle",
    tagline: "Looks like a sweet box. Isn't.",
    description:
      "Motichoor-style laddoos and barfi finished with edible-looking silver leaf, set in a clear-lid gift box. Buyers hand these over as mithai and watch the face change when they realise. Our strongest corporate and return-gift piece.",
    keywords: ["mithai", "laddoo", "barfi", "sweet", "dessert", "gift box", "corporate", "return gift", "diwali", "novelty"],
    fragrance: "Kesar Chandan, Pineapple",
    burn: 10,
    h: 0.0,
    d: 0.0,
    g: 380,
    price: 229,
    packaging: "6-piece cavity gift box",
    featured: true,
  },
  {
    slug: "lotus-pond-boat-candle",
    name: "Lotus Pond Boat Candle",
    tagline: "Long oval, lotuses and little boats",
    description:
      "A long oval stone-finish tray holding a blue water pool with pink lotus blooms and two tiny wooden-look boats. It suits a long dining table or a console where a round urli would look lost.",
    keywords: ["lotus", "boat", "pond", "oval", "water", "blue", "table", "centrepiece", "wedding", "diwali"],
    fragrance: "Lavender, Jasmine",
    burn: 20,
    h: 6.35,
    d: 15.24,
    g: 560,
    price: 449,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "designer-lotus-candle",
    name: "Designer Lotus Candle",
    tagline: "Free-standing, sold as a pair",
    description:
      "Hand-sculpted lotus blooms in graded pink with green leaf bases, sold as a matched pair. They float, or sit on a plate as they are. The most flexible piece we make for decorators.",
    keywords: ["lotus", "floating", "pair", "pink", "decor", "wedding", "event", "float", "pooja", "urli filler"],
    fragrance: "Mogra",
    burn: 6,
    h: 6.35,
    d: 8.89,
    g: 130,
    price: 129,
    packaging: "Pair per box, 12 pairs per carton",
  },
  {
    slug: "lotus-boat-tealight-box",
    name: "Lotus Boat Tealight Box",
    tagline: "Six pond cups in one box",
    description:
      "Six individual cups, each a miniature blue pond with a lotus or a boat on the surface, in a clear-lid gift box. The easiest way to give the pond look at a gifting price point.",
    keywords: ["lotus", "boat", "tealight", "gift box", "six", "set", "blue", "pond", "return gift", "diwali"],
    fragrance: "Kesar Chandan, Pineapple",
    burn: 5,
    h: 0.0,
    d: 0.0,
    g: 320,
    price: 229,
    packaging: "6-piece cavity gift box",
  },
  {
    slug: "lotus-diya-candle",
    name: "Lotus Diya Candle",
    tagline: "Flat brass lotus, red centre",
    description:
      "A flat cast-brass lotus with a deep red wax centre. Low, stable and unfussy — the piece people buy in quantity for pooja rooms and temple orders.",
    keywords: ["lotus", "diya", "brass", "red", "pooja", "temple", "flat", "bulk", "diwali", "traditional"],
    fragrance: "Kesar Chandan",
    burn: 8,
    h: 2.54,
    d: 6.35,
    g: 240,
    price: 99,
    packaging: "Sleeved, 20 per carton",
  },
  {
    slug: "festive-lotus-urli-bowl-candle",
    name: "Festive Lotus Urli Bowl Candle",
    tagline: "Cut-brass petals, dahlia centre",
    description:
      "A laser-cut brass lotus bowl holding a cream pool with a layered dahlia bloom in coral and white at the centre. The cut petals throw a pattern on the table when it is lit.",
    keywords: ["lotus", "urli", "brass", "dahlia", "cut work", "bowl", "festive", "diwali", "decor", "gifting"],
    fragrance: "Rose, Kesar Chandan",
    burn: 18,
    h: 8.89,
    d: 15.24,
    g: 480,
    price: 699,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "hibiscus-urli-candle",
    name: "Hibiscus Urli Candle",
    tagline: "Three red blooms on white",
    description:
      "Three hand-sculpted red hibiscus flowers with green leaves set into a wide white pool, on a scalloped gold-rim platter. Reads as fresh flowers from across a room.",
    keywords: ["hibiscus", "urli", "red", "flower", "white", "platter", "gudhal", "pooja", "festive", "decor"],
    fragrance: "White Oud, Black Oud",
    burn: 20,
    h: 3.81,
    d: 11.43,
    g: 520,
    price: 399,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "hibiscus-urli-sparkle-candle",
    name: "Hibiscus Urli Sparkle Candle",
    tagline: "Single bloom, gold fleck finish",
    description:
      "A smaller flower-cut dish in white with one red hibiscus and a scatter of gold flecks through the wax. The compact version of our hibiscus urli, at a gifting price.",
    keywords: ["hibiscus", "sparkle", "gold", "flecks", "red", "small", "urli", "gifting", "festive", "flower"],
    fragrance: "Sandalwood",
    burn: 12,
    h: 3.81,
    d: 8.89,
    g: 280,
    price: 249,
    packaging: "Sleeved, 16 per carton",
  },
  {
    slug: "sunflower-urli-sparkle-candle",
    name: "Sunflower Urli Sparkle Candle",
    tagline: "One big sunflower, gold flecks",
    description:
      "A full sunflower head in graded yellow with a dark seeded centre, set in a white flower-cut dish with gold flecks. The brightest thing we make, and it sells hard in summer.",
    keywords: ["sunflower", "yellow", "sparkle", "gold", "urli", "flower", "bright", "gifting", "decor", "festive"],
    fragrance: "Sandalwood",
    burn: 12,
    h: 3.81,
    d: 8.89,
    g: 280,
    price: 249,
    packaging: "Sleeved, 16 per carton",
  },
  {
    slug: "red-lotus-small-urli-candle",
    name: "Red Lotus Small Urli Candle",
    tagline: "Deep red blooms, cream pool",
    description:
      "A scalloped gold-rim bowl with a cream pool and three deep red blooms with green leaves. Smaller than the big urlis and easier to place in quantity across a venue.",
    keywords: ["red", "lotus", "urli", "small", "bowl", "cream", "wedding", "event", "festive", "decor"],
    fragrance: "Rose",
    burn: 16,
    h: 3.81,
    d: 6.35,
    g: 380,
    price: 149,
    packaging: "Sleeved, 12 per carton",
  },
  {
    slug: "mogra-urli-candle",
    name: "Mogra Urli Candle",
    tagline: "A ring of jasmine buds",
    description:
      "A brass flower bowl with a warm yellow pool, a pink bloom at the centre and a full ring of white mogra buds on green stems around it. Scented to match what it looks like.",
    keywords: ["mogra", "jasmine", "urli", "buds", "yellow", "brass", "gajra", "pooja", "wedding", "traditional"],
    fragrance: "Mogra",
    burn: 18,
    h: 2.54,
    d: 8.89,
    g: 460,
    price: 149,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "mogra-urli-bowl-candle",
    name: "Mogra Urli Bowl Candle",
    tagline: "Octagon brass, deeper pool",
    description:
      "The same mogra bud ring in a heavier octagonal brass bowl with a cream pool and pink blooms. Deeper wax than the flat urli, so it runs noticeably longer.",
    keywords: ["mogra", "jasmine", "octagon", "brass", "bowl", "buds", "cream", "wedding", "pooja", "long burn"],
    fragrance: "Mogra",
    burn: 26,
    h: 6.35,
    d: 11.43,
    g: 640,
    price: 449,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "marigold-diya-festive-urli-candle",
    name: "Marigold Diya Festive Urli Candle",
    tagline: "Seven diyas, genda phool",
    description:
      "A marble-look platter set with seven brass diyas, each holding a marigold bloom in orange or yellow, with a sunflower at the centre. This is the Diwali table in one piece.",
    keywords: ["marigold", "genda", "diya", "set", "seven", "orange", "yellow", "diwali", "platter", "festive"],
    fragrance: "Orange, Kesar Chandan",
    burn: 8,
    h: 5.08,
    d: 15.24,
    g: 720,
    price: 599,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "elephant-urli-candle",
    name: "Elephant Urli Candle",
    tagline: "Brass elephant, lotus bowl",
    description:
      "A cast brass elephant carrying a lotus-cut bowl on its back, filled with a green and coral bloom. A gifting piece that stays on the shelf long after the wax is gone.",
    keywords: ["elephant", "brass", "urli", "lotus", "stand", "hathi", "gifting", "housewarming", "decor", "wedding"],
    fragrance: "Ginger, Mulberry, Sandalwood",
    burn: 14,
    h: 7.62,
    d: 8.89,
    g: 520,
    price: 229,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "turtle-urli-candle",
    name: "Turtle Urli Candle",
    tagline: "Kachua stand, plain pool",
    description:
      "A detailed brass turtle carrying a scalloped bowl with a clean cream pool and no flower work. Bought for vastu as much as for looks, and the plain wax lets the brass do the talking.",
    keywords: ["turtle", "kachua", "brass", "urli", "vastu", "stand", "plain", "gifting", "housewarming", "decor"],
    fragrance: "Ginger, Mulberry, Sandalwood",
    burn: 14,
    h: 7.62,
    d: 8.89,
    g: 460,
    price: 229,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "ruffle-shell-stand-candle",
    name: "Ruffle Shell Stand Candle",
    tagline: "Two wicks, sculptural brass",
    description:
      "A ruffled brass shell on a slim footed stand, poured with a twin-wick cream pool. The two wicks give an even melt across the wide opening instead of a hole down the middle.",
    keywords: ["shell", "ruffle", "brass", "stand", "twin wick", "modern", "sculptural", "decor", "gifting", "table"],
    fragrance: "Ginger, Mulberry, Sandalwood",
    burn: 16,
    h: 7.62,
    d: 8.89,
    g: 440,
    price: 229,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "floral-ring-urli-tealight-holder",
    name: "Floral Ring Urli Tealight Holder",
    tagline: "Ornate ring, gold-fleck pour",
    description:
      "An ornate cast floral ring around a plain pour finished with gold flecks. The ring is a separate brass piece, so it can be reused with tealights afterwards.",
    keywords: ["floral", "ring", "brass", "tealight", "holder", "gold", "flecks", "ornate", "reusable", "gifting"],
    fragrance: "Rajnigandha",
    burn: 10,
    h: 3.81,
    d: 8.89,
    g: 300,
    price: 199,
    packaging: "Sleeved, 12 per carton",
  },
  {
    slug: "brass-tin-candle",
    name: "Brass Tin Candle",
    tagline: "Lidded, travels well",
    description:
      "A brushed brass tin with a fitted lid and a plain soy pour. Unbreakable, stackable and the one piece on this list that survives a courier without foam.",
    keywords: ["brass", "tin", "lid", "travel", "plain", "minimal", "corporate", "hamper", "unbreakable", "gifting"],
    fragrance: "White Oud",
    burn: 20,
    h: 11.43,
    d: 8.89,
    g: 200,
    price: 699,
    packaging: "Boxed, 24 per carton",
  },
  {
    slug: "laxmi-charan-candle",
    name: "Laxmi Charan Candle",
    tagline: "Charan on a brass petal plate",
    description:
      "Laxmi ji's footprints in red on a cream pour, set in a fluted brass petal plate. Lit at the entrance on Dhanteras and Diwali, and one of the few designs people buy in even numbers for gifting.",
    keywords: ["laxmi", "charan", "footprints", "diwali", "dhanteras", "pooja", "brass", "red", "traditional", "auspicious"],
    fragrance: "Kesar Chandan",
    burn: 10,
    h: 5.84,
    d: 7.62,
    g: 260,
    price: 149,
    packaging: "Sleeved, 16 per carton",
  },
  {
    slug: "baby-feet-square-urli-candle",
    name: "Baby Feet Square Urli Candle",
    tagline: "Square scalloped dish, gold flecks",
    description:
      "The same charan motif in a square scalloped dish with a green leaf base and gold flecks through the wax. Squares group well, so this is the one for a row down a rangoli.",
    keywords: ["charan", "feet", "square", "urli", "gold", "flecks", "rangoli", "pooja", "diwali", "decor"],
    fragrance: "Kesar Chandan",
    burn: 12,
    h: 6.35,
    d: 6.35,
    g: 300,
    price: 189,
    packaging: "Sleeved, 16 per carton",
  },
  {
    slug: "poker-glass-jar-candle",
    name: "Poker Glass Jar Candle",
    tagline: "Card suits in clear glass",
    description:
      "Heart, club, spade and diamond in red and black, set into a cream pour in a clear glass tumbler. Our whole card-night line started with this one.",
    keywords: ["poker", "cards", "casino", "glass", "jar", "game night", "novelty", "gifting", "teen patti", "diwali party"],
    fragrance: "Black Oud",
    burn: 24,
    h: 6.35,
    d: 7.62,
    g: 220,
    price: 229,
    packaging: "Boxed, 20 per carton",
  },
  {
    slug: "poker-urli-candle",
    name: "Poker Urli Candle",
    tagline: "Brass leaf dish, four suits",
    description:
      "A marquise-shaped brass dish with the four card suits set down a cream pour. The premium piece in the card-night line, and the one that gets gifted rather than kept.",
    keywords: ["poker", "cards", "casino", "brass", "urli", "marquise", "teen patti", "diwali party", "gifting", "game night"],
    fragrance: "Black Oud",
    burn: 16,
    h: 6.35,
    d: 11.43,
    g: 400,
    price: 449,
    packaging: "Foam-nested in a printed carton",
  },
  {
    slug: "poker-tealight-box",
    name: "Poker Tealight Box",
    tagline: "Four tealights, four suits",
    description:
      "Four cream tealights, one per card suit, in a clear-lid box. The party-favour version of the line — cheap enough to hand out around a table.",
    keywords: ["poker", "cards", "tealight", "box", "four", "set", "party favour", "teen patti", "diwali party", "gifting"],
    fragrance: "Black Oud",
    burn: 5,
    h: 0.0,
    d: 0.0,
    g: 220,
    price: 129,
    packaging: "Clear-lid gift box of 4",
  },
  {
    slug: "mandala-duo-gift-box",
    name: "Mandala Duo Gift Box",
    tagline: "Printed mandala tops, boxed",
    description:
      "Round candles with hand-finished mandala tops in red, blue and yellow, in a printed floral gift box. The box is the product as much as the wax — it goes straight into a hamper.",
    keywords: ["mandala", "gift box", "set", "printed", "colourful", "hamper", "corporate", "return gift", "boho", "decor"],
    fragrance: "Lavender",
    burn: 14,
    h: 6.35,
    d: 6.35,
    g: 400,
    price: 299,
    packaging: "Printed gift box, sleeved",
  },
  {
    slug: "rasmalai-cup-candle",
    name: "Rasmalai Cup Candle",
    tagline: "Saffron and pista, in glass",
    description:
      "Rasmalai in a small glass cup, right down to the saffron strands and the pistachio scatter on top. Sold loose or as a tray of nine for dessert-counter displays.",
    keywords: ["rasmalai", "dessert", "mithai", "sweet", "glass", "cup", "novelty", "return gift", "kesar", "food"],
    fragrance: "Kesar Chandan",
    burn: 8,
    h: 6.35,
    d: 6.35,
    g: 110,
    price: 129,
    packaging: "Tray of 9, 36 per carton",
  },
];

export const seedProducts: Product[] = drafts.map((d, i) => ({
  id: `p${i + 1}`,
  slug: d.slug,
  name: d.name,
  collectionSlug: COLLECTION,
  tagline: d.tagline,
  description: d.description,
  images: [img(d.slug)],
  sizeChartImage: null,
  keywords: d.keywords,
  fragrance: d.fragrance,
  waxType: "100% natural soy wax",
  wickType: "Cotton, lead-free",
  burnTimeHours: d.burn,
  heightCm: d.h,
  diameterCm: d.d,
  weightGrams: d.g,
  basePrice: d.price,
  mrp: listPrice(d.price),
  priceTiers: tiers(d.price),
  packaging: d.packaging,
  inStock: true,
  featured: Boolean(d.featured),
  sortOrder: i + 1,
}));
