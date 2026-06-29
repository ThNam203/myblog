"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import cn from "classnames";

type NavItem = { href: string; label: string };

export function AdminNav({ items }: { items: NavItem[] }) {
    const pathname = usePathname();

    return (
        <nav className="flex flex-col gap-1">
            {items.map((item) => (
                <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                        "rounded px-3 py-2 text-sm font-medium transition-colors",
                        pathname.startsWith(item.href)
                            ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900"
                            : "text-neutral-600 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800",
                    )}
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
