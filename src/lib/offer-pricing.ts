export type OfferType = "NONE" | "PERCENT" | "FIXED" | "BUY_X_GET_Y" | "QTY_TIER_30_40";

export type OfferInput = {
  unitPrice: number;
  quantity: number;
  offerType?: string | null;
  discountValue?: number | null;
  buyQty?: number | null;
  getQty?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
};

export type OfferPricing = {
  baseTotal: number;
  discountTotal: number;
  finalTotal: number;
  freeQty: number;
  offerLabel: string | null;
  offerApplied: boolean;
};

function parseDate(value: string | null | undefined) {
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function isOfferWindowActive(start: string | null | undefined, end: string | null | undefined) {
  const now = new Date();
  const startDate = parseDate(start);
  const endDate = parseDate(end);

  if (startDate && now < startDate) return false;
  if (endDate && now > endDate) return false;
  return true;
}

export function calculateOfferPricing(input: OfferInput): OfferPricing {
  const unitPrice = Math.max(0, input.unitPrice || 0);
  const quantity = Math.max(0, Math.floor(input.quantity || 0));
  const baseTotal = unitPrice * quantity;

  if (quantity === 0) {
    return {
      baseTotal,
      discountTotal: 0,
      finalTotal: 0,
      freeQty: 0,
      offerLabel: null,
      offerApplied: false,
    };
  }

  const rawType = input.offerType || "NONE";
  const offerType: OfferType =
    rawType === "PERCENT" ||
    rawType === "FIXED" ||
    rawType === "BUY_X_GET_Y" ||
    rawType === "QTY_TIER_30_40"
      ? rawType
      : "NONE";

  if (offerType === "NONE" || !isOfferWindowActive(input.discountStart, input.discountEnd)) {
    return {
      baseTotal,
      discountTotal: 0,
      finalTotal: baseTotal,
      freeQty: 0,
      offerLabel: null,
      offerApplied: false,
    };
  }

  if (offerType === "PERCENT") {
    const percent = Math.min(100, Math.max(0, input.discountValue || 0));
    const discountTotal = (baseTotal * percent) / 100;
    return {
      baseTotal,
      discountTotal,
      finalTotal: Math.max(0, baseTotal - discountTotal),
      freeQty: 0,
      offerLabel: `${percent}% off`,
      offerApplied: discountTotal > 0,
    };
  }

  if (offerType === "FIXED") {
    const fixedPerUnit = Math.min(unitPrice, Math.max(0, input.discountValue || 0));
    const discountTotal = fixedPerUnit * quantity;
    return {
      baseTotal,
      discountTotal,
      finalTotal: Math.max(0, baseTotal - discountTotal),
      freeQty: 0,
      offerLabel: `₹${fixedPerUnit.toFixed(0)} off`,
      offerApplied: discountTotal > 0,
    };
  }

  if (offerType === "QTY_TIER_30_40") {
    const percent = quantity > 3 ? 40 : quantity > 2 ? 30 : 0;
    const discountTotal = (baseTotal * percent) / 100;
    return {
      baseTotal,
      discountTotal,
      finalTotal: Math.max(0, baseTotal - discountTotal),
      freeQty: 0,
      offerLabel: "30% off (qty > 2) · 40% off (qty > 3)",
      offerApplied: discountTotal > 0,
    };
  }

  const buyQty = Math.max(0, Math.floor(input.buyQty || 0));
  const getQty = Math.max(0, Math.floor(input.getQty || 0));
  if (buyQty <= 0 || getQty <= 0) {
    return {
      baseTotal,
      discountTotal: 0,
      finalTotal: baseTotal,
      freeQty: 0,
      offerLabel: null,
      offerApplied: false,
    };
  }

  const cycle = buyQty + getQty;
  const freeQty = Math.floor(quantity / cycle) * getQty;
  const discountTotal = freeQty * unitPrice;

  return {
    baseTotal,
    discountTotal,
    finalTotal: Math.max(0, baseTotal - discountTotal),
    freeQty,
    offerLabel: `Buy ${buyQty} Get ${getQty}`,
    offerApplied: discountTotal > 0,
  };
}
