"use client";

import { useEffect, useRef, useState } from "react";
import type { Locale } from "@/i18n/config";
import type { StoryLabels } from "@/i18n/dictionaries";
import type { StoryGroup } from "@/interfaces/story";
import { StoryProgress } from "./story-progress";
import { pickLocalized } from "@/lib/stories/localized";
import { upcomingItems } from "@/lib/stories/story-player";
import { getMusicTrackBySrc } from "@/lib/music-tracks";
import { prefetchAudio, prefetchImage } from "@/lib/stories/media-prefetch";
import type { useStoryPlayer } from "./use-story-player";

const HOLD_MS = 250; // press longer than this is a hold (pause), not a tap (navigate)

type Player = ReturnType<typeof useStoryPlayer>;

type Props = {
    groups: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
    player: Player;
};

export function StoryViewer({ groups, locale, labels, player }: Props) {
    const { state, currentGroup, currentItem, close, next, prev, pause, resume, setProgress } =
        player;
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null);
    // Last <audio> src we set, so we only reload+reseek when the track changes.
    // Reset on close (the element unmounts), so a reopen re-applies the src.
    const audioSrcRef = useRef<string | null>(null);
    const [soundOn, setSoundOn] = useState(true);
    // Distinguish a tap (navigate) from a hold (pause only). A hold past
    // HOLD_MS sets holdRef so the trailing click is suppressed; keyboard
    // activation has no pointerdown, so holdRef stays false and navigates.
    const holdRef = useRef(false);
    const holdTimerRef = useRef<number | null>(null);

    const onZonePointerDown = () => {
        holdRef.current = false;
        holdTimerRef.current = window.setTimeout(() => {
            holdRef.current = true;
        }, HOLD_MS);
        pause();
    };
    const onZonePointerEnd = () => {
        if (holdTimerRef.current !== null) {
            window.clearTimeout(holdTimerRef.current);
            holdTimerRef.current = null;
        }
        resume();
    };
    const onZoneClick = (navigate: () => void) => () => {
        if (holdRef.current) {
            holdRef.current = false;
            return;
        }
        navigate();
    };

    // Keyboard: Esc closes, arrows navigate, Space pauses/resumes.
    useEffect(() => {
        if (!state.open) return;
        const onKey = (event: KeyboardEvent) => {
            if (event.key === "Escape") close();
            else if (event.key === "ArrowRight") next();
            else if (event.key === "ArrowLeft") prev();
            else if (event.key === " ") {
                event.preventDefault();
                if (state.paused) resume();
                else pause();
            }
        };
        document.addEventListener("keydown", onKey);
        return () => document.removeEventListener("keydown", onKey);
    }, [state.open, state.paused, close, next, prev, pause, resume]);

    // Lock body scroll while open.
    useEffect(() => {
        if (!state.open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = previous;
        };
    }, [state.open]);

    // Keep the <video> and music <audio> play/pause in sync with the paused flag.
    useEffect(() => {
        const video = videoRef.current;
        if (video) {
            if (state.paused) video.pause();
            else void video.play().catch(() => {});
        }
        const audio = audioRef.current;
        if (audio) {
            if (state.paused) audio.pause();
            else if (currentItem?.type === "image" && currentItem.music) {
                void audio.play().catch(() => {});
            }
        }
    }, [state.paused, state.groupIndex, state.itemIndex, currentItem]);

    // Per-image music: when an image with `music` becomes active, point the
    // <audio> at its track and seek to `startTime`. An image without music
    // pauses the audio; video items leave it untouched (overlap is intentional).
    useEffect(() => {
        if (!state.open) return;
        const audio = audioRef.current;
        if (!audio || !currentItem) return;
        if (currentItem.type !== "image") return; // video: no audio change
        if (!currentItem.music) {
            audio.pause();
            return;
        }
        const { src, startTime = 0 } = currentItem.music;
        const startPlayback = () => {
            try {
                audio.currentTime = startTime;
            } catch {
                // currentTime can throw if the media is not seekable yet; ignore.
            }
            if (!state.paused) void audio.play().catch(() => {});
        };
        if (audioSrcRef.current !== src) {
            audioSrcRef.current = src;
            audio.src = src;
            const onLoaded = () => {
                audio.removeEventListener("loadedmetadata", onLoaded);
                startPlayback();
            };
            audio.addEventListener("loadedmetadata", onLoaded);
            audio.load();
            return () => audio.removeEventListener("loadedmetadata", onLoaded);
        }
        startPlayback();
    }, [state.open, state.groupIndex, state.itemIndex, currentItem]);

    // Bind the mute toggle to both elements (re-applied when the item changes so
    // a freshly mounted <video> picks up the current preference).
    useEffect(() => {
        if (audioRef.current) audioRef.current.muted = !soundOn;
        if (videoRef.current) videoRef.current.muted = !soundOn;
    }, [soundOn, state.groupIndex, state.itemIndex]);

    // The <audio> element unmounts on close; forget the src so a reopen re-sets it.
    useEffect(() => {
        if (!state.open) audioSrcRef.current = null;
    }, [state.open]);

    // Warm the cache for upcoming media so forward navigation is instant:
    // images for the next two items, the track for the very next one.
    useEffect(() => {
        if (!state.open) return;
        upcomingItems(groups, state.groupIndex, state.itemIndex, 2).forEach((item, index) => {
            if (item.type !== "image") return;
            prefetchImage(item.src);
            if (index === 0 && item.music) prefetchAudio(item.music.src);
        });
    }, [state.open, state.groupIndex, state.itemIndex, groups]);

    if (!state.open || !currentGroup || !currentItem) return null;

    const musicTrack =
        currentItem.type === "image" && currentItem.music
            ? getMusicTrackBySrc(currentItem.music.src)
            : undefined;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black"
            role="dialog"
            aria-modal="true"
            aria-label={labels.regionLabel}
        >
            <div className="relative flex h-full w-full max-w-md flex-col">
                {/* Progress + title + close */}
                <div className="absolute inset-x-0 top-0 z-10 flex flex-col gap-2 p-3">
                    <StoryProgress
                        count={currentGroup.items.length}
                        currentIndex={state.itemIndex}
                        progress={state.progress}
                    />
                    <div className="flex items-center justify-between text-white">
                        <div className="flex flex-col gap-2">
                            <p className="text-sm font-semibold drop-shadow">
                                {currentGroup.title[locale]}
                            </p>
                            {musicTrack && (
                                <>
                                    <p className="text-xs text-white/80 font-semibold">{musicTrack.title}</p>
                                    <p className="text-xs text-white/70">{musicTrack.artist}</p>
                                </>
                            )}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setSoundOn((s) => !s)}
                                aria-label={soundOn ? labels.muteAria : labels.unmuteAria}
                                aria-pressed={!soundOn}
                                className="text-white/90 drop-shadow hover:text-white"
                            >
                                {soundOn ? (
                                    <SoundOnIcon className="h-5 w-5" />
                                ) : (
                                    <SoundOffIcon className="h-5 w-5" />
                                )}
                            </button>
                            <button
                                type="button"
                                onClick={close}
                                aria-label={labels.closeAria}
                                className="text-2xl leading-none text-white/90 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>
                    </div>
                </div>

                {/* Media stage */}
                <div className="flex h-full w-full items-center justify-center">
                    {currentItem.type === "image" ? (
                        <img
                            src={currentItem.src}
                            alt={currentItem.caption?.[locale] ?? currentGroup.title[locale]}
                            className="max-h-full max-w-full object-contain"
                            fetchPriority="high"
                            decoding="async"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            key={`${state.groupIndex}-${state.itemIndex}`}
                            src={currentItem.src}
                            poster={currentItem.poster}
                            className="max-h-full max-w-full object-contain"
                            playsInline
                            autoPlay
                            preload="metadata"
                            onTimeUpdate={(e) => {
                                const v = e.currentTarget;
                                if (v.duration > 0) setProgress(v.currentTime / v.duration);
                            }}
                            onEnded={next}
                        />
                    )}
                </div>

                {/* Caption + address + related post */}
                {(currentItem.caption || currentItem.address || currentItem.post) && (
                    <div className="absolute inset-x-0 bottom-0 z-10 flex flex-col items-center gap-2 bg-gradient-to-t from-black/80 to-transparent p-4 pb-8 text-center text-white">
                        {currentItem.caption && (
                            <p className="text-sm">{currentItem.caption[locale]}</p>
                        )}
                        {currentItem.address &&
                            (() => {
                                const addressLink = pickLocalized(currentItem.address.link, locale);
                                const addressName = currentItem.address.name[locale];
                                return (
                                    <span className="inline-flex items-center gap-1 text-xs text-white/90">
                                        <PinIcon className="h-4 w-4 shrink-0" />
                                        {addressLink ? (
                                            <a
                                                href={addressLink}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium hover:underline"
                                            >
                                                {addressName}
                                            </a>
                                        ) : (
                                            <span className="font-medium">{addressName}</span>
                                        )}
                                    </span>
                                );
                            })()}
                        {currentItem.post &&
                            (() => {
                                const postLink = pickLocalized(currentItem.post.link, locale);
                                const postTitle = currentItem.post.title[locale];
                                return (
                                    <span className="inline-flex items-center gap-1 text-xs text-white/90">
                                        <PostIcon className="h-4 w-4 shrink-0" />
                                        {postLink ? (
                                            <a
                                                href={postLink}
                                                className="font-medium hover:underline"
                                            >
                                                {postTitle}
                                            </a>
                                        ) : (
                                            <span className="font-medium">{postTitle}</span>
                                        )}
                                    </span>
                                );
                            })()}
                    </div>
                )}

                {/* Tap zones: left = prev, right = next. Hold to pause. */}
                <button
                    type="button"
                    onClick={onZoneClick(prev)}
                    onPointerDown={onZonePointerDown}
                    onPointerUp={onZonePointerEnd}
                    onPointerLeave={onZonePointerEnd}
                    aria-label={labels.prevAria}
                    className="absolute inset-y-0 left-0 z-0 w-1/3 cursor-default"
                />
                <button
                    type="button"
                    onClick={onZoneClick(next)}
                    onPointerDown={onZonePointerDown}
                    onPointerUp={onZonePointerEnd}
                    onPointerLeave={onZonePointerEnd}
                    aria-label={labels.nextAria}
                    className="absolute inset-y-0 right-0 z-0 w-1/3 cursor-default"
                />

                {/* Per-image music. Hidden; controlled imperatively via audioRef. */}
                <audio ref={audioRef} preload="auto" />
            </div>
        </div>
    );
}

function SoundOnIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
    );
}

function SoundOffIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M11 5 6 9H2v6h4l5 4V5Z" />
            <path d="m23 9-6 6" />
            <path d="m17 9 6 6" />
        </svg>
    );
}

function PinIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="3" />
        </svg>
    );
}

function PostIcon({ className }: { className?: string }) {
    return (
        <svg
            className={className}
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
        >
            <path d="M4 4h11l5 5v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1Z" />
            <path d="M14 4v5h5" />
            <path d="M8 13h8M8 17h6" />
        </svg>
    );
}
