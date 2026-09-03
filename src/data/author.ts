import type { Locale } from "@/i18n/config";

export type AuthorSocialLink = {
    label: string;
    href: string;
};

export type AuthorEducation = {
    school: string;
    detail?: string;
    period?: string;
};

export type AuthorInfo = {
    name: string;
    title: string;
    bio: string;
    location: string;
    picture: string;
    hobbies: string[];
    education: AuthorEducation[];
    socials: AuthorSocialLink[];
    portfolioUrl: string;
};

const AUTHOR_PICTURE = "/assets/avatar/my_first_avatar.webp";
const AUTHOR_PORTFOLIO_URL = "https://sen1or-portfolio.vercel.app";

const AUTHOR_HOBBIES: Record<Locale, string[]> = {
    vi: [
        "Cà phê, đi chơi và karaoke với bạn bè",
        "Gym, cầu lông, đi xe đạp hoặc đi bộ",
        "Đọc sách, chủ yếu là văn học kinh điển",
        "Nghe nhạc, chủ yếu V-pop và US-UK",
        "Game FPS & hack-n-slash",
    ],
    en: [
        "Coffee, play and karaoke with friends",
        "Gym, badminton, bike or walk",
        "Read books, mainly classic literature",
        "Listening to music, mostly V-pop and US-UK",
        "FPS & hack-n-slash games",
    ],
};

const AUTHOR_EDUCATION: Record<Locale, AuthorEducation[]> = {
    vi: [
        {
            school: "Trường Đại học Công nghệ Thông tin — ĐHQG TP.HCM (UIT)",
            detail: "Ngành kĩ thuật phần mềm",
            period: "2021 - 2025",
        },
    ],
    en: [
        {
            school: "University of Information Technology — VNU-HCM (UIT)",
            detail: "Major in software engineering",
            period: "2021 - 2025",
        },
    ],
};

const AUTHOR_SOCIALS: AuthorSocialLink[] = [
    { label: "GitHub", href: "https://github.com/ThNam203" },
    { label: "LinkedIn", href: "https://www.linkedin.com/in/huynh-nam-023135227/" },
    { label: "Instagram", href: "https://www.instagram.com/jk_onyou_/" },
    { label: "Let's Live", href: "https://letslive.work" },
    { label: "Email", href: "mailto:hthnam203@gmail.com" },
];

const author: Record<Locale, AuthorInfo> = {
    vi: {
        name: "Huỳnh Thành Nam (23M)",
        title: "Một con người bình thường",
        bio: "Cứ 1 mét vuông lại có 10 ông kỹ sư phần mềm, và mình là người thứ 11. Không lập dị, chỉ là mình sống hơi khép kín và không mặn mà lắm với mạng xã hội. Bù lại, mình rất thích các hoạt động ngoài trời—đơn giản vì thời gian ngồi ôm máy tính đã quá đủ rồi. Còn blog này là góc nhỏ để mình ghi lại những gì đã đọc, đã học, đã làm, hoặc đôi khi chỉ là vài cảm xúc vụn vặt trong cuộc sống thường ngày.",
        location: "Thành phố Hồ Chí Minh, Việt Nam",
        picture: AUTHOR_PICTURE,
        hobbies: AUTHOR_HOBBIES.vi,
        education: AUTHOR_EDUCATION.vi,
        socials: AUTHOR_SOCIALS,
        portfolioUrl: AUTHOR_PORTFOLIO_URL,
    },
    en: {
        name: "Huỳnh Thành Nam (23M)",
        title: "A normal person",
        bio: "Software engineers are everywhere—you can find ten of them in a single square meter, and I’m the eleventh. I wouldn’t call myself eccentric, just private and not very active on social media. That said, I love outdoor activities because I’ve spent more than enough time sitting down. As for this blog, it’s a space where I write about what I read, learn, and build, or just the little moments and emotions in my everyday life.",
        location: "Ho Chi Minh City, Vietnam",
        picture: AUTHOR_PICTURE,
        hobbies: AUTHOR_HOBBIES.en,
        education: AUTHOR_EDUCATION.en,
        socials: AUTHOR_SOCIALS,
        portfolioUrl: AUTHOR_PORTFOLIO_URL,
    },
};

export function getAuthorInfo(locale: Locale): AuthorInfo {
    return author[locale];
}
