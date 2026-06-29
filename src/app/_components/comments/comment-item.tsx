"use client";

import { useState } from "react";
import { Comment } from "@/lib/supabase/types";
import { CommentForm } from "./comment-form";
import { CommentBody } from "./comment-body";

export type ShowcasedBadge = {
    icon: string | null;
    label: { en: string; vi: string } | null;
};

type Props = {
    comment: Comment;
    replies: Comment[];
    locale: string;
    currentUserId: string | null;
    isAdmin: boolean;
    replyPlaceholderTemplate: string;
    postLabel: string;
    postingLabel: string;
    cancelLabel: string;
    anonymousLabel: string;
    replyLabel: string;
    deleteLabel: string;
    deleteCommentAria: string;
    deleteReplyAria: string;
    onReply: (body: string) => Promise<void> | void;
    onDelete: (id: string) => Promise<void> | void;
    showcasedBadges?: ShowcasedBadge[];
};

const markdownClass =
    "comment-markdown whitespace-pre-wrap text-sm leading-relaxed [&>pre]:my-2 [&>pre]:rounded [&>pre]:bg-neutral-200 [&>pre]:dark:bg-neutral-900 [&>pre]:p-2 [&>pre]:overflow-x-auto [&_code]:rounded [&_code]:bg-neutral-200 [&_code]:dark:bg-neutral-900 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_a]:underline [&_a]:underline-offset-2";

export function CommentItem({
    comment,
    replies,
    locale,
    currentUserId,
    isAdmin,
    replyPlaceholderTemplate,
    postLabel,
    postingLabel,
    cancelLabel,
    anonymousLabel,
    replyLabel,
    deleteLabel,
    deleteCommentAria,
    deleteReplyAria,
    onReply,
    onDelete,
    showcasedBadges,
}: Props) {
    const [showReplyForm, setShowReplyForm] = useState(false);

    const canMutate = isAdmin || currentUserId === comment.user_id;
    const displayName = comment.profiles?.display_name ?? anonymousLabel;
    const initial = (displayName[0] ?? "?").toUpperCase();
    const formattedDate = new Date(comment.created_at).toLocaleDateString(
        locale === "vi" ? "vi-VN" : "en-US",
        { year: "numeric", month: "short", day: "numeric" },
    );

    async function handleReplySubmit(body: string) {
        await onReply(body);
        setShowReplyForm(false);
    }

    return (
        <div className="flex flex-col gap-2">
            <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50">
                <div className="mb-2 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-300 text-sm font-semibold text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200">
                            {initial}
                        </div>
                        {showcasedBadges && showcasedBadges.length > 0 && (
                            <div className="flex items-center gap-1">
                                {showcasedBadges.map((badge, i) =>
                                    badge.icon ? (
                                        <img
                                            key={i}
                                            src={badge.icon}
                                            alt={badge.label?.en ?? ""}
                                            title={badge.label?.en ?? ""}
                                            className="h-5 w-5 object-contain"
                                        />
                                    ) : null,
                                )}
                            </div>
                        )}
                        <span className="text-sm font-semibold">{displayName}</span>
                        <span className="text-xs text-neutral-400">{formattedDate}</span>
                    </div>
                    {canMutate && (
                        <button
                            type="button"
                            onClick={() => onDelete(comment.id)}
                            className="text-xs text-neutral-400 transition-colors hover:text-red-500"
                            aria-label={deleteCommentAria}
                        >
                            {deleteLabel}
                        </button>
                    )}
                </div>
                <CommentBody body={comment.body} className={markdownClass} />
                {currentUserId && (
                    <button
                        type="button"
                        onClick={() => setShowReplyForm((v) => !v)}
                        className="mt-2 text-xs text-neutral-400 transition-colors hover:text-neutral-600 dark:hover:text-neutral-300"
                    >
                        {showReplyForm ? cancelLabel : replyLabel}
                    </button>
                )}
            </div>

            {replies.length > 0 && (
                <div className="ml-8 flex flex-col gap-2">
                    {replies.map((reply) => (
                        <div
                            key={reply.id}
                            className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 dark:border-neutral-700 dark:bg-neutral-800/50"
                        >
                            <ReplyRow
                                reply={reply}
                                locale={locale}
                                currentUserId={currentUserId}
                                isAdmin={isAdmin}
                                anonymousLabel={anonymousLabel}
                                deleteLabel={deleteLabel}
                                deleteReplyAria={deleteReplyAria}
                                onDelete={onDelete}
                            />
                        </div>
                    ))}
                </div>
            )}

            {showReplyForm && currentUserId && (
                <div className="ml-8">
                    <CommentForm
                        placeholder={replyPlaceholderTemplate.replaceAll("{name}", displayName)}
                        postLabel={postLabel}
                        postingLabel={postingLabel}
                        cancelLabel={cancelLabel}
                        onSubmit={handleReplySubmit}
                        onCancel={() => setShowReplyForm(false)}
                    />
                </div>
            )}
        </div>
    );
}

function ReplyRow({
    reply,
    locale,
    currentUserId,
    isAdmin,
    anonymousLabel,
    deleteLabel,
    deleteReplyAria,
    onDelete,
}: {
    reply: Comment;
    locale: string;
    currentUserId: string | null;
    isAdmin: boolean;
    anonymousLabel: string;
    deleteLabel: string;
    deleteReplyAria: string;
    onDelete: (id: string) => Promise<void> | void;
}) {
    const canMutate = isAdmin || currentUserId === reply.user_id;
    const displayName = reply.profiles?.display_name ?? anonymousLabel;
    const initial = (displayName[0] ?? "?").toUpperCase();
    const formattedDate = new Date(reply.created_at).toLocaleDateString(
        locale === "vi" ? "vi-VN" : "en-US",
        { year: "numeric", month: "short", day: "numeric" },
    );

    return (
        <>
            <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-neutral-300 text-xs font-semibold text-neutral-700 dark:bg-neutral-600 dark:text-neutral-200">
                        {initial}
                    </div>
                    <span className="text-sm font-semibold">{displayName}</span>
                    <span className="text-xs text-neutral-400">{formattedDate}</span>
                </div>
                {canMutate && (
                    <button
                        type="button"
                        onClick={() => onDelete(reply.id)}
                        className="text-xs text-neutral-400 transition-colors hover:text-red-500"
                        aria-label={deleteReplyAria}
                    >
                        {deleteLabel}
                    </button>
                )}
            </div>
            <CommentBody
                body={reply.body}
                className="comment-markdown whitespace-pre-wrap text-sm leading-relaxed [&_code]:rounded [&_code]:bg-neutral-200 [&_code]:dark:bg-neutral-900 [&_code]:px-1 [&_code]:font-mono [&_code]:text-xs [&_a]:underline"
            />
        </>
    );
}
