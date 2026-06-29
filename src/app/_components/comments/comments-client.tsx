"use client";

import { useCallback, useEffect, useState, type ComponentProps } from "react";
import { createClient } from "@/lib/supabase/client";
import { getComments } from "@/lib/actions/comments";
import { Comment } from "@/lib/supabase/types";
import { CommentList } from "./comment-list";
import type { ShowcasedBadge } from "./comment-item";

/**
 * Client island that loads the dynamic comment data (current user, profile,
 * comments) in the browser so the post page itself can render as static HTML.
 * Label/config props are computed by the server `CommentSection` and forwarded
 * verbatim to the already-client `CommentList`.
 */
type Props = Omit<
    ComponentProps<typeof CommentList>,
    "comments" | "currentUserId" | "currentUserEmail" | "currentUserDisplayName" | "onMutated"
>;

type CurrentUser = {
    id: string | null;
    email: string | null;
    displayName: string | null;
};

const SIGNED_OUT: CurrentUser = { id: null, email: null, displayName: null };

export function CommentsClient(props: Props) {
    const { postSlug } = props;
    const [comments, setComments] = useState<Comment[]>([]);
    const [user, setUser] = useState<CurrentUser>(SIGNED_OUT);
    const [loading, setLoading] = useState(true);
    const [showcaseMap, setShowcaseMap] = useState<Map<string, ShowcasedBadge[]>>(new Map());

    const refetchComments = useCallback(async () => {
        setComments(await getComments(postSlug));
    }, [postSlug]);

    useEffect(() => {
        const supabase = createClient();
        let active = true;

        const resolveUser = async (): Promise<CurrentUser> => {
            const {
                data: { user: authUser },
            } = await supabase.auth.getUser();
            if (!authUser) return SIGNED_OUT;
            const { data: profile } = await supabase
                .from("profiles")
                .select("display_name")
                .eq("id", authUser.id)
                .maybeSingle();
            return {
                id: authUser.id,
                email: authUser.email ?? null,
                displayName: profile?.display_name ?? null,
            };
        };

        void (async () => {
            const [resolvedUser, fetchedComments] = await Promise.all([
                resolveUser(),
                getComments(postSlug),
            ]);
            if (!active) return;
            setUser(resolvedUser);
            setComments(fetchedComments);
            setLoading(false);

            // Fetch showcased badges for all commenters
            const userIds = [...new Set(fetchedComments.map((c) => c.user_id).filter(Boolean))];
            if (userIds.length > 0) {
                const { data } = await supabase
                    .from("user_badge_showcase")
                    .select("user_id, badge_definitions(icon, label)")
                    .in("user_id", userIds);
                if (active && data) {
                    const map = new Map<string, ShowcasedBadge[]>();
                    for (const row of data) {
                        const uid = row.user_id;
                        const def = (row.badge_definitions as unknown) as { icon: string | null; label: unknown } | null;
                        if (!def) continue;
                        const label = def.label as { en: string; vi: string } | null;
                        const badge: ShowcasedBadge = { icon: def.icon, label };
                        const existing = map.get(uid) ?? [];
                        existing.push(badge);
                        map.set(uid, existing);
                    }
                    setShowcaseMap(map);
                }
            }
        })();

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange(() => {
            void resolveUser().then((resolved) => {
                if (active) setUser(resolved);
            });
        });

        return () => {
            active = false;
            subscription.unsubscribe();
        };
    }, [postSlug]);

    if (loading) {
        return (
            <div className="mt-16 border-t border-neutral-200 pt-12 dark:border-neutral-700">
                <div className="mb-8 h-7 w-40 animate-pulse rounded bg-neutral-200 dark:bg-neutral-700" />
                <div className="h-20 w-full animate-pulse rounded bg-neutral-100 dark:bg-neutral-800" />
            </div>
        );
    }

    return (
        <CommentList
            {...props}
            comments={comments}
            currentUserId={user.id}
            currentUserEmail={user.email}
            currentUserDisplayName={user.displayName}
            onMutated={refetchComments}
            showcaseMap={showcaseMap}
        />
    );
}
