"use client";

import {
    useCallback,
    useEffect,
    useId,
    useLayoutEffect,
    useRef,
    useState,
    type ChangeEvent,
} from "react";
import type { MusicTrack } from "@/lib/music-tracks";
import { useStoriesOpen } from "@/lib/stories/stories-open-context";
import { MINIMIZED_KEY } from "./constants";
import { ExpandedPlayerBar } from "./expanded-player-bar";
import { MinimizedPlayerFab } from "./minimized-player-fab";
import type { SiteMusicPlayerLabels } from "./types";

type Props = {
    tracks: MusicTrack[];
    labels: SiteMusicPlayerLabels;
};

export function SiteMusicPlayer({ tracks, labels }: Props) {
    const { isOpen: storiesOpen } = useStoriesOpen();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [hydrated, setHydrated] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const wasPlayingBeforeStoriesRef = useRef(false);

    const track = tracks[currentIndex];
    const hasPlaylist = tracks.length > 1;
    const safeDuration = Number.isFinite(duration) && duration > 0 ? duration : 0;
    const miniProgressGradientId = `nam-mini-progress-${useId().replace(/:/g, "")}`;
    const minimizedProgress =
        safeDuration > 0 ? Math.min(1, Math.max(0, currentTime / safeDuration)) : 0;

    useLayoutEffect(() => {
        if (tracks.length === 0) {
            return;
        }
        setCurrentIndex(Math.floor(Math.random() * tracks.length));
    }, [tracks.length]);

    useEffect(() => {
        if (localStorage.getItem(MINIMIZED_KEY) === "1") {
            setMinimized(true);
        }
        setHydrated(true);
    }, []);

    useEffect(() => {
        if (!hydrated) {
            return;
        }
        localStorage.setItem(MINIMIZED_KEY, minimized ? "1" : "0");
        const main = document.getElementById("site-main");
        if (main) {
            if (storiesOpen) {
                main.classList.remove("pb-28", "pb-6");
            } else if (minimized) {
                main.classList.remove("pb-28");
                main.classList.add("pb-6");
            } else {
                main.classList.add("pb-28");
                main.classList.remove("pb-6");
            }
        }
    }, [minimized, hydrated, storiesOpen]);

    // Hide the site player while stories are open; pause if playing and resume on exit.
    useEffect(() => {
        const el = audioRef.current;
        if (storiesOpen) {
            wasPlayingBeforeStoriesRef.current = isPlaying;
            if (isPlaying && el) {
                el.pause();
                setIsPlaying(false);
            }
            return;
        }
        if (wasPlayingBeforeStoriesRef.current && el) {
            wasPlayingBeforeStoriesRef.current = false;
            void el.play().then(() => setIsPlaying(true)).catch(() => setIsPlaying(false));
        }
        // `isPlaying` is read only when `storiesOpen` flips true.
        // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional
    }, [storiesOpen]);

    useEffect(() => {
        if (!isPlaying) {
            return;
        }
        const el = audioRef.current;
        if (!el) {
            return;
        }
        void el.play().catch(() => setIsPlaying(false));
    }, [currentIndex, isPlaying]);

    const togglePlay = useCallback(() => {
        const el = audioRef.current;
        if (!el) {
            return;
        }
        if (el.paused) {
            void el
                .play()
                .then(() => setIsPlaying(true))
                .catch(() => setIsPlaying(false));
        } else {
            el.pause();
            setIsPlaying(false);
        }
    }, []);

    const goPrev = useCallback(() => {
        if (!hasPlaylist) {
            return;
        }
        setCurrentIndex((i) => (i <= 0 ? tracks.length - 1 : i - 1));
    }, [hasPlaylist, tracks.length]);

    const goNext = useCallback(() => {
        if (!hasPlaylist) {
            return;
        }
        setCurrentIndex((i) => (i >= tracks.length - 1 ? 0 : i + 1));
    }, [hasPlaylist, tracks.length]);

    const onEnded = useCallback(() => {
        if (hasPlaylist) {
            setCurrentIndex((i) => (i >= tracks.length - 1 ? 0 : i + 1));
        } else {
            setIsPlaying(false);
        }
    }, [hasPlaylist, tracks.length]);

    const onTimeUpdate = useCallback(() => {
        const el = audioRef.current;
        if (el) {
            setCurrentTime(el.currentTime);
        }
    }, []);

    const onLoadedMetadata = useCallback(() => {
        const el = audioRef.current;
        if (el) {
            setDuration(el.duration);
        }
    }, []);

    const onSeek = useCallback((e: ChangeEvent<HTMLInputElement>) => {
        const el = audioRef.current;
        const value = Number(e.target.value);
        if (el && Number.isFinite(value)) {
            el.currentTime = value;
            setCurrentTime(value);
        }
    }, []);

    const selectTrack = useCallback((index: number) => {
        setCurrentIndex(index);
    }, []);

    if (tracks.length === 0 || !track) {
        return null;
    }

    return (
        <>
            <audio
                ref={audioRef}
                src={track.src}
                preload="metadata"
                onEnded={onEnded}
                onTimeUpdate={onTimeUpdate}
                onLoadedMetadata={onLoadedMetadata}
                onPlay={() => setIsPlaying(true)}
                onPause={() => {
                    // Reaching the end pauses the element before `ended` fires; keep
                    // `isPlaying` true so the track-advance effect still calls `play()`.
                    const el = audioRef.current;
                    if (el?.ended) {
                        return;
                    }
                    setIsPlaying(false);
                }}
            />
            {!storiesOpen &&
                (minimized ? (
                    <MinimizedPlayerFab
                        gradientId={miniProgressGradientId}
                        labels={labels}
                        progress={minimizedProgress}
                        onExpand={() => setMinimized(false)}
                    />
                ) : (
                    <ExpandedPlayerBar
                        currentIndex={currentIndex}
                        currentTime={currentTime}
                        goNext={goNext}
                        goPrev={goPrev}
                        hasPlaylist={hasPlaylist}
                        isPlaying={isPlaying}
                        labels={labels}
                        onMinimize={() => setMinimized(true)}
                        onSeek={onSeek}
                        onSelectTrack={selectTrack}
                        safeDuration={safeDuration}
                        togglePlay={togglePlay}
                        track={track}
                        tracks={tracks}
                    />
                ))}
        </>
    );
}
