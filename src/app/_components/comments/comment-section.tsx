import { getAuthModalLabels, getDictionary } from "@/i18n/dictionaries";
import { isValidLocale, type Locale } from "@/i18n/config";
import { CommentsClient } from "./comments-client";

type Props = {
    postSlug: string;
    locale: string;
};

export function CommentSection({ postSlug, locale }: Props) {
    const adminEmail = process.env.ADMIN_EMAIL ?? "";
    const dictionary = isValidLocale(locale)
        ? getDictionary(locale as Locale)
        : getDictionary("en");

    return (
        <CommentsClient
            postSlug={postSlug}
            locale={locale}
            adminEmail={adminEmail}
            signInToCommentLabel={dictionary.ui.commentsSignInToComment}
            commentsTitle={dictionary.ui.commentsTitle}
            commentsEmpty={dictionary.ui.commentsEmpty}
            commentsWritePlaceholder={dictionary.ui.commentsWritePlaceholder}
            commentsReplyPlaceholder={dictionary.ui.commentsReplyPlaceholder}
            commentsPost={dictionary.ui.commentsPost}
            commentsPosting={dictionary.ui.commentsPosting}
            commentsPostedSuccess={dictionary.ui.commentsPostedSuccess}
            commentsCancel={dictionary.ui.commentsCancel}
            authModal={getAuthModalLabels(dictionary)}
            commentsAnonymous={dictionary.ui.commentsAnonymous}
            commentsReply={dictionary.ui.commentsReply}
            commentsDelete={dictionary.ui.commentsDelete}
            commentsDeleteCommentAria={dictionary.ui.commentsDeleteCommentAria}
            commentsDeleteReplyAria={dictionary.ui.commentsDeleteReplyAria}
        />
    );
}
