"use client";

import { useEffect, useRef } from "react";
import type { Locale } from "@/i18n/config";
import type { StoryLabels } from "@/i18n/dictionaries";
import type { StoryGroup } from "@/interfaces/story";
import { StoryProgress } from "./story-progress";
import type { useStoryPlayer } from "./use-story-player";

const HOLD_MS = 250; // press longer than this is a hold (pause), not a tap (navigate)

type Player = ReturnType<typeof useStoryPlayer>;

type Props = {
    groups: StoryGroup[];
    locale: Locale;
    labels: StoryLabels;
    player: Player;
};

export function StoryViewer({ locale, labels, player }: Props) {
    const { state, currentGroup, currentItem, close, next, prev, pause, resume, setProgress } =
        player;
    const videoRef = useRef<HTMLVideoElement>(null);
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

    // Keep the <video> element's play/pause in sync with the paused flag.
    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (state.paused) video.pause();
        else void video.play().catch(() => {});
    }, [state.paused, state.groupIndex, state.itemIndex]);

    if (!state.open || !currentGroup || !currentItem) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
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
                        <span className="text-sm font-semibold drop-shadow">
                            {currentGroup.title[locale]}
                        </span>
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

                {/* Media stage */}
                <div className="flex h-full w-full items-center justify-center">
                    {currentItem.type === "image" ? (
                        <img
                            src={currentItem.src}
                            alt={currentItem.caption?.[locale] ?? currentGroup.title[locale]}
                            className="max-h-full max-w-full object-contain"
                        />
                    ) : (
                        <video
                            ref={videoRef}
                            key={`${state.groupIndex}-${state.itemIndex}`}
                            src={currentItem.src}
                            poster={currentItem.poster}
                            className="max-h-full max-w-full object-contain"
                            muted
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

                {/* Caption */}
                {currentItem.caption && (
                    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/70 to-transparent p-4 pb-8 text-center text-sm text-white">
                        {currentItem.caption[locale]}
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
            </div>
        </div>
    );
}
