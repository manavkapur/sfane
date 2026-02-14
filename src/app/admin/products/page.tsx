"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

type AdminProduct = {
  id: number;
  name: string;
  slug: string;
  price: number | string;
  active: boolean;
  product_images: Array<{ id: number; image_url: string }> | null;
};

export default function AdminProductsPage() {
  const supabase = useMemo(() => getSupabaseBrowserClient(), []);
  const router = useRouter();

  const [products, setProducts] = useState<AdminProduct[]>([]);
  const [loading, setLoading] = useState(Boolean(supabase));
  const [message, setMessage] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [price, setPrice] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const refreshProducts = async () => {
    if (!supabase) return;

    const { data, error } = await supabase.functions.invoke("admin-products", { method: "GET" });
    if (error) {
      setMessage(error.message);
      setProducts([]);
      return;
    }

    setProducts((data?.products as AdminProduct[]) ?? []);
  };

  useEffect(() => {
    if (!supabase) {
      return;
    }

    supabase.auth.getSession().then(async ({ data: sessionData }) => {
      if (!sessionData.session) {
        router.replace("/admin/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("admin-products", { method: "GET" });
      if (error) {
        setMessage(error.message);
        setProducts([]);
        setLoading(false);
        return;
      }

      setProducts((data?.products as AdminProduct[]) ?? []);
      setLoading(false);
    });
  }, [supabase, router]);

  const createProduct = async () => {
    if (!supabase) return;
    setMessage(null);

    const parsedPrice = Number(price);
    if (!name || !slug || !Number.isFinite(parsedPrice)) {
      setMessage("Name, slug, and valid price are required.");
      return;
    }

    const { error } = await supabase.functions.invoke("admin-products", {
      method: "POST",
      body: {
        action: "create",
        product: {
          name,
          slug,
          price: parsedPrice,
          images: imageUrl ? [imageUrl] : [],
        },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setName("");
    setSlug("");
    setPrice("");
    setImageUrl("");
    setMessage("Product created.");
    await refreshProducts();
  };

  const deactivateProduct = async (productId: number) => {
    if (!supabase) return;

    const { error } = await supabase.functions.invoke("admin-products", {
      method: "POST",
      body: {
        action: "delete",
        product: { id: productId },
      },
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(`Product ${productId} archived.`);
    await refreshProducts();
  };

  if (!supabase) {
    return (
      <main className="mx-auto max-w-5xl px-6 py-10">
        <p className="rounded-2xl border border-dashed border-[#d8c2b1] bg-white p-6 text-sm text-[#5b4739]">
          Missing Supabase env vars.
        </p>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-semibold text-[#1f140d]">Admin Product Dashboard</h1>
        <div className="flex items-center gap-3">
          <Link href="/admin/cms" className="text-sm text-[#6a4b36] underline">
            Open Admin CMS
          </Link>
          <Link href="/products" className="text-sm text-[#6a4b36] underline">
            Back to store
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-2xl border border-[#e8d9cf] bg-white p-6">
        <h2 className="text-lg font-semibold text-[#1f140d]">Create product</h2>
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="Name"
            className="rounded-full border border-[#d8c2b1] px-4 py-2 text-sm"
          />
          <input
            value={slug}
            onChange={(event) => setSlug(event.target.value)}
            placeholder="slug"
            className="rounded-full border border-[#d8c2b1] px-4 py-2 text-sm"
          />
          <input
            value={price}
            onChange={(event) => setPrice(event.target.value)}
            placeholder="Price"
            className="rounded-full border border-[#d8c2b1] px-4 py-2 text-sm"
          />
          <input
            value={imageUrl}
            onChange={(event) => setImageUrl(event.target.value)}
            placeholder="Image URL"
            className="rounded-full border border-[#d8c2b1] px-4 py-2 text-sm"
          />
        </div>
        <button
          onClick={createProduct}
          className="mt-4 rounded-full bg-[#1f140d] px-4 py-2 text-sm font-semibold text-white"
        >
          Create
        </button>
      </section>

      <section className="mt-6 space-y-3">
        {loading ? <p className="text-sm text-[#5b4739]">Loading products...</p> : null}

        {products.map((product) => (
          <article key={product.id} className="rounded-2xl border border-[#e8d9cf] bg-white p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-[#1f140d]">{product.name}</p>
                <p className="text-sm text-[#5b4739]">/{product.slug} | ₹{Number(product.price).toFixed(2)}</p>
                <p className="text-xs text-[#7b5a45]">{product.active ? "Active" : "Inactive"}</p>
              </div>
              {product.active ? (
                <button
                  onClick={() => deactivateProduct(product.id)}
                  className="rounded-full border border-[#d8c2b1] px-4 py-2 text-sm font-semibold text-[#6a4b36]"
                >
                  Archive
                </button>
              ) : null}
            </div>
          </article>
        ))}
      </section>

      {message ? <p className="mt-4 text-sm text-[#6a4b36]">{message}</p> : null}
    </main>
  );
}
