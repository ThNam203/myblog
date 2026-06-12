import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { Database } from "./types";

function requireEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required environment variable: ${name}`);
    return value;
}

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient<Database>(
        requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
        requireEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options),
                        );
                    } catch {
                        return;
                    }
                },
            },
        },
    );
}

export function createAdminClient() {
    // SUPABASE_SERVICE_ROLE_KEY is the pre-rename name of the secret key.
    const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!secretKey) {
        throw new Error(
            "Missing required environment variable: SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY)",
        );
    }
    return createSupabaseClient<Database>(requireEnv("NEXT_PUBLIC_SUPABASE_URL"), secretKey, {
        auth: { autoRefreshToken: false, persistSession: false },
    });
}
