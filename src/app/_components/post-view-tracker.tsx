"use client";

import { useEffect } from "react";
import { recordPostView } from "@/lib/actions/views";

const VIEWED_PREFIX = "my-blog:viewed:";

type Props = { postSlug: string };

// Records one view per browser session per post (sessionStorage guard avoids
// refresh/prefetch inflation). Renders nothing.
export function PostViewTracker({ postSlug }: Props) {
    useEffect(() => {
        const key = `${VIEWED_PREFIX}${postSlug}`;
        try {
            if (sessionStorage.getItem(key)) return;
            sessionStorage.setItem(key, "1");
        } catch {
            // sessionStorage unavailable (private mode / quota): count anyway.
        }
        void recordPostView(postSlug);
    }, [postSlug]);

    return null;
}
