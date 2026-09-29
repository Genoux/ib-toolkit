import { UserButton } from "@clerk/nextjs";
import { Badge } from "@inbeat/ui/components/badge";
import { Button } from "@inbeat/ui/components/button";
import Link from "next/link";
import { FeedbackForm } from "@/features/feedback/components/feedback-form";
import { ROUTES } from "@/shared/config/routes";
import { requireViewer } from "@/shared/lib/auth";

export default async function HomePage() {
  const viewer = await requireViewer();

  return (
    <main className="mx-auto flex max-w-xl flex-col gap-8 px-6 py-16">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">inBeat template</h1>
          <Badge variant="secondary">{viewer.role ?? "no role"}</Badge>
        </div>
        <UserButton />
      </header>
      <FeedbackForm />
      {viewer.role === "admin" ? (
        <Button variant="outline" asChild className="self-start">
          <Link href={ROUTES.admin}>Admin</Link>
        </Button>
      ) : null}
    </main>
  );
}
