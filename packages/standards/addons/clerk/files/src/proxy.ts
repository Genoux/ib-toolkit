import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { env } from "@/shared/config/env";
import { ROUTES } from "@/shared/config/routes";
import { resolveRoleFromDomains } from "@/shared/lib/roles";

const isPublicRoute = createRouteMatcher(["/sign-in(.*)", "/api/health", "/robots.txt"]);
const isAdminRoute = createRouteMatcher(["/admin(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) return;

  const { sessionClaims } = await auth.protect();
  if (
    isAdminRoute(req) &&
    resolveRoleFromDomains(sessionClaims, env.ADMIN_EMAIL_DOMAINS) !== "admin"
  ) {
    return NextResponse.redirect(new URL(ROUTES.home, req.url));
  }
});

export const config = {
  matcher: [
    // `monitoring` is the Sentry tunnel route; running Clerk on it would drop browser events.
    "/((?!_next(?:/|$)|monitoring(?:/|$)|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
