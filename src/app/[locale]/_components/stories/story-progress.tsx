import cn from "classnames";

type Props = {
    count: number;
    currentIndex: number;
    progress: number; // 0..1 for the current segment
};

export function StoryProgress({ count, currentIndex, progress }: Props) {
    return (
        <div className="flex gap-1" aria-hidden>
            {Array.from({ length: count }).map((_, index) => {
                let fill = 0;
                if (index < currentIndex) fill = 1;
                else if (index === currentIndex) fill = progress;
                return (
                    <div
                        key={index}
                        className={cn("h-0.5 flex-1 overflow-hidden rounded-full bg-white/30")}
                    >
                        <div
                            className="h-full rounded-full bg-white"
                            style={{ width: `${Math.round(fill * 100)}%` }}
                        />
                    </div>
                );
            })}
        </div>
    );
}
