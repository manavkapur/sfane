export const SAMPLE_PRODUCT = {
  id: "sfane-polyester-grey-duffle",
  slug: "sfane-polyester-grey-duffle",
  name: "Sfane Polyester Grey Duffle / Shoulder / Gym Bag",
  shortTitle: "Sfane Duffle",
  subtitle: "Unisex travel + gym bag with separate shoe compartment",
  brand: "Sfane",
  rating: 4.4,
  reviewCount: 12452,
  soldLastMonth: "700+ bought in past month",
  price: 414,
  originalPrice: 1199,
  discountPercent: 65,
  available: "In stock",
  cardImage: "/sfanelogo.jpg",
  gallery: [
    "/productdetail1.jpg",
    "/productdetail2.jpg",
    "/productdetail3.jpg",
    "/productdetail4.jpg",
    "/productdetail5.jpg",
    "/productdetail6.jpg",
    "/productdetail7.jpg",
  ],
  bullets: [
    "Crossbody bag",
    "Sports bag",
    "Overnight bag",
    "Travel-ready for gym, day hikes, school and weekend trips",
    "Separate shoe pocket keeps other items clean",
  ],
  features: [
    "Adjustable shoulder strap",
    "Accessories pocket",
    "Easy-grip double zippers",
    "Independent shoe compartment",
  ],
  description:
    "The perfect duffle bag for adults and teenagers. Lightweight, durable and versatile with both hand straps and shoulder strap. Built for daily use and short travel.",
};

export function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}
