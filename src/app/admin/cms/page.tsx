"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type OrderStatus = "CREATED" | "PAID" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";
type OfferType = "PERCENT" | "FIXED" | "BUY_X_GET_Y";
type CouponType = "PERCENT" | "FIXED";

type AdminOrder = {
  id: number;
  customerName: string;
  phone: string;
  itemCount: number;
  total: number;
  paymentStatus: "paid" | "pending";
  status: OrderStatus;
  createdAt: string;
};

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  price: number;
  category: string;
  stock: number;
  active: boolean;
  imageUrl: string;
  offerId: number | null;
};

type AdminOffer = {
  id: number;
  title: string;
  type: OfferType;
  value: number;
  startAt: string;
  endAt: string;
  active: boolean;
  productIds: number[];
};

type AdminCoupon = {
  id: number;
  code: string;
  type: CouponType;
  value: number;
  minOrder: number;
  usageLimit: number;
  usedCount: number;
  startAt: string;
  endAt: string;
  active: boolean;
};

const initialOrders: AdminOrder[] = [
  {
    id: 31021,
    customerName: "Manav Kapur",
    phone: "+91 98765 43210",
    itemCount: 2,
    total: 25900,
    paymentStatus: "paid",
    status: "PACKED",
    createdAt: "2026-02-13T12:30:00Z",
  },
  {
    id: 31020,
    customerName: "Mohinder Krishan",
    phone: "+91 98111 11193",
    itemCount: 1,
    total: 15800,
    paymentStatus: "paid",
    status: "SHIPPED",
    createdAt: "2026-02-13T10:10:00Z",
  },
  {
    id: 31019,
    customerName: "Ananya Sharma",
    phone: "+91 98989 12212",
    itemCount: 3,
    total: 31200,
    paymentStatus: "pending",
    status: "CREATED",
    createdAt: "2026-02-12T18:42:00Z",
  },
];

const initialProducts: AdminProduct[] = [
  {
    id: 1001,
    name: "Sfane Polyester Grey Duffle / Shoulder / Gym Bag",
    slug: "sfane-polyester-grey-duffle",
    price: 414,
    category: "Gym Bags",
    stock: 250,
    active: true,
    imageUrl: "/sfanelogo.jpg",
    offerId: 1,
  },
  {
    id: 1002,
    name: "City Sling",
    slug: "city-sling",
    price: 899,
    category: "Sling Bags",
    stock: 120,
    active: true,
    imageUrl: "/SlingBag.jpg",
    offerId: null,
  },
];

const initialOffers: AdminOffer[] = [
  {
    id: 1,
    title: "Weekend Launch Offer",
    type: "PERCENT",
    value: 65,
    startAt: "2026-02-13T00:00",
    endAt: "2026-02-16T23:59",
    active: true,
    productIds: [1001],
  },
];

const initialCoupons: AdminCoupon[] = [
  {
    id: 1,
    code: "SFAFIRST10",
    type: "PERCENT",
    value: 10,
    minOrder: 999,
    usageLimit: 300,
    usedCount: 54,
    startAt: "2026-02-10T00:00",
    endAt: "2026-03-01T23:59",
    active: true,
  },
];

function formatINR(value: number) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(value);
}

export default function AdminCmsPage() {
  const router = useRouter();
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);

  const [orders, setOrders] = useState<AdminOrder[]>(initialOrders);
  const [products, setProducts] = useState<AdminProduct[]>(initialProducts);
  const [offers, setOffers] = useState<AdminOffer[]>(initialOffers);
  const [coupons, setCoupons] = useState<AdminCoupon[]>(initialCoupons);

  const [sessionReady, setSessionReady] = useState(!supabase);
  const [message, setMessage] = useState<string | null>(null);

  const [orderFilter, setOrderFilter] = useState<"ALL" | OrderStatus>("ALL");
  const [orderSearch, setOrderSearch] = useState("");

  const [newProduct, setNewProduct] = useState({
    name: "",
    slug: "",
    price: "",
    category: "",
    stock: "",
    imageUrl: "/sfanelogo.jpg",
  });

  const [newOffer, setNewOffer] = useState({
    title: "",
    type: "PERCENT" as OfferType,
    value: "",
    startAt: "",
    endAt: "",
    productIds: [] as number[],
  });

  const [newCoupon, setNewCoupon] = useState({
    code: "",
    type: "PERCENT" as CouponType,
    value: "",
    minOrder: "",
    usageLimit: "",
    startAt: "",
    endAt: "",
  });

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
        return;
      }
      const { error } = await supabase.functions.invoke("admin-products", { method: "GET" });
      if (error) {
        await supabase.auth.signOut();
        router.replace("/admin/login");
        return;
      }
      setSessionReady(true);
    });
  }, [supabase, router]);

  const visibleOrders = orders.filter((order) => {
    const statusMatch = orderFilter === "ALL" || order.status === orderFilter;
    const query = orderSearch.trim().toLowerCase();
    const searchMatch =
      !query ||
      order.customerName.toLowerCase().includes(query) ||
      String(order.id).includes(query) ||
      order.phone.toLowerCase().includes(query);
    return statusMatch && searchMatch;
  });

  const revenue = orders.filter((o) => o.paymentStatus === "paid").reduce((sum, o) => sum + o.total, 0);

  const updateOrderStatus = (orderId: number, status: OrderStatus) => {
    setOrders((prev) => prev.map((order) => (order.id === orderId ? { ...order, status } : order)));
    setMessage(`Order #${orderId} marked as ${status}.`);
  };

  const createProduct = () => {
    const price = Number(newProduct.price);
    const stock = Number(newProduct.stock);
    if (!newProduct.name || !newProduct.slug || !Number.isFinite(price) || !Number.isFinite(stock)) {
      setMessage("Product name, slug, price, and stock are required.");
      return;
    }

    const nextId = Math.max(...products.map((p) => p.id), 1000) + 1;
    const product: AdminProduct = {
      id: nextId,
      name: newProduct.name,
      slug: newProduct.slug,
      price,
      category: newProduct.category || "Uncategorized",
      stock,
      active: true,
      imageUrl: newProduct.imageUrl || "/sfanelogo.jpg",
      offerId: null,
    };

    setProducts((prev) => [product, ...prev]);
    setNewProduct({ name: "", slug: "", price: "", category: "", stock: "", imageUrl: "/sfanelogo.jpg" });
    setMessage(`Product ${product.name} created.`);
  };

  const removeProduct = (productId: number) => {
    setProducts((prev) => prev.filter((product) => product.id !== productId));
    setOffers((prev) => prev.map((offer) => ({ ...offer, productIds: offer.productIds.filter((id) => id !== productId) })));
    setMessage(`Product #${productId} removed.`);
  };

  const toggleProductActive = (productId: number) => {
    setProducts((prev) =>
      prev.map((product) => (product.id === productId ? { ...product, active: !product.active } : product))
    );
  };

  const assignOfferToProduct = (productId: number, offerId: number | null) => {
    setProducts((prev) => prev.map((product) => (product.id === productId ? { ...product, offerId } : product)));
  };

  const createOffer = () => {
    const value = Number(newOffer.value);
    if (!newOffer.title || !Number.isFinite(value) || !newOffer.startAt || !newOffer.endAt) {
      setMessage("Offer title, value, start and end date are required.");
      return;
    }

    const nextId = Math.max(...offers.map((o) => o.id), 0) + 1;
    const offer: AdminOffer = {
      id: nextId,
      title: newOffer.title,
      type: newOffer.type,
      value,
      startAt: newOffer.startAt,
      endAt: newOffer.endAt,
      active: true,
      productIds: newOffer.productIds,
    };

    setOffers((prev) => [offer, ...prev]);
    setNewOffer({ title: "", type: "PERCENT", value: "", startAt: "", endAt: "", productIds: [] });
    setMessage(`Offer ${offer.title} created.`);
  };

  const toggleOfferActive = (offerId: number) => {
    setOffers((prev) => prev.map((offer) => (offer.id === offerId ? { ...offer, active: !offer.active } : offer)));
  };

  const removeOffer = (offerId: number) => {
    setOffers((prev) => prev.filter((offer) => offer.id !== offerId));
    setProducts((prev) => prev.map((product) => (product.offerId === offerId ? { ...product, offerId: null } : product)));
  };

  const createCoupon = () => {
    const value = Number(newCoupon.value);
    const minOrder = Number(newCoupon.minOrder);
    const usageLimit = Number(newCoupon.usageLimit);
    if (!newCoupon.code || !Number.isFinite(value) || !Number.isFinite(minOrder) || !Number.isFinite(usageLimit)) {
      setMessage("Coupon code, value, min order, and usage limit are required.");
      return;
    }

    const nextId = Math.max(...coupons.map((c) => c.id), 0) + 1;
    const coupon: AdminCoupon = {
      id: nextId,
      code: newCoupon.code.toUpperCase(),
      type: newCoupon.type,
      value,
      minOrder,
      usageLimit,
      usedCount: 0,
      startAt: newCoupon.startAt,
      endAt: newCoupon.endAt,
      active: true,
    };

    setCoupons((prev) => [coupon, ...prev]);
    setNewCoupon({ code: "", type: "PERCENT", value: "", minOrder: "", usageLimit: "", startAt: "", endAt: "" });
    setMessage(`Coupon ${coupon.code} created.`);
  };

  const toggleCouponActive = (couponId: number) => {
    setCoupons((prev) => prev.map((coupon) => (coupon.id === couponId ? { ...coupon, active: !coupon.active } : coupon)));
  };

  const removeCoupon = (couponId: number) => {
    setCoupons((prev) => prev.filter((coupon) => coupon.id !== couponId));
  };

  const signOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    router.replace("/admin/login");
  };

  if (!sessionReady) {
    return (
      <main className="mx-auto max-w-6xl px-6 py-12">
        <p className="text-sm text-[#5b4739]">Checking admin session...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white px-6 pb-16 pt-10 text-[#111111] [&_input]:text-[#111111] [&_input]:placeholder:text-[#7a7a7a] [&_select]:text-[#111111]">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-[#e2e2e2] bg-white px-6 py-5">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#555555]">Admin CMS</p>
            <h1 className="mt-2 text-3xl font-semibold text-[#1f140d]">Operations Dashboard</h1>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Link href="/products" className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm font-semibold text-[#333333]">
              Storefront
            </Link>
            <button
              onClick={signOut}
              className="rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              Sign out
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-4">
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Orders</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{orders.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Revenue</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{formatINR(revenue)}</p>
          </article>
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Products</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{products.length}</p>
          </article>
          <article className="rounded-2xl border border-[#e2e2e2] bg-white p-4">
            <p className="text-xs uppercase tracking-wide text-[#555555]">Coupons Live</p>
            <p className="mt-2 text-2xl font-semibold text-[#1f140d]">{coupons.filter((c) => c.active).length}</p>
          </article>
        </section>

        <section className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-xl font-semibold text-[#1f140d]">Orders</h2>
            <div className="flex flex-wrap gap-2">
              <input
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                placeholder="Search by customer, phone, order id"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <select
                value={orderFilter}
                onChange={(e) => setOrderFilter(e.target.value as "ALL" | OrderStatus)}
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              >
                <option value="ALL">All statuses</option>
                <option value="CREATED">Created</option>
                <option value="PAID">Paid</option>
                <option value="PACKED">Packed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
          </div>

          <div className="mt-4 space-y-3">
            {visibleOrders.map((order) => (
              <article key={order.id} className="rounded-2xl border border-[#e7e7e7] bg-white p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold text-[#1f140d]">Order #{order.id}</p>
                    <p className="text-sm text-[#333333]">
                      {order.customerName} · {order.phone} · {order.itemCount} items
                    </p>
                    <p className="text-xs text-[#555555]">{new Date(order.createdAt).toLocaleString("en-IN")}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-[#f6efe8] px-3 py-1 text-sm font-semibold text-[#333333]">
                      {formatINR(order.total)}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        order.paymentStatus === "paid" ? "bg-[#e8f6ea] text-[#1f7a34]" : "bg-[#fff3e2] text-[#996100]"
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order.id, e.target.value as OrderStatus)}
                      className="rounded-full border border-[#d0d0d0] px-3 py-1 text-sm"
                    >
                      <option value="CREATED">Created</option>
                      <option value="PAID">Paid</option>
                      <option value="PACKED">Packed</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-2">
          <article className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
            <h2 className="text-xl font-semibold text-[#1f140d]">Products</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={newProduct.name}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Product name"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.slug}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, slug: e.target.value }))}
                placeholder="slug"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.price}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, price: e.target.value }))}
                placeholder="Price"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.stock}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, stock: e.target.value }))}
                placeholder="Stock"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.category}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, category: e.target.value }))}
                placeholder="Category"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                value={newProduct.imageUrl}
                onChange={(e) => setNewProduct((prev) => ({ ...prev, imageUrl: e.target.value }))}
                placeholder="Image URL"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
            </div>
            <button
              onClick={createProduct}
              className="mt-4 rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              Add product
            </button>

            <div className="mt-5 space-y-3">
              {products.map((product) => (
                <div key={product.id} className="rounded-2xl border border-[#e7e7e7] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#1f140d]">{product.name}</p>
                      <p className="text-sm text-[#333333]">
                        {formatINR(product.price)} · Stock {product.stock} · {product.category}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => toggleProductActive(product.id)}
                        className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-semibold text-[#333333]"
                      >
                        {product.active ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => removeProduct(product.id)}
                        className="rounded-full border border-[#efc5c5] px-3 py-1 text-xs font-semibold text-[#9f2626]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                  <div className="mt-3">
                    <select
                      value={product.offerId ?? ""}
                      onChange={(e) => assignOfferToProduct(product.id, e.target.value ? Number(e.target.value) : null)}
                      className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs"
                    >
                      <option value="">No offer</option>
                      {offers.map((offer) => (
                        <option key={offer.id} value={offer.id}>
                          {offer.title}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              ))}
            </div>
          </article>

          <article className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
            <h2 className="text-xl font-semibold text-[#1f140d]">Offers</h2>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <input
                value={newOffer.title}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, title: e.target.value }))}
                placeholder="Offer title"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <select
                value={newOffer.type}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, type: e.target.value as OfferType }))}
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              >
                <option value="PERCENT">Percent</option>
                <option value="FIXED">Fixed</option>
                <option value="BUY_X_GET_Y">Buy X Get Y</option>
              </select>
              <input
                value={newOffer.value}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, value: e.target.value }))}
                placeholder="Value"
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={newOffer.startAt}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, startAt: e.target.value }))}
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
              <input
                type="datetime-local"
                value={newOffer.endAt}
                onChange={(e) => setNewOffer((prev) => ({ ...prev, endAt: e.target.value }))}
                className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
              />
            </div>

            <div className="mt-4 rounded-2xl border border-[#e7e7e7] p-3">
              <p className="text-sm font-semibold text-[#1f140d]">Apply to products</p>
              <div className="mt-2 grid gap-2 md:grid-cols-2">
                {products.map((product) => (
                  <label key={product.id} className="flex items-center gap-2 text-sm text-[#333333]">
                    <input
                      type="checkbox"
                      checked={newOffer.productIds.includes(product.id)}
                      onChange={(e) => {
                        setNewOffer((prev) => ({
                          ...prev,
                          productIds: e.target.checked
                            ? [...prev.productIds, product.id]
                            : prev.productIds.filter((id) => id !== product.id),
                        }));
                      }}
                    />
                    {product.name}
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={createOffer}
              className="mt-4 rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
            >
              Add offer
            </button>

            <div className="mt-5 space-y-3">
              {offers.map((offer) => (
                <div key={offer.id} className="rounded-2xl border border-[#e7e7e7] p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-[#1f140d]">{offer.title}</p>
                      <p className="text-sm text-[#333333]">
                        {offer.type} · {offer.value} · {new Date(offer.startAt).toLocaleString("en-IN")} to{" "}
                        {new Date(offer.endAt).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleOfferActive(offer.id)}
                        className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-semibold text-[#333333]"
                      >
                        {offer.active ? "Pause" : "Activate"}
                      </button>
                      <button
                        onClick={() => removeOffer(offer.id)}
                        className="rounded-full border border-[#efc5c5] px-3 py-1 text-xs font-semibold text-[#9f2626]"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-[#e2e2e2] bg-white p-6">
          <h2 className="text-xl font-semibold text-[#1f140d]">Coupons</h2>
          <div className="mt-4 grid gap-3 md:grid-cols-3">
            <input
              value={newCoupon.code}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
              placeholder="Coupon code"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <select
              value={newCoupon.type}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, type: e.target.value as CouponType }))}
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            >
              <option value="PERCENT">Percent</option>
              <option value="FIXED">Fixed amount</option>
            </select>
            <input
              value={newCoupon.value}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, value: e.target.value }))}
              placeholder="Discount value"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <input
              value={newCoupon.minOrder}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, minOrder: e.target.value }))}
              placeholder="Minimum order"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <input
              value={newCoupon.usageLimit}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, usageLimit: e.target.value }))}
              placeholder="Usage limit"
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={newCoupon.startAt}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, startAt: e.target.value }))}
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
            <input
              type="datetime-local"
              value={newCoupon.endAt}
              onChange={(e) => setNewCoupon((prev) => ({ ...prev, endAt: e.target.value }))}
              className="rounded-full border border-[#d0d0d0] px-4 py-2 text-sm"
            />
          </div>

          <button
            onClick={createCoupon}
            className="mt-4 rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
          >
            Add coupon
          </button>

          <div className="mt-5 space-y-3">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="rounded-2xl border border-[#e7e7e7] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold text-[#1f140d]">{coupon.code}</p>
                    <p className="text-sm text-[#333333]">
                      {coupon.type} {coupon.value} · Min {formatINR(coupon.minOrder)} · Used {coupon.usedCount}/{coupon.usageLimit}
                    </p>
                    <p className="text-xs text-[#555555]">
                      {coupon.startAt ? new Date(coupon.startAt).toLocaleString("en-IN") : "No start"} to{" "}
                      {coupon.endAt ? new Date(coupon.endAt).toLocaleString("en-IN") : "No end"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleCouponActive(coupon.id)}
                      className="rounded-full border border-[#d0d0d0] px-3 py-1 text-xs font-semibold text-[#333333]"
                    >
                      {coupon.active ? "Pause" : "Activate"}
                    </button>
                    <button
                      onClick={() => removeCoupon(coupon.id)}
                      className="rounded-full border border-[#efc5c5] px-3 py-1 text-xs font-semibold text-[#9f2626]"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {message ? <p className="text-sm text-[#333333]">{message}</p> : null}
      </div>
    </main>
  );
}
