import { redirect } from "next/navigation";

type LibraryDetailPageParams = {
  params: Promise<{
    id: string;
  }>;
  searchParams: Promise<{
    filter?: string;
    q?: string;
  }>;
};

export default async function LibraryDetailPage({ params, searchParams }: LibraryDetailPageParams) {
  const [{ id }, query] = await Promise.all([params, searchParams]);
  const next = new URLSearchParams();
  next.set("reportId", id);
  if (query.filter) next.set("filter", query.filter);
  if (query.q) next.set("q", query.q);
  redirect(`/library?${next.toString()}`);
}
