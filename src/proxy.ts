import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { defaultLocale, isValidLocale } from "@/i18n/config";

const PUBLIC_FILE = /\.[^/]+$/;

const AUTH_REFRESH_PREFIXES = ["/profile", "/auth"];

function stripLocale(pathname: string): string {
    const segs = pathname.split("/").filter(Boolean);
    if (segs[0] && isValidLocale(segs[0])) segs.shift();
    return "/" + segs.join("/");
}

function needsAuthRefresh(pathname: string): boolean {
    const rest = stripLocale(pathname);
    return AUTH_REFRESH_PREFIXES.some((p) => rest === p || rest.startsWith(p + "/"));
}

export async function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;

    if (
        pathname.startsWith("/_next") ||
        pathname.startsWith("/api") ||
        pathname.startsWith("/favicon") ||
        pathname === "/feed.xml" ||
        PUBLIC_FILE.test(pathname)
    ) {
        return NextResponse.next();
    }

    const segments = pathname.split("/").filter(Boolean);
    const firstSegment = segments[0];
    const hasLocale = !!firstSegment && isValidLocale(firstSegment);

    if (!hasLocale && !pathname.startsWith("/auth/callback")) {
        const cookieLocale = request.cookies.get("NEXT_LOCALE")?.value;
        const targetLocale =
            cookieLocale && isValidLocale(cookieLocale) ? cookieLocale : defaultLocale;
        const redirectUrl = request.nextUrl.clone();
        redirectUrl.pathname = `/${targetLocale}${pathname === "/" ? "" : pathname}`;
        const res = NextResponse.redirect(redirectUrl);
        res.cookies.set("NEXT_LOCALE", targetLocale);
        return res;
    }

    let response = NextResponse.next({ request });
    if (hasLocale) {
        response.cookies.set("NEXT_LOCALE", firstSegment);
    } else if (pathname.startsWith("/auth/callback")) {
        response.cookies.set("NEXT_LOCALE", defaultLocale);
    }

    if (!needsAuthRefresh(pathname)) {
        return response;
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!supabaseUrl || !supabasePublishableKey) return response;

    const supabase = createServerClient(supabaseUrl, supabasePublishableKey, {
        cookies: {
            getAll() {
                return request.cookies.getAll();
            },
            setAll(cookiesToSet) {
                cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
                response = NextResponse.next({ request });
                if (hasLocale) {
                    response.cookies.set("NEXT_LOCALE", firstSegment);
                }
                cookiesToSet.forEach(({ name, value, options }) =>
                    response.cookies.set(name, value, options),
                );
            },
        },
    });
    await supabase.auth.getUser();
    return response;
}

export const config = {
    matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
