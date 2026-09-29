import { EmptyState } from "@inbeat/ui/components/empty-state";
import { ShieldCheck } from "lucide-react";
import { requireAdmin } from "@/shared/lib/auth";

export default async function AdminPage() {
  await requireAdmin();

  return (
    <main className="mx-auto flex max-w-xl flex-col px-6 py-16">
      <EmptyState
        icon={ShieldCheck}
        title="Admins only"
        description="Gated twice: the proxy redirects non-admins, and the page calls requireAdmin()."
      />
    </main>
  );
}
