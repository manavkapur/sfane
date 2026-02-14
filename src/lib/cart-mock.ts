import { MOCK_CART, cartSubtotal, formatINR, type MockCartItem } from "@/lib/checkout-mock";

export type MockCartState = {
  items: MockCartItem[];
};

export function createInitialMockCart(): MockCartState {
  // Clone so UI can mutate qty locally.
  return {
    items: MOCK_CART.map((item) => ({ ...item })),
  };
}

export function updateQty(items: MockCartItem[], id: string, nextQty: number) {
  if (nextQty <= 0) {
    return items.filter((item) => item.id !== id);
  }
  return items.map((item) => (item.id === id ? { ...item, qty: nextQty } : item));
}

export function cartTotals(items: MockCartItem[]) {
  const subtotal = cartSubtotal(items);
  const shipping = 0;
  const total = subtotal + shipping;
  return {
    subtotal,
    shipping,
    total,
    subtotalLabel: formatINR(subtotal),
    shippingLabel: shipping === 0 ? "Free" : formatINR(shipping),
    totalLabel: formatINR(total),
  };
}
