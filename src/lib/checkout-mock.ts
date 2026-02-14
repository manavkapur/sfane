export type MockCartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  imageUrl?: string;
};

export const MOCK_CART: MockCartItem[] = [
  {
    id: "sku_duffle_001",
    name: "Signature Duffle",
    price: 1299,
    qty: 1,
    imageUrl: "/DuffleBag.jpg",
  },
  {
    id: "sku_sling_001",
    name: "City Sling",
    price: 899,
    qty: 2,
    imageUrl: "/SlingBag.jpg",
  },
];

export function cartSubtotal(items: MockCartItem[]) {
  return items.reduce((sum, item) => sum + item.price * item.qty, 0);
}

export function formatINR(amount: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
