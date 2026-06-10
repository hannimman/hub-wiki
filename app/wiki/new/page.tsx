import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { getRatingsEnabled } from "@/lib/ratings";
import { listParentOptions } from "@/lib/pages";
import PageEditor from "../PageEditor";

export const dynamic = "force-dynamic";

export default async function NewPage({
  searchParams,
}: {
  searchParams: Promise<{ title?: string; parent?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const { title, parent } = await searchParams;
  const ratingsAllowed = await getRatingsEnabled();
  const parentOptions = await listParentOptions();

  return (
    <main className="container page">
      <h1 style={{ marginBottom: 16 }}>새 문서</h1>
      <PageEditor
        mode="new"
        initialTitle={title ?? ""}
        ratingsAllowed={ratingsAllowed}
        initialRatingsEnabled={ratingsAllowed}
        parentOptions={parentOptions}
        initialParentId={parent ?? null}
      />
    </main>
  );
}
