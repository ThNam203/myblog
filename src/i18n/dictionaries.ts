import { isValidLocale, type Locale } from "./config";
import { footerQuotesByLocale, type FooterQuote } from "./footer-quotes";

export type { FooterQuote };

export type Dictionary = {
    metadata: {
        title: string;
        description: string;
        siteName: string;
        keywords: string[];
        authorBio: string;
    };
    errors: {
        notAuthenticated: string;
        displayNameLength: string;
        confessionBodyLength: string;
    };
    ui: {
        headerTitle: string;
        blogHeading: string;
        moreStories: string;
        latestHeading: string;
        alertTextPrefix: string;
        alertLinkLabel: string;
        postsInCategory: string;
        footerPrimaryCta: string;
        footerSecondaryCta: string;
        footerQuotes: FooterQuote[];
        footerQuotePrevAria: string;
        footerQuoteNextAria: string;
        languageLabel: string;
        languageOptionVietnamese: string;
        languageOptionEnglish: string;
        themeSystem: string;
        themeDark: string;
        themeLight: string;
        musicPlay: string;
        musicPause: string;
        musicExpand: string;
        musicCollapse: string;
        musicPrevious: string;
        musicNext: string;
        musicMinimize: string;
        musicRestore: string;
        musicShowPlaylist: string;
        musicPlaylistHeading: string;
        musicNowPlaying: string;
        profilePageHeading: string;
        profilePageMetaTitle: string;
        profileDisplayNameLabel: string;
        profileEmailHint: string;
        profileSave: string;
        profileSaving: string;
        profileSaved: string;
        commentsSignInToComment: string;
        commentsTitle: string;
        commentsEmpty: string;
        commentsWritePlaceholder: string;
        commentsReplyPlaceholder: string;
        commentsPost: string;
        commentsPosting: string;
        commentsPostedSuccess: string;
        commentsCancel: string;
        headerMenuOpenAria: string;
        headerMenuTheme: string;
        headerMenuSignIn: string;
        headerMenuSignUp: string;
        headerMenuSignOut: string;
        headerMenuProfile: string;
        authTabLogin: string;
        authTabRegister: string;
        authCloseAria: string;
        authPlaceholderDisplayName: string;
        authPlaceholderEmail: string;
        authPlaceholderPassword: string;
        authSubmitLogin: string;
        authSubmitRegister: string;
        authSubmitWait: string;
        authDividerOr: string;
        authGoogleCta: string;
        authRegisterSuccess: string;
        authGoogleStartError: string;
        commentsAnonymous: string;
        commentsReply: string;
        commentsDelete: string;
        commentsDeleteCommentAria: string;
        commentsDeleteReplyAria: string;
        profileEmailFieldLabel: string;
        confessionsNavLabel: string;
        confessionsPageMetaTitle: string;
        confessionsPageDescription: string;
        confessionsHeading: string;
        confessionsLead: string;
        confessionsFormHeading: string;
        confessionsListHeading: string;
        confessionsPrivacy: string;
        confessionsPlaceholder: string;
        confessionsSubmit: string;
        confessionsSubmitting: string;
        confessionsSuccess: string;
        confessionsEmpty: string;
        reactionsLabel: string;
        searchOpenAria: string;
        searchDialogTitle: string;
        searchScopeHint: string;
        searchPlaceholder: string;
        searchTypeToStart: string;
        searchLoading: string;
        searchError: string;
        searchNoResults: string;
        searchResultsCount: string;
        searchCloseAria: string;
        searchRecentHeading: string;
        searchRecentClear: string;
        postReadingTime: string;
        postRelatedHeading: string;
        newsletterHeading: string;
        newsletterDescription: string;
        newsletterEmailPlaceholder: string;
        newsletterSubmit: string;
        newsletterSubmitting: string;
        newsletterSuccess: string;
        newsletterErrorGeneric: string;
        newsletterErrorInvalidEmail: string;
    };
    story: {
        regionLabel: string;
        archiveHeading: string;
        openAria: string;
        closeAria: string;
        prevAria: string;
        nextAria: string;
        pauseAria: string;
        playAria: string;
        muteAria: string;
        unmuteAria: string;
    };
};

export type StoryLabels = Dictionary["story"];

export type SearchDialogLabels = {
    openAria: string;
    dialogTitle: string;
    scopeHint: string;
    placeholder: string;
    typeToStart: string;
    loading: string;
    error: string;
    noResults: string;
    resultsCount: string;
    closeAria: string;
    recentHeading: string;
    recentClear: string;
};

export function getSearchDialogLabels(d: Dictionary): SearchDialogLabels {
    const u = d.ui;
    return {
        openAria: u.searchOpenAria,
        dialogTitle: u.searchDialogTitle,
        scopeHint: u.searchScopeHint,
        placeholder: u.searchPlaceholder,
        typeToStart: u.searchTypeToStart,
        loading: u.searchLoading,
        error: u.searchError,
        noResults: u.searchNoResults,
        resultsCount: u.searchResultsCount,
        closeAria: u.searchCloseAria,
        recentHeading: u.searchRecentHeading,
        recentClear: u.searchRecentClear,
    };
}

export type AuthModalLabels = {
    tabLogin: string;
    tabRegister: string;
    closeAria: string;
    placeholderDisplayName: string;
    placeholderEmail: string;
    placeholderPassword: string;
    submitLogin: string;
    submitRegister: string;
    submitWait: string;
    dividerOr: string;
    googleCta: string;
    registerSuccess: string;
    googleStartError: string;
};

export function getAuthModalLabels(d: Dictionary): AuthModalLabels {
    const u = d.ui;
    return {
        tabLogin: u.authTabLogin,
        tabRegister: u.authTabRegister,
        closeAria: u.authCloseAria,
        placeholderDisplayName: u.authPlaceholderDisplayName,
        placeholderEmail: u.authPlaceholderEmail,
        placeholderPassword: u.authPlaceholderPassword,
        submitLogin: u.authSubmitLogin,
        submitRegister: u.authSubmitRegister,
        submitWait: u.authSubmitWait,
        dividerOr: u.authDividerOr,
        googleCta: u.authGoogleCta,
        registerSuccess: u.authRegisterSuccess,
        googleStartError: u.authGoogleStartError,
    };
}

const dictionaries: Record<Locale, Dictionary> = {
    vi: {
        metadata: {
            title: "Blog của Huỳnh Thành Nam — Suy nghĩ, đời sống & hành trình IT",
            description:
                "Blog cá nhân của Huỳnh Thành Nam — chia sẻ suy nghĩ, trải nghiệm sống, hành trình làm việc trong ngành IT và những lát cắt nhỏ về cuộc sống ở Sài Gòn.",
            siteName: "Blog của Huỳnh Thành Nam",
            keywords: [
                "Huỳnh Thành Nam",
                "blog cá nhân",
                "blog tiếng Việt",
                "nhật ký",
                "suy nghĩ",
                "trải nghiệm sống",
                "Sài Gòn",
                "lập trình viên",
                "IT",
                "Let's Live",
            ],
            authorBio:
                "Mình là Huỳnh Thành Nam — một lập trình viên ở Sài Gòn. Mình viết về những gì mình đọc, học, làm, và những cảm xúc nhỏ giữa đời thường.",
        },
        errors: {
            notAuthenticated: "Bạn chưa đăng nhập.",
            displayNameLength: "Tên hiển thị phải có từ {min} đến {max} ký tự.",
            confessionBodyLength: "Nội dung phải từ {min} đến {max} ký tự.",
        },
        ui: {
            headerTitle: "Blog",
            blogHeading: "Blog.",
            moreStories: "Bài viết khác",
            latestHeading: "Mới nhất",
            alertTextPrefix: "Đây là blog của mình. Bạn cũng có thể xem thêm",
            alertLinkLabel: "website Let's Live",
            postsInCategory: "Bài viết trong chủ đề:",
            footerPrimaryCta: "Ghé thăm website Let's Live của mình",
            footerSecondaryCta: "Theo dõi mình trên Instagram",
            footerQuotes: footerQuotesByLocale.vi,
            footerQuotePrevAria: "Trích dẫn trước",
            footerQuoteNextAria: "Trích dẫn sau",
            languageLabel: "Ngôn ngữ",
            languageOptionVietnamese: "Tiếng Việt",
            languageOptionEnglish: "English",
            themeSystem: "Hệ thống",
            themeDark: "Tối",
            themeLight: "Sáng",
            musicPlay: "Phát",
            musicPause: "Tạm dừng",
            musicExpand: "Mở rộng trình phát nhạc",
            musicCollapse: "Thu gọn trình phát nhạc",
            musicPrevious: "Bài trước",
            musicNext: "Bài sau",
            musicMinimize: "Thu nhỏ trình phát xuống góc màn hình",
            musicRestore: "Mở lại trình phát nhạc",
            musicShowPlaylist: "Xem danh sách bài hát",
            musicPlaylistHeading: "Danh sách phát",
            musicNowPlaying: "Đang phát",
            profilePageHeading: "Hồ sơ",
            profilePageMetaTitle: "Chỉnh sửa hồ sơ",
            profileDisplayNameLabel: "Tên hiển thị",
            profileEmailHint: "Email đăng nhập không thể đổi tại đây.",
            profileSave: "Lưu",
            profileSaving: "Đang lưu…",
            profileSaved: "Đã lưu.",
            commentsSignInToComment: "Đăng nhập để bình luận",
            commentsTitle: "Bình luận",
            commentsEmpty: "Chưa có bình luận nào. Hãy là người đầu tiên!",
            commentsWritePlaceholder: "Viết bình luận…",
            commentsReplyPlaceholder: "Trả lời {name}…",
            commentsPost: "Đăng",
            commentsPosting: "Đang đăng…",
            commentsPostedSuccess: "Đã đăng bình luận.",
            commentsCancel: "Hủy",
            headerMenuOpenAria: "Mở menu trang",
            headerMenuTheme: "Giao diện",
            headerMenuSignIn: "Đăng nhập",
            headerMenuSignUp: "Đăng ký",
            headerMenuSignOut: "Đăng xuất",
            headerMenuProfile: "Hồ sơ",
            authTabLogin: "Đăng nhập",
            authTabRegister: "Đăng ký",
            authCloseAria: "Đóng",
            authPlaceholderDisplayName: "Tên hiển thị",
            authPlaceholderEmail: "Email",
            authPlaceholderPassword: "Mật khẩu",
            authSubmitLogin: "Đăng nhập",
            authSubmitRegister: "Tạo tài khoản",
            authSubmitWait: "Đang xử lý…",
            authDividerOr: "hoặc",
            authGoogleCta: "Tiếp tục với Google",
            authRegisterSuccess: "Đã tạo tài khoản! Kiểm tra email để xác nhận, rồi đăng nhập.",
            authGoogleStartError: "Không thể bắt đầu đăng nhập Google. Vui lòng thử lại.",
            commentsAnonymous: "Ẩn danh",
            commentsReply: "Trả lời",
            commentsDelete: "Xóa",
            commentsDeleteCommentAria: "Xóa bình luận",
            commentsDeleteReplyAria: "Xóa phản hồi",
            profileEmailFieldLabel: "Email",
            confessionsNavLabel: "Or a little conffession? Please?",
            confessionsPageMetaTitle: "Or a little conffession? Please?",
            confessionsPageDescription:
                "Gửi confession ẩn danh — không cần tài khoản, không lưu thông tin cá nhân.",
            confessionsHeading: "Or a little conffession? Please?",
            confessionsLead: "Viết điều bạn muốn chia sẻ ẩn danh.",
            confessionsFormHeading: "Gửi confession",
            confessionsListHeading: "Mới gần đây",
            confessionsPrivacy:
                "Mình không lưu email, tên hay dữ liệu nhận dạng nào, chỉ lưu nội dung bạn gửi và thời gian đăng. Vì vậy bạn cũng không thể nào sửa nội dung nếu có vấn đề gì, hoặc bạn có thể liên hệ mình để sửa.",
            confessionsPlaceholder: "Viết confession của bạn…",
            confessionsSubmit: "Gửi",
            confessionsSubmitting: "Đang gửi…",
            confessionsSuccess: "Đã gửi confession.",
            confessionsEmpty: "Chưa có confession nào. Hãy là người đầu tiên!",
            reactionsLabel: "Cảm nhận của bạn về bài viết này?",
            searchOpenAria: "Mở tìm kiếm bài viết",
            searchDialogTitle: "Tìm kiếm bài viết",
            searchScopeHint: "Tìm trong tiêu đề, mô tả, ngày, chủ đề và địa điểm.",
            searchPlaceholder: "Nhập từ khóa…",
            searchTypeToStart: "Hãy nhập gì đó để bắt đầu tìm kiếm.",
            searchLoading: "Đang tải…",
            searchError: "Không tải được danh sách bài viết. Vui lòng thử lại.",
            searchNoResults: "Không tìm thấy bài viết nào phù hợp.",
            searchResultsCount: "{count} kết quả",
            searchCloseAria: "Đóng tìm kiếm",
            searchRecentHeading: "Tìm kiếm gần đây",
            searchRecentClear: "Xóa",
            postReadingTime: "Đọc khoảng {minutes} phút",
            postRelatedHeading: "Bài viết liên quan",
            newsletterHeading: "Đăng ký nhận bài mới",
            newsletterDescription: "Nhận email mỗi khi mình đăng bài mới.",
            newsletterEmailPlaceholder: "Email của bạn",
            newsletterSubmit: "Đăng ký",
            newsletterSubmitting: "Đang gửi…",
            newsletterSuccess: "Đăng ký thành công!",
            newsletterErrorGeneric: "Không thể đăng ký. Vui lòng thử lại.",
            newsletterErrorInvalidEmail: "Email không hợp lệ.",
        },
        story: {
            regionLabel: "Stories",
            archiveHeading: "Lưu trữ",
            openAria: "Mở story: {title}",
            closeAria: "Đóng",
            prevAria: "Trước",
            nextAria: "Tiếp theo",
            pauseAria: "Tạm dừng",
            playAria: "Phát",
            muteAria: "Tắt tiếng",
            unmuteAria: "Bật tiếng",
        },
    },
    en: {
        metadata: {
            title: "Blog of Huỳnh Thành Nam — Thoughts, life & a developer’s journey",
            description:
                "Personal blog by Huỳnh Thành Nam — thoughts, life experiences, notes from working in IT, and small slices of everyday life in Saigon, Vietnam.",
            siteName: "Blog of Huỳnh Thành Nam",
            keywords: [
                "Huỳnh Thành Nam",
                "personal blog",
                "developer blog",
                "life in Saigon",
                "Vietnam",
                "thoughts",
                "journal",
                "software engineer",
                "IT",
                "Let's Live",
            ],
            authorBio:
                "I'm Huỳnh Thành Nam, a software developer based in Saigon. I write about what I read, learn, build, and feel along the way.",
        },
        errors: {
            notAuthenticated: "You are not signed in.",
            displayNameLength: "Display name must be between {min} and {max} characters.",
            confessionBodyLength: "Your message must be between {min} and {max} characters.",
        },
        ui: {
            headerTitle: "Blog",
            blogHeading: "Blog.",
            moreStories: "More Stories",
            latestHeading: "Latest",
            alertTextPrefix: "This is my blog. You can also check out my",
            alertLinkLabel: "Let's Live website",
            postsInCategory: "Posts in:",
            footerPrimaryCta: "Visit my Let's Live website",
            footerSecondaryCta: "Follow me on Instagram",
            footerQuotes: footerQuotesByLocale.en,
            footerQuotePrevAria: "Previous quote",
            footerQuoteNextAria: "Next quote",
            languageLabel: "Language",
            languageOptionVietnamese: "Tiếng Việt",
            languageOptionEnglish: "English",
            themeSystem: "System",
            themeDark: "Dark",
            themeLight: "Light",
            musicPlay: "Play",
            musicPause: "Pause",
            musicExpand: "Expand music player",
            musicCollapse: "Collapse music player",
            musicPrevious: "Previous track",
            musicNext: "Next track",
            musicMinimize: "Minimize player to corner",
            musicRestore: "Restore music player",
            musicShowPlaylist: "Show playlist",
            musicPlaylistHeading: "Playlist",
            musicNowPlaying: "Now playing",
            profilePageHeading: "Profile",
            profilePageMetaTitle: "Edit profile",
            profileDisplayNameLabel: "Display name",
            profileEmailHint: "Sign-in email cannot be changed here.",
            profileSave: "Save",
            profileSaving: "Saving…",
            profileSaved: "Saved.",
            commentsSignInToComment: "Sign in to comment",
            commentsTitle: "Comments",
            commentsEmpty: "No comments yet. Be the first!",
            commentsWritePlaceholder: "Write a comment…",
            commentsReplyPlaceholder: "Reply to {name}…",
            commentsPost: "Post",
            commentsPosting: "Posting…",
            commentsPostedSuccess: "Comment posted.",
            commentsCancel: "Cancel",
            headerMenuOpenAria: "Open site menu",
            headerMenuTheme: "Theme",
            headerMenuSignIn: "Sign in",
            headerMenuSignUp: "Sign up",
            headerMenuSignOut: "Sign out",
            headerMenuProfile: "Profile",
            authTabLogin: "Login",
            authTabRegister: "Register",
            authCloseAria: "Close",
            authPlaceholderDisplayName: "Display name",
            authPlaceholderEmail: "Email",
            authPlaceholderPassword: "Password",
            authSubmitLogin: "Login",
            authSubmitRegister: "Create account",
            authSubmitWait: "Please wait…",
            authDividerOr: "or",
            authGoogleCta: "Continue with Google",
            authRegisterSuccess: "Account created! Check your email to confirm, then log in.",
            authGoogleStartError: "Could not start Google sign in. Please try again.",
            commentsAnonymous: "Anonymous",
            commentsReply: "Reply",
            commentsDelete: "Delete",
            commentsDeleteCommentAria: "Delete comment",
            commentsDeleteReplyAria: "Delete reply",
            profileEmailFieldLabel: "Email",
            confessionsNavLabel: "Or a little conffession? Please?",
            confessionsPageMetaTitle: "Or a little conffession? Please?",
            confessionsPageDescription: "Post an anonymous confession.",
            confessionsHeading: "Or a little conffession? Please?",
            confessionsLead: "Share what's on your mind anonymously.",
            confessionsFormHeading: "Submit a confession",
            confessionsListHeading: "Recent",
            confessionsPrivacy:
                "I don’t store email, name, or any identifying data, only your message and when it was posted. So you can't edit the content if there's a problem, or you can contact me to edit.",
            confessionsPlaceholder: "Write your confession…",
            confessionsSubmit: "Submit",
            confessionsSubmitting: "Sending…",
            confessionsSuccess: "Confession posted.",
            confessionsEmpty: "No confessions yet. Be the first!",
            reactionsLabel: "How did this post make you feel?",
            searchOpenAria: "Open post search",
            searchDialogTitle: "Search posts",
            searchScopeHint: "Searches title, excerpt, date, categories, and places.",
            searchPlaceholder: "Type to search…",
            searchTypeToStart: "Type something to start searching.",
            searchLoading: "Loading…",
            searchError: "Could not load posts. Please try again.",
            searchNoResults: "No posts match your search.",
            searchResultsCount: "{count} results",
            searchCloseAria: "Close search",
            searchRecentHeading: "Recent searches",
            searchRecentClear: "Clear",
            postReadingTime: "{minutes} min read",
            postRelatedHeading: "Related posts",
            newsletterHeading: "Subscribe to new posts",
            newsletterDescription: "Get an email when I post something new.",
            newsletterEmailPlaceholder: "Your email",
            newsletterSubmit: "Subscribe",
            newsletterSubmitting: "Sending…",
            newsletterSuccess: "Subscribed!",
            newsletterErrorGeneric: "Could not subscribe. Please try again.",
            newsletterErrorInvalidEmail: "Invalid email.",
        },
        story: {
            regionLabel: "Stories",
            archiveHeading: "Archive",
            openAria: "Open story: {title}",
            closeAria: "Close",
            prevAria: "Previous",
            nextAria: "Next",
            pauseAria: "Pause",
            playAria: "Play",
            muteAria: "Mute",
            unmuteAria: "Unmute",
        },
    },
};

export function getDictionary(locale: Locale): Dictionary {
    return dictionaries[locale];
}

export function getDictionaryForLocale(locale: string): Dictionary {
    const loc: Locale = isValidLocale(locale) ? locale : "en";
    return dictionaries[loc];
}
