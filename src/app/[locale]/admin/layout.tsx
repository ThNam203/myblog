import { notFound } from "next/navigation";
import Container from "@/app/_components/container";
import { createClient } from "@/lib/supabase/server";
import { isValidLocale } from "@/i18n/config";
import { AdminNav } from "./_components/admin-nav";

type Props = {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
};

export default async function AdminLayout({ children, params }: Props) {
    const { locale } = await params;
    if (!isValidLocale(locale)) notFound();

    if (process.env.NODE_ENV !== "development") {
        const ownerEmail = process.env.ADMIN_EMAIL;
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (
            !ownerEmail ||
            !user?.email ||
            user.email.toLowerCase() !== ownerEmail.toLowerCase()
        ) {
            notFound();
        }
    }

    const navItems = [
        { href: `/${locale}/admin/stories`, label: "Stories" },
        { href: `/${locale}/admin/users`, label: "Users" },
        { href: `/${locale}/admin/badges`, label: "Badges" },
    ];

    return (
        <Container>
            <div className="my-8 flex gap-8">
                <aside className="w-40 shrink-0">
                    <p className="mb-3 px-3 text-xs font-semibold uppercase tracking-wider text-neutral-400">
                        Admin
                    </p>
                    <AdminNav items={navItems} />
                </aside>
                <div className="min-w-0 flex-1">{children}</div>
            </div>
        </Container>
    );
}
