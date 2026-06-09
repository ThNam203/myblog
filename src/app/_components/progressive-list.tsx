"use client";

import { Children, useEffect, useRef, useState } from "react";

type Props = {
    children: React.ReactNode;
    initial?: number;
    step?: number;
    className?: string;
};

// Renders server-provided children progressively: shows `initial`, then reveals
// `step` more whenever the sentinel scrolls into view. No network — the children
// are already serialized; we just mount more of them on demand.
export function ProgressiveList({ children, initial = 6, step = 6, className }: Props) {
    const items = Children.toArray(children);
    const [visible, setVisible] = useState(() => Math.min(initial, items.length));
    const sentinelRef = useRef<HTMLDivElement>(null);

    const hasMore = visible < items.length;

    useEffect(() => {
        if (!hasMore) return;
        const node = sentinelRef.current;
        if (!node) return;
        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisible((v) => Math.min(v + step, items.length));
                }
            },
            { rootMargin: "200px" },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [hasMore, step, items.length]);

    return (
        <>
            <div className={className}>{items.slice(0, visible)}</div>
            {hasMore && <div ref={sentinelRef} aria-hidden className="h-px w-full" />}
        </>
    );
}
