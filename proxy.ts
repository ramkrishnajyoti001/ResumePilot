import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function proxy(request: NextRequest) {
  const supabaseResponse = NextResponse.next({
    request,
  });

  const hostname = request.nextUrl.hostname;
  const isLocalDevelopment = hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";

  if (isLocalDevelopment) {
    return supabaseResponse;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return supabaseResponse;
  }

  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          request.cookies.set(name, value);
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  const { data: claimsData, error } = await supabase.auth.getClaims();
  const claims = error ? null : claimsData?.claims;

  const pathname = request.nextUrl.pathname;

  const protectedRoute =
    pathname.startsWith("/dashboard") ||
    pathname.startsWith("/admin");

  if (protectedRoute && !claims) {
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", pathname);

    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
