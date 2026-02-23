import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function ProductSampleDetailPageRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  redirect(`/products/${encodeURIComponent(slug)}`);
}
