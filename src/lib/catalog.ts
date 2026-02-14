import { getSupabaseClient } from "@/lib/supabase";

export type CatalogCategory = {
  id: number;
  name: string;
  slug: string;
  productCount: number;
};

export type CatalogProduct = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number;
  originalPrice: number | null;
  offerType: string;
  discountPercent: number | null;
  buyQty: number | null;
  getQty: number | null;
  images: string[];
  categories: Array<Pick<CatalogCategory, "id" | "name" | "slug">>;
};

type ProductRow = {
  id: number;
  name: string;
  slug: string;
  description: string | null;
  price: number | string;
  original_price: number | string | null;
  offer_type: string | null;
  discount_percent: number | null;
  buy_qty: number | null;
  get_qty: number | null;
  active: boolean | null;
  product_images: Array<{ image_url: string }> | null;
  product_categories:
    | Array<{
        categories:
          | {
              id: number;
              name: string;
              slug: string;
            }
          | null;
      }>
    | null;
};

function toNumber(value: number | string | null | undefined): number {
  if (value === null || value === undefined) return 0;
  if (typeof value === "number") return value;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export async function getCatalogData(categorySlug?: string): Promise<{
  products: CatalogProduct[];
  categories: CatalogCategory[];
}> {
  const supabase = getSupabaseClient();
  if (!supabase) {
    return { products: [], categories: [] };
  }

  const [productsResult, categoriesResult] = await Promise.all([
    supabase
      .from("products")
      .select(
        "id,name,slug,description,price,original_price,offer_type,discount_percent,buy_qty,get_qty,active,product_images(image_url),product_categories(categories(id,name,slug))"
      )
      .eq("active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("categories")
      .select("id,name,slug,active")
      .eq("active", true)
      .order("name", { ascending: true }),
  ]);

  if (productsResult.error) {
    throw new Error(`Products query failed: ${productsResult.error.message}`);
  }

  if (categoriesResult.error) {
    throw new Error(`Categories query failed: ${categoriesResult.error.message}`);
  }

  const rawProducts = (productsResult.data ?? []) as ProductRow[];
  const activeCategories = (categoriesResult.data ?? []) as Array<{
    id: number;
    name: string;
    slug: string;
    active: boolean;
  }>;

  const products = rawProducts
    .map((item): CatalogProduct => ({
      id: item.id,
      name: item.name,
      slug: item.slug,
      description: item.description,
      price: toNumber(item.price),
      originalPrice:
        item.original_price === null ? null : toNumber(item.original_price),
      offerType: item.offer_type ?? "NONE",
      discountPercent: item.discount_percent,
      buyQty: item.buy_qty,
      getQty: item.get_qty,
      images: (item.product_images ?? []).map((img) => img.image_url),
      categories: (item.product_categories ?? [])
        .map((entry) => entry.categories)
        .filter(
          (
            cat
          ): cat is {
            id: number;
            name: string;
            slug: string;
          } => Boolean(cat)
        ),
    }))
    .filter((item) =>
      categorySlug
        ? item.categories.some((category) => category.slug === categorySlug)
        : true
    );

  const categories: CatalogCategory[] = activeCategories.map((category) => ({
    id: category.id,
    name: category.name,
    slug: category.slug,
    productCount: products.filter((product) =>
      product.categories.some((productCategory) => productCategory.id === category.id)
    ).length,
  }));

  return { products, categories };
}

export async function getProductBySlug(slug: string) {
  const { products } = await getCatalogData();
  return products.find((product) => product.slug === slug) ?? null;
}
