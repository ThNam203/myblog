"use client";

import { useCallback, useOptimistic, useState, useTransition } from "react";
import { toast } from "react-toastify";
import { Comment } from "@/lib/supabase/types";
import { addComment, deleteComment } from "@/lib/actions/comments";
import { CommentItem } from "./comment-item";
import type { ShowcasedBadge } from "./comment-item";
import { CommentForm } from "./comment-form";
import { AuthModal } from "./auth-modal";
import type { AuthModalLabels } from "@/i18n/dictionaries";

type Props = {
    comments: Comment[];
    postSlug: string;
    locale: string;
    currentUserId: string | null;
    currentUserEmail: string | null;
    currentUserDisplayName: string | null;
    adminEmail: string;
    signInToCommentLabel: string;
    commentsTitle: string;
    commentsEmpty: string;
    commentsWritePlaceholder: string;
    commentsReplyPlaceholder: string;
    commentsPost: string;
    commentsPosting: string;
    commentsPostedSuccess: string;
    commentsCancel: string;
    authModal: AuthModalLabels;
    commentsAnonymous: string;
    commentsReply: string;
    commentsDelete: string;
    commentsDeleteCommentAria: string;
    commentsDeleteReplyAria: string;
    onMutated?: () => void | Promise<void>;
    showcaseMap?: Map<string, ShowcasedBadge[]>;
};

type OptimisticAction = { type: "add"; comment: Comment } | { type: "delete"; id: string };

function reducer(state: Comment[], action: OptimisticAction): Comment[] {
    switch (action.type) {
        case "add":
            return [...state, action.comment];
        case "delete":
            return state.filter((c) => c.id !== action.id && c.parent_id !== action.id);
        default:
            return state;
    }
}

export function CommentList(props: Props) {
    const {
        comments,
        postSlug,
        locale,
        currentUserId,
        currentUserEmail,
        currentUserDisplayName,
        adminEmail,
        signInToCommentLabel,
        commentsTitle,
        commentsEmpty,
        commentsWritePlaceholder,
        commentsReplyPlaceholder,
        commentsPost,
        commentsPosting,
        commentsPostedSuccess,
        commentsCancel,
        authModal,
        commentsAnonymous,
        commentsReply,
        commentsDelete,
        commentsDeleteCommentAria,
        commentsDeleteReplyAria,
        onMutated,
        showcaseMap,
    } = props;

    const [showAuthModal, setShowAuthModal] = useState(false);
    const [optimisticComments, applyOptimistic] = useOptimistic(comments, reducer);
    const [, startTransition] = useTransition();

    const isAdmin = !!currentUserEmail && currentUserEmail === adminEmail;
    const topLevel = optimisticComments.filter((c) => !c.parent_id);
    const replies = optimisticComments.filter((c) => !!c.parent_id);

    const handleAdd = useCallback(
        async (body: string, parentId: string | null) => {
            if (!currentUserId) return;
            const trimmed = body.trim();
            if (!trimmed) return;

            const optimistic: Comment = {
                id: `optimistic-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
                post_slug: postSlug,
                user_id: currentUserId,
                parent_id: parentId,
                body: trimmed,
                created_at: new Date().toISOString(),
                profiles: currentUserDisplayName
                    ? { display_name: currentUserDisplayName }
                    : null,
            };

            startTransition(async () => {
                applyOptimistic({ type: "add", comment: optimistic });
                const result = await addComment(postSlug, trimmed, parentId, locale);
                if (result.error) {
                    toast.error(result.error);
                } else {
                    toast.success(commentsPostedSuccess);
                    await onMutated?.();
                }
            });
        },
        [
            applyOptimistic,
            commentsPostedSuccess,
            currentUserDisplayName,
            currentUserId,
            locale,
            onMutated,
            postSlug,
        ],
    );

    const handleDelete = useCallback(
        async (commentId: string) => {
            startTransition(async () => {
                applyOptimistic({ type: "delete", id: commentId });
                const result = await deleteComment(commentId, postSlug, locale);
                if (result.error) {
                    toast.error(result.error);
                } else {
                    await onMutated?.();
                }
            });
        },
        [applyOptimistic, locale, onMutated, postSlug],
    );

    return (
        <div className="mt-16 border-t border-neutral-200 pt-12 dark:border-neutral-700">
            <h2 className="mb-8 text-2xl font-bold tracking-tight">
                {commentsTitle} ({optimisticComments.length})
            </h2>

            {!currentUserId && (
                <div className="mb-8">
                    <button
                        type="button"
                        onClick={() => setShowAuthModal(true)}
                        className="text-sm font-medium text-neutral-800 underline underline-offset-2 hover:no-underline dark:text-neutral-200"
                    >
                        {signInToCommentLabel}
                    </button>
                </div>
            )}

            {currentUserId && (
                <div className="mb-8">
                    <CommentForm
                        placeholder={commentsWritePlaceholder}
                        postLabel={commentsPost}
                        postingLabel={commentsPosting}
                        cancelLabel={commentsCancel}
                        onSubmit={(body) => handleAdd(body, null)}
                    />
                </div>
            )}

            {topLevel.length === 0 ? (
                <p className="text-sm text-neutral-400">{commentsEmpty}</p>
            ) : (
                <div className="flex flex-col gap-6">
                    {topLevel.map((comment) => (
                        <CommentItem
                            key={comment.id}
                            comment={comment}
                            replies={replies.filter((r) => r.parent_id === comment.id)}
                            locale={locale}
                            currentUserId={currentUserId}
                            isAdmin={isAdmin}
                            replyPlaceholderTemplate={commentsReplyPlaceholder}
                            postLabel={commentsPost}
                            postingLabel={commentsPosting}
                            cancelLabel={commentsCancel}
                            anonymousLabel={commentsAnonymous}
                            replyLabel={commentsReply}
                            deleteLabel={commentsDelete}
                            deleteCommentAria={commentsDeleteCommentAria}
                            deleteReplyAria={commentsDeleteReplyAria}
                            onReply={(body) => handleAdd(body, comment.id)}
                            onDelete={(id) => handleDelete(id)}
                            showcasedBadges={comment.user_id ? (showcaseMap?.get(comment.user_id) ?? []) : []}
                        />
                    ))}
                </div>
            )}

            {showAuthModal && (
                <AuthModal labels={authModal} onClose={() => setShowAuthModal(false)} />
            )}
        </div>
    );
}
