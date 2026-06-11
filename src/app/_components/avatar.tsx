import Link from "next/link";
import { type Locale } from "@/i18n/config";

type Props = {
    name: string;
    picture: string;
    locale?: Locale;
};

const Avatar = ({ name, picture, locale }: Props) => {
    if (locale) {
        return (
            <Link href={`/${locale}/about`} className="group flex items-center">
                <img src={picture} className="w-12 h-12 rounded-full mr-4" alt={name} />
                <div className="text-xl font-bold underline-offset-2 group-hover:underline">
                    {name}
                </div>
            </Link>
        );
    }

    return (
        <div className="flex items-center">
            <img src={picture} className="w-12 h-12 rounded-full mr-4" alt={name} />
            <div className="text-xl font-bold">{name}</div>
        </div>
    );
};

export default Avatar;
